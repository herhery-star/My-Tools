/**
 * MY TOOLS — Personal HTML App Launcher Architecture (V1)
 */

const STORAGE_KEY = 'MY_TOOLS_REGISTRY_V1';
const THEME_KEY = 'MY_TOOLS_THEME';

// Initial Seed Data
const DEFAULT_APPS = [
  {
    id: "tool-spbu-daily",
    name: "SPBU Daily",
    description: "Input dan pengolahan data harian SPBU (Pertalite, Biosolar, Pertamax).",
    category: "SPBU",
    icon: "⛽",
    version: "1.0.0",
    onlineUrl: "https://example.com/spbu-daily",
    localPath: "D:/MyTools/SPBU-Daily/index.html",
    favorite: true,
    order: 1
  },
  {
    id: "tool-excel-merger",
    name: "Excel Merger",
    description: "Gabungkan beberapa file Excel menjadi satu sheet secara cepat.",
    category: "Excel",
    icon: "📊",
    version: "1.4.0",
    onlineUrl: "https://example.com/excel-merger",
    localPath: "D:/MyTools/Excel-Merger/index.html",
    favorite: true,
    order: 2
  },
  {
    id: "tool-excel-sorter",
    name: "Excel Sorter",
    description: "Sortir dan filter data Excel berdasarkan aturan khusus.",
    category: "Excel",
    icon: "🔎",
    version: "1.1.0",
    onlineUrl: "",
    localPath: "D:/MyTools/Excel-Sorter/index.html",
    favorite: false,
    order: 3
  },
  {
    id: "tool-pdf-tools",
    name: "PDF Tools",
    description: "Kumpulan utility manipulasi PDF (Merge, Split, Watermark).",
    category: "PDF",
    icon: "📄",
    version: "2.0.0",
    onlineUrl: "https://example.com/pdf-tools",
    localPath: "",
    favorite: false,
    order: 4
  },
  {
    id: "tool-pdf-signature",
    name: "PDF Signature",
    description: "Menempatkan tanda tangan digital langsung pada dokumen PDF.",
    category: "PDF",
    icon: "✍️",
    version: "1.0.2",
    onlineUrl: "",
    localPath: "D:/MyTools/PDF-Signature/index.html",
    favorite: false,
    order: 5
  },
  {
    id: "tool-ref-vault",
    name: "Reference Vault",
    description: "Repository referensi teknis, dokumentasi, dan cheat sheet.",
    category: "Reference",
    icon: "📚",
    version: "1.0.0",
    onlineUrl: "https://example.com/vault",
    localPath: "",
    favorite: false,
    order: 6
  }
];

// Application State
let apps = [];
let activeCategory = 'All';
let searchQuery = '';
let currentSort = 'custom';
let deleteTargetId = null;

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
const appForm = document.getElementById('appForm');
const categorySuggestions = document.getElementById('categorySuggestions');
const networkStatus = document.getElementById('networkStatus');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  loadApps();
  setupEventListeners();
  checkNetworkStatus();
  registerServiceWorker();
});

// Load Data from LocalStorage
function loadApps() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      apps = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse stored registry data:", e);
      apps = [...DEFAULT_APPS];
    }
  } else {
    apps = [...DEFAULT_APPS];
    saveApps();
  }
  renderUI();
}

function saveApps() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  renderUI();
}

// Render Core UI
function renderUI() {
  renderCategories();
  renderGrids();
}

// Category Filters
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

// Process & Filter Apps
function getFilteredApps() {
  return apps.filter(app => {
    const matchesCategory = 
      activeCategory === 'All' ? true :
      activeCategory === '⭐ Favorit' ? app.favorite :
      app.category.toLowerCase() === activeCategory.toLowerCase();

    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name);
    if (currentSort === 'name-desc') return b.name.localeCompare(a.name);
    if (currentSort === 'category') return a.category.localeCompare(b.category);
    return (a.order || 0) - (b.order || 0);
  });
}

