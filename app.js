/**
 * MY TOOLS V2 — Personal Multi-Device HTML App Launcher (Core Logic)
 */

// Storage Keys
const STORAGE_KEYS = {
  V1_REGISTRY: 'MY_TOOLS_REGISTRY_V1',
  V1_BACKUP: 'MY_TOOLS_REGISTRY_V1_BACKUP',
  V2_CACHE: 'MY_TOOLS_REGISTRY_V2_CACHE',
  LOCAL_PATHS: 'MY_TOOLS_LOCAL_PATHS_V2',
  PENDING_QUEUE: 'MY_TOOLS_PENDING_QUEUE',
  CONFIG: 'MY_TOOLS_CONFIG_V2',
  THEME: 'MY_TOOLS_THEME'
};

// Initial Seed Data (V1 Default Items)
const DEFAULT_APPS = [
  {
    id: "tool-spbu-daily",
    name: "SPBU Daily",
    description: "Input dan pengolahan data harian SPBU (Pertalite, Biosolar, Pertamax).",
    category: "SPBU",
    icon: "⛽",
    version: "1.0.0",
    onlineUrl: "https://example.com/spbu-daily",
    favorite: true,
    order: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  },
  {
    id: "tool-excel-merger",
    name: "Excel Merger",
    description: "Gabungkan beberapa file Excel menjadi satu sheet secara cepat.",
    category: "Excel",
    icon: "📊",
    version: "1.4.0",
    onlineUrl: "https://example.com/excel-merger",
    favorite: true,
    order: 2,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  },
  {
    id: "tool-excel-sorter",
    name: "Excel Sorter",
    description: "Sortir dan filter data Excel berdasarkan aturan khusus.",
    category: "Excel",
    icon: "🔎",
    version: "1.1.0",
    onlineUrl: "",
    favorite: false,
    order: 3,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  },
  {
    id: "tool-pdf-tools",
    name: "PDF Tools",
    description: "Kumpulan utility manipulasi PDF (Merge, Split, Watermark).",
    category: "PDF",
    icon: "📄",
    version: "2.0.0",
    onlineUrl: "https://example.com/pdf-tools",
    favorite: false,
    order: 4,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  },
  {
    id: "tool-pdf-signature",
    name: "PDF Signature",
    description: "Menempatkan tanda tangan digital langsung pada dokumen PDF.",
    category: "PDF",
    icon: "✍️",
    version: "1.0.2",
    onlineUrl: "",
    favorite: false,
    order: 5,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  },
  {
    id: "tool-ref-vault",
    name: "Reference Vault",
    description: "Repository referensi teknis, dokumentasi, dan cheat sheet.",
    category: "Reference",
    icon: "📚",
    version: "1.0.0",
    onlineUrl: "https://example.com/vault",
    favorite: false,
    order: 6,
    updatedAt: new Date().toISOString(),
    updatedBy: "System"
  }
];

// App State
let apps = [];
let localPathsMap = {};
let pendingQueue = [];
let config = {
  apiUrl: '',
  deviceId: '',
  deviceName: 'Browser Device',
  lastSyncTime: null
};

let activeCategory = 'All';
let searchQuery = '';
let currentSort = 'custom';
let deleteTargetId = null;
let isSyncing = false;

// DOM Elements
const allAppsGrid = document.getElementById('allAppsGrid');
const favoritesGrid = document.getElementById('favoritesGrid');
const favoritesSection = document.getElementById('favoritesSection');
const categoryBar = document.getElementById('categoryBar');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortSelect = document.getElementById('sortSelect');
const emptyState = document.getElementById('emptyState');
const appModal = document.getElementById('appModal');
const deleteModal = document.getElementById('deleteModal');
const settingsModal = document.getElementById('settingsModal');
const appForm = document.getElementById('appForm');
const categorySuggestions = document.getElementById('categorySuggestions');

// Status UI Elements
const syncStatusBadge = document.getElementById('syncStatusBadge');
const syncDot = document.getElementById('syncDot');
const syncText = document.getElementById('syncText');

// LifeCycle Initiation
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  initConfigAndDevice();
  loadLocalPaths();
  loadPendingQueue();
  migrateAndLoadCache();
  setupEventListeners();
  checkNetworkStatus();
  registerServiceWorker();

  // Background Sync jika Online
  if (navigator.onLine && config.apiUrl) {
    syncWithCloud();
  }
});

