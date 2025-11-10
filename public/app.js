// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const selectedFileSection = document.getElementById('selectedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFile');
const uploadBtn = document.getElementById('uploadBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultSection = document.getElementById('resultSection');
const resultDetails = document.getElementById('resultDetails');
const downloadLink = document.getElementById('downloadLink');
const processAnotherBtn = document.getElementById('processAnother');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const tryAgainBtn = document.getElementById('tryAgain');

// State
let selectedFile = null;

// Initialize
init();

function init() {
  setupEventListeners();
}

function setupEventListeners() {
  // Drop zone events
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);

  // File input
  fileInput.addEventListener('change', handleFileSelect);

  // Buttons
  removeFileBtn.addEventListener('click', resetForm);
  uploadBtn.addEventListener('click', handleUpload);
  processAnotherBtn.addEventListener('click', resetForm);
  tryAgainBtn.addEventListener('click', resetForm);

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
  });
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function handleDragOver(e) {
  e.preventDefault();
  dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFile(file) {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  selectedFile = file;
  displaySelectedFile(file);
}

function validateFile(file) {
  // Check file size (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 10MB.'
    };
  }

  // Check file extension
  const allowedExtensions = ['.pdf', '.docx', '.md', '.txt'];
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
}

function displaySelectedFile(file) {
  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  
  dropZone.style.display = 'none';
  selectedFileSection.style.display = 'block';
  errorSection.style.display = 'none';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function handleUpload() {
  if (!selectedFile) return;

  // Show progress
  selectedFileSection.style.display = 'none';
  progressSection.style.display = 'block';
  resultSection.style.display = 'none';
  errorSection.style.display = 'none';

  uploadBtn.disabled = true;

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + '%';
    }, 500);

    // Upload file
    progressText.textContent = 'Uploading and processing document...';
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    progressBar.style.width = '100%';

    const result = await response.json();

    if (response.ok && result.success) {
      showSuccess(result);
    } else {
      throw new Error(result.error || 'Processing failed');
    }

  } catch (error) {
    console.error('Upload error:', error);
    showError(error.message || 'Failed to process document. Please try again.');
  } finally {
    uploadBtn.disabled = false;
  }
}

function showSuccess(result) {
  progressSection.style.display = 'none';
  resultSection.style.display = 'block';

  // Build result details
  const details = `
    <p><strong>Visualizations Found:</strong> <span>${result.visualizationsFound}</span></p>
    <p><strong>Visualizations Rendered:</strong> <span>${result.visualizationsRendered}</span></p>
    <p><strong>Pages:</strong> <span>${result.numPages}</span></p>
    <p><strong>File Size:</strong> <span>${result.fileSizeMB} MB</span></p>
    <p><strong>Processing Time:</strong> <span>${(result.processingTimeMs / 1000).toFixed(2)}s</span></p>
    <p><strong>Searchable:</strong> <span>${result.searchable ? '✓ Yes' : '✗ No'}</span></p>
  `;
  
  resultDetails.innerHTML = details;

  // Set download link
  downloadLink.href = result.downloadUrl;
  downloadLink.download = `processed-${selectedFile.name.replace(/\.[^.]+$/, '')}.pdf`;

  // Auto-download
  setTimeout(() => {
    downloadLink.click();
  }, 500);
}

function showError(message) {
  progressSection.style.display = 'none';
  resultSection.style.display = 'none';
  errorSection.style.display = 'block';
  selectedFileSection.style.display = 'none';
  dropZone.style.display = 'block';

  errorMessage.textContent = message;
}

function resetForm() {
  selectedFile = null;
  fileInput.value = '';
  
  dropZone.style.display = 'block';
  selectedFileSection.style.display = 'none';
  progressSection.style.display = 'none';
  resultSection.style.display = 'none';
  errorSection.style.display = 'none';
  
  progressBar.style.width = '0%';
  progressText.textContent = 'Processing...';
  uploadBtn.disabled = false;
}

// Handle page visibility for cleanup
document.addEventListener('visibilitychange', () => {
  if (document.hidden && selectedFile) {
    console.log('Page hidden, maintaining state');
  }
});