// Render App Cards
function renderGrids() {
  const filtered = getFilteredApps();
  const favorites = filtered.filter(a => a.favorite);

  // Render Favorites Section
  if (activeCategory === 'All' && searchQuery === '' && favorites.length > 0) {
    favoritesSection.style.display = 'block';
    favoritesGrid.innerHTML = favorites.map(createCardHTML).join('');
  } else {
    favoritesSection.style.display = 'none';
  }

  // Render Main Grid
  if (filtered.length === 0) {
    allAppsGrid.innerHTML = '';
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    allAppsGrid.innerHTML = filtered.map(createCardHTML).join('');
  }
}

// Generate Card Component
function createCardHTML(app) {
  const targetUrl = app.onlineUrl || app.localPath || '#';
  const isLocalOnly = !app.onlineUrl && app.localPath;

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

// Actions & Event Handlers
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
    saveApps();
  }
}

function handleAppOpen(event, id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;

  if (!app.onlineUrl && app.localPath) {
    if (app.localPath.startsWith('http://') || app.localPath.startsWith('https://') || app.localPath.startsWith('file://')) {
      return; // Izinkan navigasi alami jika format URL valid
    }
    event.preventDefault();
    alert(`Versi lokal terdaftar: ${app.localPath}\n\nKebijakan Keamanan Browser membatasi eksekusi langsung arbitrary path file sistem lokal.\n\nUntuk membuka file ini: Salin path ke browser, atau jalankan aplikasi ini melalui Wrapper Desktop (.exe).`);
  } else if (!app.onlineUrl && !app.localPath) {
    event.preventDefault();
    alert("URL atau Local Path aplikasi belum dikonfigurasi.");
  }
}

// Add & Edit Modals
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
  document.getElementById('appLocalPath').value = app.localPath || '';
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
  const newAppData = {
    id: id || 'tool-' + Date.now(),
    name: document.getElementById('appName').value.trim(),
    description: document.getElementById('appDesc').value.trim(),
    category: document.getElementById('appCategory').value.trim(),
    icon: document.getElementById('appIcon').value.trim() || '🧰',
    onlineUrl: document.getElementById('appOnlineUrl').value.trim(),
    localPath: document.getElementById('appLocalPath').value.trim(),
    version: document.getElementById('appVersion').value.trim(),
    favorite: document.getElementById('appFavorite').checked,
    order: id ? (apps.find(a => a.id === id)?.order || apps.length + 1) : apps.length + 1
  };

  if (id) {
    const index = apps.findIndex(a => a.id === id);
    if (index !== -1) apps[index] = newAppData;
  } else {
    apps.push(newAppData);
  }

  saveApps();
  closeModal();
};

function duplicateApp(id) {
  const app = apps.find(a => a.id === id);
  if (!app) return;

  const duplicated = {
    ...app,
    id: 'tool-' + Date.now(),
    name: `${app.name} Copy`,
    order: apps.length + 1
  };

  apps.push(duplicated);
  saveApps();
}

function moveApp(id, direction) {
  const index = apps.findIndex(a => a.id === id);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= apps.length) return;

  // Swap order
  const temp = apps[index];
  apps[index] = apps[targetIndex];
  apps[targetIndex] = temp;

  // Re-assign order indexing
  apps.forEach((a, i) => a.order = i + 1);
  saveApps();
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
    apps = apps.filter(a => a.id !== deleteTargetId);
    saveApps();
    deleteTargetId = null;
  }
  deleteModal.classList.remove('show');
};

document.getElementById('cancelDeleteBtn').onclick = () => deleteModal.classList.remove('show');
document.getElementById('closeDeleteModalBtn').onclick = () => deleteModal.classList.remove('show');

// Event Listeners Setup
function setupEventListeners() {
  document.getElementById('addAppBtn').onclick = openAddModal;
  document.getElementById('emptyAddBtn').onclick = openAddModal;
  document.getElementById('closeModalBtn').onclick = closeModal;
  document.getElementById('cancelModalBtn').onclick = closeModal;

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

// Theme Handling
function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  document.getElementById('themeToggleBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Network Status Monitor
function checkNetworkStatus() {
  const updateStatus = () => {
    if (navigator.onLine) {
      networkStatus.className = 'status-badge';
      networkStatus.querySelector('.status-text').textContent = 'Online';
    } else {
      networkStatus.className = 'status-badge offline';
      networkStatus.querySelector('.status-text').textContent = 'Offline';
    }
  };
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

// Helpers
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Service Worker Registration for PWA
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.log('SW Reg Failed:', err));
  }
}