// 1. CONFIG & MIGRATION LAYER
function initConfigAndDevice() {
  const storedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  if (storedConfig) {
    try {
      config = { ...config, ...JSON.parse(storedConfig) };
    } catch (e) {
      console.error("Failed to parse config:", e);
    }
  }

  if (!config.deviceId) {
    config.deviceId = 'MYTOOLS-DEV-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    saveConfig();
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
}

function loadLocalPaths() {
  const stored = localStorage.getItem(STORAGE_KEYS.LOCAL_PATHS);
  if (stored) {
    try { localPathsMap = JSON.parse(stored); } catch (e) { localPathsMap = {}; }
  }
}

function saveLocalPaths() {
  localStorage.setItem(STORAGE_KEYS.LOCAL_PATHS, JSON.stringify(localPathsMap));
}

function loadPendingQueue() {
  const stored = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
  if (stored) {
    try { pendingQueue = JSON.parse(stored); } catch (e) { pendingQueue = []; }
  }
}

function savePendingQueue() {
  localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(pendingQueue));
  updateSyncBadgeUI();
}

function migrateAndLoadCache() {
  // 1. Cek V2 Cache
  const cachedV2 = localStorage.getItem(STORAGE_KEYS.V2_CACHE);
  if (cachedV2) {
    try {
      apps = JSON.parse(cachedV2);
      renderUI();
      return;
    } catch (e) {
      console.error("V2 Cache error:", e);
    }
  }

  // 2. Jika V2 kosong, cek Migrasi dari V1
  const storedV1 = localStorage.getItem(STORAGE_KEYS.V1_REGISTRY);
  if (storedV1) {
    try {
      const appsV1 = JSON.parse(storedV1);
      // Backup V1
      localStorage.setItem(STORAGE_KEYS.V1_BACKUP, storedV1);
      
      // Transform V1 -> V2
      apps = appsV1.map((item, index) => {
        if (item.localPath) {
          localPathsMap[item.id] = item.localPath;
        }
        return {
          id: item.id || 'tool-' + Date.now() + '-' + index,
          name: item.name || 'Untitled',
          description: item.description || '',
          category: item.category || 'General',
          icon: item.icon || '🧰',
          version: item.version || '1.0.0',
          onlineUrl: item.onlineUrl || '',
          favorite: !!item.favorite,
          order: item.order || (index + 1),
          updatedAt: new Date().toISOString(),
          updatedBy: config.deviceName
        };
      });
      saveLocalPaths();
      saveAppsCache();
      renderUI();
      return;
    } catch (e) {
      console.error("V1 Migration failed:", e);
    }
  }

  // 3. Fallback jika aplikasi baru pertama kali dibuka
  apps = [...DEFAULT_APPS];
  saveAppsCache();
  renderUI();
}

function saveAppsCache() {
  localStorage.setItem(STORAGE_KEYS.V2_CACHE, JSON.stringify(apps));
  renderUI();
}

// 2. DUAL-WAY CLOUD SYNC ENGINE
async function syncWithCloud() {
  if (!config.apiUrl) {
    updateSyncBadgeUI('NO_API');
    return;
  }
  if (!navigator.onLine || isSyncing) {
    updateSyncBadgeUI();
    return;
  }

  isSyncing = true;
  updateSyncBadgeUI('SYNCING');

  try {
    const payload = {
      action: 'BATCH_SYNC',
      payload: {
        pendingChanges: pendingQueue
      }
    };

    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Untuk bypass CORS Preflight GAS
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      // 1. Bersihkan pending queue yang telah diproses server
      if (result.processedChangeIds && result.processedChangeIds.length > 0) {
        pendingQueue = pendingQueue.filter(change => !result.processedChangeIds.includes(change.clientChangeId));
        savePendingQueue();
      }

      // 2. Merge master data dari Cloud dengan local device state
      if (result.apps && Array.isArray(result.apps)) {
        mergeRemoteApps(result.apps);
      }

      config.lastSyncTime = new Date().toISOString();
      saveConfig();
      updateSyncBadgeUI('SYNCED');
    } else {
      console.warn("GAS Error Response:", result.error);
      updateSyncBadgeUI('ERROR');
    }
  } catch (error) {
    console.error("Failed to sync with Google Sheets:", error);
    updateSyncBadgeUI('OFFLINE_OR_ERROR');
  } finally {
    isSyncing = false;
  }
}

