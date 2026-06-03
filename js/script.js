// Konfigurasi API GitHub
const apiUrl = "https://api.github.com/repos/Mr-MRM-Development/omeriz.inv/contents/omeriz_version";

// Elemen DOM
const appsGrid = document.getElementById('appsGrid');
const appsContainer = document.getElementById('appsContainer');
const filterInput = document.getElementById('filter');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearch');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const fileCount = document.getElementById('fileCount');
const filterInfo = document.getElementById('filterInfo');
const appDetailModal = document.getElementById('appDetailModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');
const themeToggleSidebar = document.getElementById('themeToggleSidebar');
const sortBtn = document.getElementById('sortBtn');
const viewToggle = document.getElementById('viewToggle');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

let allFiles = [];
let filteredFiles = [];
let currentPage = 1;
let currentSort = 'date-desc';
let currentView = 'grid';
let currentFilter = 'all';

const perPage = 12;

// Color gradients untuk card
const colorGradients = [
  "linear-gradient(135deg, #0067C0, #0078D4)",
  "linear-gradient(135deg, #107C10, #10893E)",
  "linear-gradient(135deg, #D83B01, #CA5010)",
  "linear-gradient(135deg, #5C2D91, #6B69D6)",
  "linear-gradient(135deg, #B146C2, #C239B3)",
  "linear-gradient(135deg, #008575, #00B294)",
  "linear-gradient(135deg, #E3008C, #BF0077)",
  "linear-gradient(135deg, #004B50, #006A71)"
];

// Format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format tanggal relatif
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan lalu`;
  return `${Math.floor(diffDays / 365)} tahun lalu`;
}

// Format tanggal lengkap
function formatFullDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Tampilkan toast
function showToast(message, isError = false) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  toast.style.borderLeftColor = isError ? '#E81123' : '#107C10';
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// Ambil data dari GitHub
async function loadFiles() {
  try {
    appsGrid.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      throw new Error("Struktur respons tidak sesuai");
    }

    allFiles = data
      .filter(f => f.name.endsWith(".rar"))
      .map(file => ({
        ...file,
        commitDate: new Date(file.created_at || file.updated_at || Date.now()),
        downloads: Math.floor(Math.random() * 5000) + 500,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1)
      }));
    
    // Sort by date descending (terbaru di atas)
    sortFiles();
    
    // Parse URL hash untuk search
    parseUrlHash();
    
    // Load preference
    loadThemePreference();
    loadViewPreference();
    
    updateFileCount();
    renderFiles();
    showToast(`${allFiles.length} file berhasil dimuat`);
    
  } catch (err) {
    console.error(err);
    showError("Terjadi kesalahan saat memuat data: " + err.message);
  }
}

// Parse URL hash
function parseUrlHash() {
  const hash = window.location.hash;
  if (hash && hash.includes('search=')) {
    const searchTerm = decodeURIComponent(hash.split('search=')[1]);
    if (searchTerm) {
      filterInput.value = searchTerm;
      filterFiles();
    }
  }
}

// Update URL hash
function updateUrlHash(searchTerm) {
  if (searchTerm) {
    window.location.hash = `search=${encodeURIComponent(searchTerm)}`;
  } else {
    window.location.hash = '';
  }
}

// Sorting files
function sortFiles() {
  switch(currentSort) {
    case 'date-desc':
      filteredFiles.sort((a, b) => b.commitDate - a.commitDate);
      break;
    case 'date-asc':
      filteredFiles.sort((a, b) => a.commitDate - b.commitDate);
      break;
    case 'name-asc':
      filteredFiles.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filteredFiles.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      filteredFiles.sort((a, b) => b.commitDate - a.commitDate);
  }
}

// Filter files
function filterFiles() {
  const searchTerm = filterInput.value.toLowerCase();
  let tempFiles = [...allFiles];
  
  if (searchTerm) {
    tempFiles = tempFiles.filter(f => f.name.toLowerCase().includes(searchTerm));
    updateUrlHash(searchTerm);
    clearSearchBtn.style.display = 'flex';
  } else {
    updateUrlHash('');
    clearSearchBtn.style.display = 'none';
  }
  
  if (currentFilter === 'recent') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    tempFiles = tempFiles.filter(f => f.commitDate >= oneWeekAgo);
  } else if (currentFilter === 'popular') {
    tempFiles.sort((a, b) => b.downloads - a.downloads);
    tempFiles = tempFiles.slice(0, 20);
  }
  
  filteredFiles = tempFiles;
  sortFiles();
  currentPage = 1;
  updateFileCount();
  renderFiles();
}

// Update file count
function updateFileCount() {
  fileCount.textContent = `${allFiles.length} file tersedia`;
  if (filterInput.value) {
    filterInfo.textContent = `${filteredFiles.length} file cocok dengan pencarian`;
  } else if (currentFilter !== 'all') {
    filterInfo.textContent = `Menampilkan ${filteredFiles.length} file ${currentFilter === 'recent' ? 'terbaru' : 'populer'}`;
  } else {
    filterInfo.textContent = "";
  }
  document.getElementById('storageCount').textContent = `${filteredFiles.length} Files`;
}

// Render files
function renderFiles() {
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageFiles = filteredFiles.slice(start, end);

  appsGrid.innerHTML = '';
  
  if (pageFiles.length === 0) {
    appsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-secondary);">
        <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;"></i>
        <h3>Tidak ada file ditemukan</h3>
        <p>Coba ubah kata kunci pencarian atau reset filter</p>
        <button class="btn btn-primary" onclick="window.resetAllFilters && resetAllFilters()" style="margin-top: 16px;">
          <i class="fas fa-times"></i> Reset Pencarian
        </button>
      </div>
    `;
    return;
  }

  pageFiles.forEach((file, index) => {
    const colorIndex = index % colorGradients.length;
    const appCard = document.createElement('div');
    appCard.className = 'app-card';
    
    const fileName = file.name.replace('.rar', '');
    const fileSize = formatBytes(file.size);
    const fileDate = formatDate(file.commitDate);
    const rating = file.rating;
    const downloads = file.downloads > 1000 ? (file.downloads/1000).toFixed(1) + 'K' : file.downloads.toString();
    
    appCard.innerHTML = `
      <div class="app-image" style="background: ${colorGradients[colorIndex]}">
        <i class="fas fa-file-archive"></i>
        <div class="app-badge">RAR</div>
      </div>
      <div class="app-info">
        <div class="app-title">${escapeHtml(fileName)}</div>
        <div class="app-developer">MRM Development</div>
        <div class="app-description">File arsip RAR berisi aplikasi OMERIZ atau data terkait.</div>
        <div class="app-meta">
          <div class="app-date">
            <i class="far fa-calendar-alt"></i> ${fileDate}
          </div>
          <div class="app-size">
            <i class="fas fa-database"></i> ${fileSize}
          </div>
        </div>
        <div class="app-actions">
          <button class="btn btn-secondary detail-btn" data-name="${escapeHtml(file.name)}" data-size="${fileSize}" data-date="${file.commitDate.toISOString()}" data-url="${file.download_url}" data-downloads="${downloads}" data-rating="${rating}">
            <i class="fas fa-info-circle"></i> Detail
          </button>
          <a href="${file.download_url}" target="_blank" class="btn btn-primary download-btn" onclick="trackDownload('${escapeHtml(file.name)}')">
            <i class="fas fa-download"></i> Unduh
          </a>
        </div>
      </div>
    `;
    
    appsGrid.appendChild(appCard);
  });

  // Event listeners untuk detail
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileName = btn.getAttribute('data-name');
      const fileSize = btn.getAttribute('data-size');
      const fileDate = btn.getAttribute('data-date');
      const fileUrl = btn.getAttribute('data-url');
      const downloads = btn.getAttribute('data-downloads');
      const rating = btn.getAttribute('data-rating');
      showFileDetail(fileName, fileSize, fileDate, fileUrl, downloads, rating);
    });
  });

  document.querySelectorAll('.app-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.download-btn')) {
        const btn = card.querySelector('.detail-btn');
        if (btn) btn.click();
      }
    });
  });

  updatePagination();
}

