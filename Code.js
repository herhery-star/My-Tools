/**
 * MY TOOLS V2 — Google Apps Script Backend Web App API
 */

const SHEET_NAME = 'Apps';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Tunggu maksimal 10 detik jika ada konkurensi write
  lock.tryLock(10000);

  try {
    let action = 'GET';
    let payload = null;

    if (e && e.parameter && e.parameter.action) {
      action = e.parameter.action;
    }

    if (e && e.postData && e.postData.contents) {
      try {
        const body = JSON.parse(e.postData.contents);
        if (body.action) action = body.action;
        if (body.payload) payload = body.payload;
      } catch (err) {
        // Fallback jika POST data bukan JSON
      }
    }

    const sheet = getOrCreateSheet();
    let result = { success: false };

    switch (action) {
      case 'GET':
        result = { success: true, apps: readAllApps(sheet) };
        break;
      case 'BATCH_SYNC':
        result = handleBatchSync(sheet, payload);
        break;
      case 'CREATE':
      case 'UPDATE':
        result = upsertApp(sheet, payload);
        break;
      case 'DELETE':
        result = deleteApp(sheet, payload ? payload.id : e.parameter.id);
        break;
      default:
        result = { success: false, error: 'Action tidak dikenal.' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = ['id', 'name', 'description', 'category', 'icon', 'onlineUrl', 'version', 'favorite', 'order', 'updatedAt', 'updatedBy'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function readAllApps(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const apps = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip baris kosong

    const app = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (header === 'favorite') {
        val = (val === true || String(val).toUpperCase() === 'TRUE');
      } else if (header === 'order') {
        val = Number(val) || 0;
      }
      app[header] = val;
    });
    apps.push(app);
  }
  return apps;
}

function upsertApp(sheet, appData) {
  if (!appData || !appData.id || !appData.name) {
    return { success: false, error: 'Data tidak lengkap (id dan name wajib).' };
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  let rowIndex = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(appData.id)) {
      rowIndex = i + 1; // 1-based index untuk SpreadsheetApp
      break;
    }
  }

  const rowValues = headers.map(header => {
    let val = appData[header];
    if (val === undefined || val === null) val = '';
    if (header === 'favorite') val = Boolean(val);
    return val;
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return { success: true, app: appData };
}

function deleteApp(sheet, id) {
  if (!id) return { success: false, error: 'ID tidak valid untuk dihapus.' };

  const data = sheet.getDataRange().getValues();
  const idIndex = data[0].indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, deletedId: id };
    }
  }

  return { success: true, message: 'Record tidak ditemukan, diasumsikan sudah terhapus.' };
}

function handleBatchSync(sheet, payload) {
  if (!payload) return { success: false, error: 'Payload kosong.' };

  const pendingChanges = payload.pendingChanges || [];
  const processedChangeIds = [];

  // 1. Jalankan semua perubahan lokal yang tertunda
  pendingChanges.forEach(change => {
    if (change.action === 'CREATE' || change.action === 'UPDATE') {
      const res = upsertApp(sheet, change.data);
      if (res.success) processedChangeIds.push(change.clientChangeId);
    } else if (change.action === 'DELETE') {
      const res = deleteApp(sheet, change.recordId);
      if (res.success) processedChangeIds.push(change.clientChangeId);
    }
  });

  // 2. Ambil master data terbaru dari Sheets
  const currentApps = readAllApps(sheet);

  return {
    success: true,
    processedChangeIds: processedChangeIds,
    apps: currentApps
  };
}