function mergeRemoteApps(remoteApps) {
  // Sederhana: Remote Apps yang valid dijadikan dasar utama, 
  // namun jika ada item lokal dengan updatedAt lebih baru (belum di-push), kita pertahankan.
  const mergedMap = new Map();

  // Load Remote Apps
  remoteApps.forEach(remote => {
    mergedMap.set(remote.id, remote);
  });

  // Check Local Overrides
  apps.forEach(local => {
    const remote = mergedMap.get(local.id);
    if (!remote) {
      // Jika lokal memiliki pending queue CREATE/UPDATE, simpan lokal
      const hasPending = pendingQueue.some(p => p.recordId === local.id);
      if (hasPending) {
        mergedMap.set(local.id, local);
      }
    } else {
      const localTime = new Date(local.updatedAt || 0).getTime();
      const remoteTime = new Date(remote.updatedAt || 0).getTime();
      if (localTime > remoteTime) {
        mergedMap.set(local.id, local);
      }
    }
  });

  apps = Array.from(mergedMap.values());
  saveAppsCache();
}

// 3. QUEUE SYSTEM UNTUK OFFLINE MODIFICATION
function addPendingChange(action, recordId, data = null) {
  const changeItem = {
    clientChangeId: 'change-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    action: action, // CREATE, UPDATE, DELETE
    recordId: recordId,
    data: data,
    createdAt: new Date().toISOString()
  };

  pendingQueue.push(changeItem);
  savePendingQueue();

  if (navigator.onLine && config.apiUrl) {
    syncWithCloud();
  }
}

// 4. UI RENDERING & FILTERING
function renderUI() {
  renderCategories();
  renderGrids();
  updateSyncBadgeUI();
}

function renderCategories() {
  const categories = ['All', '⭐ Favorit', ...new Set(apps.map(a => a.category).filter(Boolean))];
  categoryBar.innerHTML = '';
  categorySuggestions.innerHTML = '';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = `cat-btn ${cat === activeCategory ? 'active' : ''}`;
    btn.textContent = cat;
    btn.onclick = () => {
      activeCategory = cat;
      renderUI();
    };
    categoryBar.appendChild(btn);

    if (cat !== 'All' && cat !== '⭐ Favorit') {
      const option = document.createElement('option');
      option.value = cat;
      categorySuggestions.appendChild(option);
    }
  });
}

