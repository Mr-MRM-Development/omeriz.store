// Konfigurasi API GitHub
const apiUrl = "https://api.github.com/repos/Mr-MRM-Development/omeriz.inv/contents/omeriz_version";
    
// Elemen DOM
const appsGrid = document.getElementById('appsGrid');
const filterInput = document.getElementById('filter');
const searchBtn = document.getElementById('searchBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const fileCount = document.getElementById('fileCount');
const filterInfo = document.getElementById('filterInfo');
const appDetailModal = document.getElementById('appDetailModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.querySelector('.close-modal');
const windowControls = document.querySelectorAll('.window-control');

let allFiles = [];
let filteredFiles = [];
let currentPage = 1;
const perPage = 8;

// Warna untuk card aplikasi
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

// Format tanggal
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Generate rating acak untuk file (hanya untuk tampilan)
function generateRandomRating() {
  return (Math.random() * 1.5 + 3.5).toFixed(1); // Rating antara 3.5 - 5.0
}

// Generate jumlah download acak
function generateRandomDownloads() {
  const downloads = Math.floor(Math.random() * 900) + 100; // 100 - 1000
  return downloads > 1000 ? (downloads/1000).toFixed(1) + 'K' : downloads.toString();
}

// Ambil data dari GitHub
async function loadFiles() {
  try {
    appsGrid.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
    
    const res = await fetch(apiUrl);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      showError("Gagal memuat data dari GitHub. Struktur respons tidak sesuai.");
      return;
    }

    // Filter hanya file RAR
    allFiles = data.filter(f => f.name.endsWith(".rar"));
    filteredFiles = [...allFiles];
    
    updateFileCount();
    renderFiles();
    
  } catch (err) {
    console.error(err);
    showError("Terjadi kesalahan saat memuat data: " + err.message);
  }
}

// Tampilkan error
function showError(message) {
  appsGrid.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
      <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 12px;"></i>
      <h3>Terjadi Kesalahan</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="loadFiles()" style="margin-top: 12px;">
        <i class="fas fa-redo"></i> Coba Lagi
      </button>
    </div>
  `;
}

// Update informasi file
function updateFileCount() {
  fileCount.textContent = `${allFiles.length} file tersedia`;
  
  if (filterInput.value) {
    filterInfo.textContent = `${filteredFiles.length} file cocok dengan pencarian`;
  } else {
    filterInfo.textContent = "";
  }
}

// Filter file
function filterFiles() {
  const val = filterInput.value.toLowerCase();
  filteredFiles = allFiles.filter(f => f.name.toLowerCase().includes(val));
  currentPage = 1;
  updateFileCount();
  renderFiles();
}

// Render file ke grid
function renderFiles() {
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  const pageFiles = filteredFiles.slice(start, end);

  appsGrid.innerHTML = '';
  
  if (pageFiles.length === 0) {
    appsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 12px;"></i>
        <h3>Tidak ada file ditemukan</h3>
        <p>Coba ubah kata kunci pencarian atau reset filter</p>
        <button class="btn btn-primary" onclick="filterInput.value=''; filterFiles();" style="margin-top: 12px;">
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
    
    // Ekstrak informasi dari nama file
    const fileName = file.name.replace('.rar', '');
    const fileSize = formatBytes(file.size);
    const fileDate = formatDate(file.created_at || file.updated_at);
    const rating = generateRandomRating();
    const downloads = generateRandomDownloads();
    
    appCard.innerHTML = `
      <div class="app-image" style="background: ${colorGradients[colorIndex]}">
        <i class="fas fa-file-archive"></i>
        <div class="app-badge">RAR</div>
      </div>
      <div class="app-info">
        <div class="app-title">${fileName}</div>
        <div class="app-developer">oleh MRM Development</div>
        <div class="app-description">File arsip RAR berisi aplikasi atau data terkait.</div>
        <div class="app-meta">
          <div class="app-rating">
            <div class="stars">${'★'.repeat(Math.floor(rating))}${rating % 1 >= 0.5 ? '½' : ''}</div>
            <span class="rating-value">${rating}</span>
          </div>
          <div class="app-size">${fileSize}</div>
        </div>
        <div class="app-actions">
          <button class="btn btn-secondary detail-btn" data-name="${file.name}" data-size="${fileSize}" data-date="${fileDate}" data-url="${file.download_url}">
            <i class="fas fa-info-circle"></i> Detail
          </button>
          <a href="${file.download_url}" target="_blank" class="btn btn-primary download-btn">
            <i class="fas fa-download"></i> Unduh
          </a>
        </div>
      </div>
    `;
    
    appsGrid.appendChild(appCard);
  });

  // Tambahkan event listeners untuk tombol detail
  document.querySelectorAll('.detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fileName = btn.getAttribute('data-name');
      const fileSize = btn.getAttribute('data-size');
      const fileDate = btn.getAttribute('data-date');
      const fileUrl = btn.getAttribute('data-url');
      showFileDetail(fileName, fileSize, fileDate, fileUrl);
    });
  });

  // Event listener untuk membuka detail saat card diklik
  document.querySelectorAll('.app-card').forEach((card, index) => {
    card.addEventListener('click', () => {
      const btn = card.querySelector('.detail-btn');
      const fileName = btn.getAttribute('data-name');
      const fileSize = btn.getAttribute('data-size');
      const fileDate = btn.getAttribute('data-date');
      const fileUrl = btn.getAttribute('data-url');
      showFileDetail(fileName, fileSize, fileDate, fileUrl);
    });
  });

  updatePagination();
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredFiles.length / perPage);
  pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// Tampilkan detail file
function showFileDetail(name, size, date, url) {
  const fileName = name.replace('.rar', '');
  
  modalBody.innerHTML = `
    <div class="app-detail-header">
      <div class="app-detail-image" style="background: ${colorGradients[0]}">
        <i class="fas fa-file-archive"></i>
      </div>
      <div class="app-detail-info">
        <div class="app-detail-title">${fileName}</div>
        <div class="app-detail-developer">oleh MRM Development</div>
        <div class="app-detail-meta">
          <div class="app-detail-rating">
            <div class="stars">★★★★☆</div>
            <span class="rating-value">4.5</span>
            <span>(500+ unduhan)</span>
          </div>
        </div>
        <div class="app-detail-actions">
          <a href="${url}" target="_blank" class="btn btn-primary">
            <i class="fas fa-download"></i> Unduh (${size})
          </a>
          <button class="btn btn-secondary">
            <i class="fas fa-share"></i> Bagikan
          </button>
        </div>
      </div>
    </div>
    
    <div class="app-detail-description">
      <h3>Deskripsi</h3>
      <p>File arsip RAR berisi aplikasi atau data terkait. File ini dapat dibuka menggunakan aplikasi seperti WinRAR, 7-Zip, atau aplikasi ekstraksi file lainnya.</p>
    </div>
    
    <div>
      <h3>Informasi File</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; margin-top: 8px;">
        <div><strong>Nama File:</strong> ${name}</div>
        <div><strong>Ukuran:</strong> ${size}</div>
        <div><strong>Format:</strong> RAR</div>
        <div><strong>Tanggal Upload:</strong> ${date}</div>
        <div><strong>Developer:</strong> MRM Development</div>
        <div><strong>Kategori:</strong> Arsip</div>
      </div>
    </div>
    
    <div>
      <h3>Instruksi</h3>
      <p>Setelah mengunduh file, ekstrak menggunakan aplikasi seperti WinRAR atau 7-Zip. Ikuti instruksi dalam file README jika tersedia.</p>
    </div>
  `;

  appDetailModal.style.display = 'flex';
}

// Event listeners lainnya
filterInput.addEventListener('input', filterFiles);
searchBtn.addEventListener('click', filterFiles);

filterInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') filterFiles();
});

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderFiles();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage * perPage < filteredFiles.length) {
    currentPage++;
    renderFiles();
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

// Keyboard shortcuts untuk Windows
document.addEventListener('keydown', (e) => {
  // Ctrl + F untuk focus search
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    filterInput.focus();
    filterInput.select();
  }
  
  // Escape untuk close modal
  if (e.key === 'Escape') {
    appDetailModal.style.display = 'none';
  }
  
  // Alt untuk akses key (simulasi)
  if (e.altKey) {
    // Alt bisa digunakan untuk keyboard navigation
    e.preventDefault();
  }
});

// Double click pada title bar untuk maximize (Windows behavior)
document.querySelector('.title-bar').addEventListener('dblclick', () => {
  const maximizeBtn = document.querySelector('.maximize');
  maximizeBtn.click();
});

// Inisialisasi
loadFiles();

// Untuk Electron: Handle window state changes
if (typeof require !== 'undefined') {
  const { remote } = require('electron');
  const currentWindow = remote.getCurrentWindow();
  
  // Update maximize button ketika window state berubah
  currentWindow.on('maximize', () => {
    document.querySelector('.maximize').innerHTML = '<i class="far fa-window-restore"></i>';
  });
  
  currentWindow.on('unmaximize', () => {
    document.querySelector('.maximize').innerHTML = '<i class="far fa-square"></i>';
  });
}