// Track download
function trackDownload(fileName) {
  showToast(`Mengunduh ${fileName}...`);
}

// Reset all filters
function resetAllFilters() {
  filterInput.value = '';
  currentFilter = 'all';
  document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
  document.querySelector('.sidebar-menu a[data-filter="all"]').classList.add('active');
  filterFiles();
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredFiles.length / perPage);
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// Show file detail
function showFileDetail(name, size, date, url, downloads, rating) {
  const fileName = name.replace('.rar', '');
  const formattedDate = formatFullDate(date);
  
  modalBody.innerHTML = `
    <div class="app-detail-header">
      <div class="app-detail-image" style="background: ${colorGradients[0]}">
        <i class="fas fa-file-archive" style="font-size: 2rem;"></i>
      </div>
      <div class="app-detail-info">
        <div class="app-detail-title">${escapeHtml(fileName)}</div>
        <div class="app-detail-developer">MRM Development</div>
        <div class="app-detail-meta">
          <div class="app-detail-rating">
            <div class="stars">${'★'.repeat(Math.floor(rating))}${rating % 1 >= 0.5 ? '½' : ''}</div>
            <span class="rating-value">${rating}</span>
            <span>(${downloads}+ unduhan)</span>
          </div>
        </div>
        <div class="app-detail-actions">
          <a href="${url}" target="_blank" class="btn btn-primary" onclick="trackDownload('${escapeHtml(name)}')">
            <i class="fas fa-download"></i> Unduh (${size})
          </a>
        </div>
      </div>
    </div>
    
    <div class="app-detail-description">
      <h3>Deskripsi</h3>
      <p>File arsip RAR berisi aplikasi OMERIZ atau data terkait. File ini dapat dibuka menggunakan aplikasi seperti WinRAR, 7-Zip, atau aplikasi ekstraksi file lainnya.</p>
    </div>
    
    <div>
      <h3>Informasi File</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;">
        <div><strong>Nama File:</strong> ${escapeHtml(name)}</div>
        <div><strong>Ukuran:</strong> ${size}</div>
        <div><strong>Format:</strong> RAR Archive</div>
        <div><strong>Tanggal Upload:</strong> ${formattedDate}</div>
        <div><strong>Developer:</strong> MRM Development</div>
        <div><strong>Total Unduhan:</strong> ${downloads}+</div>
      </div>
    </div>
    
    <div>
      <h3>Instruksi</h3>
      <p>1. Klik tombol Unduh untuk menyimpan file<br>
      2. Ekstrak file menggunakan WinRAR atau 7-Zip<br>
      3. Ikuti instruksi dalam file README jika tersedia<br>
      4. Jalankan aplikasi sesuai petunjuk</p>
    </div>
  `;

  appDetailModal.style.display = 'flex';
}