function getFilteredApps() {
  return apps.filter(app => {
    const matchesCategory = 
      activeCategory === 'All' ? true :
      activeCategory === '⭐ Favorit' ? app.favorite :
      app.category.toLowerCase() === activeCategory.toLowerCase();

    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      app.name.toLowerCase().includes(q) ||
      (app.description && app.description.toLowerCase().includes(q)) ||
      (app.category && app.category.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    if (currentSort === 'name-desc') return b.name.localeCompare(a.name);
    if (currentSort === 'category') return (a.category || '').localeCompare(b.category || '');
    return (a.order || 0) - (b.order || 0);
  });
}

function renderGrids() {
  const filtered = getFilteredApps();
  const favorites = filtered.filter(a => a.favorite);

  if (activeCategory === 'All' && searchQuery === '' && favorites.length > 0) {
    favoritesSection.style.display = 'block';
    favoritesGrid.innerHTML = favorites.map(createCardHTML).join('');
  } else {
    favoritesSection.style.display = 'none';
  }

  if (filtered.length === 0) {
    allAppsGrid.innerHTML = '';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    allAppsGrid.innerHTML = filtered.map(createCardHTML).join('');
  }
}

function createCardHTML(app) {
  const localPath = localPathsMap[app.id] || '';
  const targetUrl = app.onlineUrl || localPath || '#';
  const isLocalOnly = !app.onlineUrl && localPath;

  return `
    <article class="app-card" data-id="${app.id}">
      <div class="card-header">
        <span class="card-icon">${app.icon || '🧰'}</span>
        <div class="card-actions-menu">
          <button class="btn-icon-sm" onclick="toggleCardMenu(event, '${app.id}')" aria-label="Menu Aksi">⋮</button>
          <div class="card-dropdown" id="dropdown-${app.id}">
            <button onclick="openEditModal('${app.id}')">✏️ Edit</button>
            <button onclick="duplicateApp('${app.id}')">📋 Duplikat</button>
            <button onclick="moveApp('${app.id}', -1)">⬆️ Naik</button>
            <button onclick="moveApp('${app.id}', 1)">⬇️ Turun</button>
            <button onclick="confirmDelete('${app.id}')" style="color: #ef4444;">🗑️ Hapus</button>
          </div>
        </div>
      </div>
      <div>
        <h3 class="card-title">${escapeHTML(app.name)}</h3>
        <p class="card-desc">${escapeHTML(app.description || 'Tidak ada deskripsi.')}</p>
      </div>
      <div>
        <div class="card-meta">
          <span class="card-badge">${escapeHTML(app.category)}</span>
          <span>${app.version ? 'v' + escapeHTML(app.version) : ''} ${isLocalOnly ? '• 💾 Local' : '• ☁️ Online'}</span>
        </div>
        <div class="card-footer">
          <a href="${escapeHTML(targetUrl)}" target="_blank" class="btn-open" onclick="handleAppOpen(event, '${app.id}')">
            BUKA →
          </a>
          <button class="btn-fav ${app.favorite ? 'active' : ''}" onclick="toggleFavorite('${app.id}')" aria-label="Favorit">
            ${app.favorite ? '★' : '☆'}
          </button>
        </div>
      </div>
    </article>
  `;
}

// 5. CARD & TOOLBAR ACTIONS
function toggleCardMenu(event, id) {
  event.stopPropagation();
  closeAllDropdowns();
  const dropdown = document.getElementById(`dropdown-${id}`);
  if (dropdown) dropdown.classList.toggle('show');
}

function closeAllDropdowns() {
  document.querySelectorAll('.card-dropdown').forEach(el => el.classList.remove('show'));
}
document.addEventListener('click', closeAllDropdowns);

function toggleFavorite(id) {
  const app = apps.find(a => a.id === id);
  if (app) {
    app.favorite = !app.favorite;
    app.updatedAt = new Date().toISOString();
    app.updatedBy = config.deviceName;
    
    saveAppsCache();
    addPendingChange('UPDATE', app.id, app);
  }
}

function handleAppOpen(event, id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;

  const localPath = localPathsMap[app.id] || '';

  if (!app.onlineUrl && localPath) {
    if (localPath.startsWith('http://') || localPath.startsWith('https://') || localPath.startsWith('file://')) {
      return;
    }
    event.preventDefault();
    alert(`Versi lokal terdaftar: ${localPath}\n\nKebijakan Keamanan Browser membatasi akses eksekusi langsung ke file sistem lokal.\n\nUntuk membuka: Salin path ke browser address bar, atau gunakan Launcher ini via Desktop Wrapper (.exe).`);
  } else if (!app.onlineUrl && !localPath) {
    event.preventDefault();
    alert("URL Online maupun Local Path belum dikonfigurasi untuk aplikasi ini.");
  }
}

// Modal Handlers
function openAddModal() {
  appForm.reset();
  document.getElementById('appId').value = '';
  document.getElementById('modalTitle').textContent = 'Tambah Tool Baru';
  appModal.classList.add('show');
}

function openEditModal(id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;

  document.getElementById('appId').value = app.id;
  document.getElementById('appName').value = app.name;
  document.getElementById('appDesc').value = app.description || '';
  document.getElementById('appCategory').value = app.category;
  document.getElementById('appIcon').value = app.icon || '🧰';
  document.getElementById('appOnlineUrl').value = app.onlineUrl || '';
  document.getElementById('appLocalPath').value = localPathsMap[app.id] || '';
  document.getElementById('appVersion').value = app.version || '';
  document.getElementById('appFavorite').checked = !!app.favorite;

  document.getElementById('modalTitle').textContent = 'Edit Tool';
  appModal.classList.add('show');
}

function closeModal() {
  appModal.classList.remove('show');
}

appForm.onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById('appId').value;
  const localPathInput = document.getElementById('appLocalPath').value.trim();
  const isNew = !id;

  const appData = {
    id: id || 'tool-' + Date.now(),
    name: document.getElementById('appName').value.trim(),
    description: document.getElementById('appDesc').value.trim(),
    category: document.getElementById('appCategory').value.trim(),
    icon: document.getElementById('appIcon').value.trim() || '🧰',
    onlineUrl: document.getElementById('appOnlineUrl').value.trim(),
    version: document.getElementById('appVersion').value.trim(),
    favorite: document.getElementById('appFavorite').checked,
    order: isNew ? (apps.length + 1) : (apps.find(a => a.id === id)?.order || apps.length + 1),
    updatedAt: new Date().toISOString(),
    updatedBy: config.deviceName
  };

  // Simpan Local Path unik di perangkat ini
  if (localPathInput) {
    localPathsMap[appData.id] = localPathInput;
  } else {
    delete localPathsMap[appData.id];
  }
  saveLocalPaths();

  if (isNew) {
    apps.push(appData);
    saveAppsCache();
    addPendingChange('CREATE', appData.id, appData);
  } else {
    const idx = apps.findIndex(a => a.id === id);
    if (idx !== -1) apps[idx] = appData;
    saveAppsCache();
    addPendingChange('UPDATE', appData.id, appData);
  }

  closeModal();
};

function duplicateApp(id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;

  const newId = 'tool-' + Date.now();
  const duplicated = {
    ...app,
    id: newId,
    name: `${app.name} Copy`,
    order: apps.length + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: config.deviceName
  };

  if (localPathsMap[id]) {
    localPathsMap[newId] = localPathsMap[id];
    saveLocalPaths();
  }

  apps.push(duplicated);
  saveAppsCache();
  addPendingChange('CREATE', newId, duplicated);
}

function moveApp(id, direction) {
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= apps.length) return;

  const temp = apps[index];
  apps[index] = apps[targetIndex];
  apps[targetIndex] = temp;

  apps.forEach((a, i) => {
    a.order = i + 1;
    a.updatedAt = new Date().toISOString();
    a.updatedBy = config.deviceName;
  });

  saveAppsCache();
  addPendingChange('UPDATE', apps[index].id, apps[index]);
  addPendingChange('UPDATE', apps[targetIndex].id, apps[targetIndex]);
}

function confirmDelete(id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;
  deleteTargetId = id;
  document.getElementById('deleteMessage').textContent = `Apakah Anda yakin ingin menghapus "${app.name}" dari My Tools?`;
  deleteModal.classList.add('show');
}

document.getElementById('confirmDeleteBtn').onclick = () => {
  if (deleteTargetId) {
    const targetId = deleteTargetId;
    apps = apps.filter(a => a.id !== targetId);
    delete localPathsMap[targetId];
    saveLocalPaths();
    saveAppsCache();

    addPendingChange('DELETE', targetId, null);
    deleteTargetId = null;
  }
  deleteModal.classList.remove('show');
};

document.getElementById('cancelDeleteBtn').onclick = () => deleteModal.classList.remove('show');
document.getElementById('closeDeleteModalBtn').onclick = () => deleteModal.classList.remove('show');

// 6. SETTINGS MODAL & EVENT LISTENERS
function openSettingsModal() {
  document.getElementById('settingApiUrl').value = config.apiUrl || '';
  document.getElementById('settingDeviceName').value = config.deviceName || '';
  document.getElementById('infoDeviceId').textContent = config.deviceId;
  document.getElementById('infoLastSync').textContent = config.lastSyncTime ? new Date(config.lastSyncTime).toLocaleString('id-ID') : 'Belum tersinkron';
  document.getElementById('infoPendingCount').textContent = `${pendingQueue.length} item(s)`;
  document.getElementById('infoSyncStatus').textContent = syncText.textContent;
  
  settingsModal.classList.add('show');
}

function closeSettingsModal() {
  settingsModal.classList.remove('show');
}

document.getElementById('saveSettingsBtn').onclick = () => {
  config.apiUrl = document.getElementById('settingApiUrl').value.trim();
  config.deviceName = document.getElementById('settingDeviceName').value.trim() || 'Browser Device';
  saveConfig();
  closeSettingsModal();
  syncWithCloud();
};