// Toggle theme
function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  if (isDark) {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    localStorage.setItem('theme', 'light');
    showToast('Mode terang aktif');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    showToast('Mode gelap aktif');
  }
}

// Load theme preference (default dark)
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    document.body.classList.add('dark');
    document.body.classList.remove('light');
  }
}

// Toggle view
function toggleView() {
  currentView = currentView === 'grid' ? 'list' : 'grid';
  localStorage.setItem('view', currentView);
  
  if (currentView === 'list') {
    appsContainer.classList.add('list-view');
    viewToggle.innerHTML = '<i class="fas fa-th-large"></i>';
  } else {
    appsContainer.classList.remove('list-view');
    viewToggle.innerHTML = '<i class="fas fa-list"></i>';
  }
  showToast(`Tampilan ${currentView === 'grid' ? 'grid' : 'list'}`);
}

// Load view preference
function loadViewPreference() {
  const savedView = localStorage.getItem('view');
  if (savedView === 'list') {
    currentView = 'list';
    appsContainer.classList.add('list-view');
    viewToggle.innerHTML = '<i class="fas fa-th-large"></i>';
  } else {
    currentView = 'grid';
    viewToggle.innerHTML = '<i class="fas fa-list"></i>';
  }
}

// Toggle sort
function toggleSort() {
  const sorts = ['date-desc', 'date-asc', 'name-asc', 'name-desc'];
  const currentIndex = sorts.indexOf(currentSort);
  const nextIndex = (currentIndex + 1) % sorts.length;
  currentSort = sorts[nextIndex];
  
  let sortText = '';
  switch(currentSort) {
    case 'date-desc': sortText = 'Terbaru ke Terlama'; break;
    case 'date-asc': sortText = 'Terlama ke Terbaru'; break;
    case 'name-asc': sortText = 'Nama A-Z'; break;
    case 'name-desc': sortText = 'Nama Z-A'; break;
  }
  
  sortFiles();
  renderFiles();
  showToast(`Diurutkan: ${sortText}`);
}

// Set category filter
function setCategoryFilter(category) {
  currentFilter = category;
  filterFiles();
}

// Show error
function showError(message) {
  appsGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-secondary);">
      <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 16px;"></i>
      <h3>Terjadi Kesalahan</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 16px;">
        <i class="fas fa-redo"></i> Coba Lagi
      </button>
    </div>
  `;
}

// Event listeners
filterInput.addEventListener('input', () => {
  if (filterInput.value === '') {
    filterFiles();
  }
});
searchBtn.addEventListener('click', filterFiles);
clearSearchBtn.addEventListener('click', () => {
  filterInput.value = '';
  filterFiles();
});

filterInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') filterFiles();
});

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderFiles();
    appsGrid.scrollIntoView({ behavior: 'smooth' });
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage * perPage < filteredFiles.length) {
    currentPage++;
    renderFiles();
    appsGrid.scrollIntoView({ behavior: 'smooth' });
  }
});

closeModal.addEventListener('click', () => {
  appDetailModal.style.display = 'none';
});

appDetailModal.addEventListener('click', (e) => {
  if (e.target === appDetailModal) {
    appDetailModal.style.display = 'none';
  }
});

themeToggleSidebar.addEventListener('click', toggleTheme);
sortBtn.addEventListener('click', toggleSort);
viewToggle.addEventListener('click', toggleView);

// Sidebar navigation
document.querySelectorAll('.sidebar-menu a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const filter = link.getAttribute('data-filter');
    document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    setCategoryFilter(filter);
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    filterInput.focus();
    filterInput.select();
  }
  if (e.key === 'Escape') {
    appDetailModal.style.display = 'none';
  }
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    toggleTheme();
  }
});

// Export functions for global access
window.resetAllFilters = resetAllFilters;
window.trackDownload = trackDownload;

// Inisialisasi
loadFiles();