document.getElementById('testConnBtn').onclick = async () => {
  const testUrl = document.getElementById('settingApiUrl').value.trim();
  if (!testUrl) {
    alert("Masukkan URL Google Apps Script terlebih dahulu.");
    return;
  }
  try {
    const res = await fetch(`${testUrl}?action=GET`);
    const data = await res.json();
    if (data.success) {
      alert("✅ Koneksi Berhasil! Google Apps Script merespons dengan baik.");
    } else {
      alert("⚠️ Koneksi terhubung namun Apps Script mengembalikan error: " + data.error);
    }
  } catch (err) {
    alert("❌ Gagal Terhubung: " + err.message + "\n\nPastikan Deployment Web App di-set ke 'Anyone'.");
  }
};

document.getElementById('resetCacheBtn').onclick = () => {
  if (confirm("Reset local cache akan menghapus data cache lokal dan memuat ulang dari cloud. Lanjutkan?")) {
    localStorage.removeItem(STORAGE_KEYS.V2_CACHE);
    apps = [];
    closeSettingsModal();
    if (config.apiUrl) syncWithCloud();
    else renderUI();
  }
};

function setupEventListeners() {
  document.getElementById('addAppBtn').onclick = openAddModal;
  document.getElementById('emptyAddBtn').onclick = openAddModal;
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;
  document.getElementById('settingsBtn').onclick = openSettingsModal;
  document.getElementById('closeSettingsModalBtn').onclick = closeSettingsModal;
  syncStatusBadge.onclick = openSettingsModal;

  searchInput.oninput = (e) => {
    searchQuery = e.target.value;
    clearSearchBtn.hidden = !searchQuery;
    renderGrids();
  };

  clearSearchBtn.onclick = () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.hidden = true;
    renderGrids();
  };

  sortSelect.onchange = (e) => {
    currentSort = e.target.value;
    renderGrids();
  };

  document.getElementById('themeToggleBtn').onclick = toggleTheme;
}

// 7. STATUS BADGE UI & HELPER
function updateSyncBadgeUI(overrideState = null) {
  if (overrideState === 'SYNCING') {
    syncStatusBadge.className = 'status-badge syncing';
    syncDot.className = 'status-dot syncing';
    syncText.textContent = '⟳ Syncing...';
    return;
  }
  if (overrideState === 'NO_API') {
    syncStatusBadge.className = 'status-badge offline';
    syncDot.className = 'status-dot offline';
    syncText.textContent = 'API belum diatur';
    return;
  }

  if (!navigator.onLine) {
    syncStatusBadge.className = 'status-badge offline';
    syncDot.className = 'status-dot offline';
    syncText.textContent = '○ Offline';
  } else if (pendingQueue.length > 0) {
    syncStatusBadge.className = 'status-badge pending';
    syncDot.className = 'status-dot pending';
    syncText.textContent = `⚠ ${pendingQueue.length} Pending`;
  } else if (config.lastSyncTime) {
    syncStatusBadge.className = 'status-badge synced';
    syncDot.className = 'status-dot synced';
    const timeStr = new Date(config.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    syncText.textContent = `☁ Synced ${timeStr}`;
  } else {
    syncStatusBadge.className = 'status-badge';
    syncDot.className = 'status-dot';
    syncText.textContent = '● Online';
  }
}

function checkNetworkStatus() {
  window.addEventListener('online', () => {
    updateSyncBadgeUI();
    if (config.apiUrl) syncWithCloud();
  });
  window.addEventListener('offline', () => {
    updateSyncBadgeUI();
  });
}

function loadTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.THEME) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(STORAGE_KEYS.THEME, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  document.getElementById('themeToggleBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// 8. SERVICE WORKER & PWA UPDATE ENGINE
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showPwaUpdateBanner(newWorker);
          }
        });
      });
    }).catch(err => console.log('SW Reg Failed:', err));
  }
}

function showPwaUpdateBanner(worker) {
  const banner = document.getElementById('pwaUpdateBanner');
  const reloadBtn = document.getElementById('pwaReloadBtn');
  if (banner && reloadBtn) {
    banner.hidden = false;
    reloadBtn.onclick = () => {
      worker.postMessage({ action: 'skipWaiting' });
      window.location.reload();
    };
  }
}