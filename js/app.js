/**
 * Badge Generator - UP Le Renouveau
 * JavaScript Application
 */

// DOM Elements
const badgeForm = document.getElementById('badgeForm');
const prenomInput = document.getElementById('prenom');
const nomInput = document.getElementById('nom');
const photoInput = document.getElementById('photo');
const photoUpload = document.getElementById('photoUpload');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const photoPreview = document.getElementById('photoPreview');
const badgeSection = document.getElementById('badgeSection');
const badgePhoto = document.getElementById('badgePhoto');
const badgeName = document.getElementById('badgeName');
const badge = document.getElementById('badge');
const downloadBtn = document.getElementById('downloadBtn');
const shareWhatsApp = document.getElementById('shareWhatsApp');
const shareFacebook = document.getElementById('shareFacebook');
const newBadgeBtn = document.getElementById('newBadgeBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const formSection = document.querySelector('.form-section');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const badgePhotoZone = document.getElementById('badgePhotoZone');

// Gallery Elements
const galleryPreview = document.getElementById('galleryPreview');
const galleryPreviewScroll = document.getElementById('galleryPreviewScroll');
const galleryPreviewEmpty = document.getElementById('galleryPreviewEmpty');
const badgeCounter = document.getElementById('badgeCounter');
const seeAllBadgesBtn = document.getElementById('seeAllBadgesBtn');
const galleryFull = document.getElementById('galleryFull');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');
const galleryGrid = document.getElementById('galleryGrid');
const galleryEmpty = document.getElementById('galleryEmpty');
const galleryLoading = document.getElementById('galleryLoading');
const galleryBadgeCount = document.getElementById('galleryBadgeCount');

// Store the generated image
let generatedImageBlob = null;
let generatedImageUrl = null;

// Gallery storage key (for local fallback)
const GALLERY_STORAGE_KEY = 'up_renouveau_badges_gallery';

// API URL - Change this after deploying to Vercel
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api/badges'
    : 'https://badge-up-renouveau.vercel.app/api/badges';

// Image adjustment state
let currentScale = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX, startY;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupEventListeners();
    setupImageAdjustment();
    loadGalleryPreview();
}

function setupEventListeners() {
    // Photo upload click handler
    photoUpload.addEventListener('click', (e) => {
        if (e.target !== photoInput) {
            photoInput.click();
        }
    });
    
    // Photo input change handler
    photoInput.addEventListener('change', handlePhotoSelect);
    
    // Form submission
    badgeForm.addEventListener('submit', handleFormSubmit);
    
    // Download button
    downloadBtn.addEventListener('click', handleDownload);
    
    // Share buttons
    shareWhatsApp.addEventListener('click', handleWhatsAppShare);
    shareFacebook.addEventListener('click', handleFacebookShare);
    
    // New badge button
    newBadgeBtn.addEventListener('click', resetForm);
    
    // Drag and drop support
    photoUpload.addEventListener('dragover', handleDragOver);
    photoUpload.addEventListener('dragleave', handleDragLeave);
    photoUpload.addEventListener('drop', handleDrop);
    
    // Gallery events
    seeAllBadgesBtn.addEventListener('click', openFullGallery);
    closeGalleryBtn.addEventListener('click', closeFullGallery);
    // Publication automatique - plus besoin du bouton
    // document.getElementById('publishToGallery').addEventListener('click', handlePublishToGallery);
}

// Photo handling
function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processPhoto(file);
        // Reset input to allow selecting the same file again
        e.target.value = '';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    photoUpload.style.borderColor = 'var(--primary-color)';
    photoUpload.style.background = 'rgba(26, 95, 42, 0.1)';
}

function handleDragLeave(e) {
    e.preventDefault();
    photoUpload.style.borderColor = '';
    photoUpload.style.background = '';
}

function handleDrop(e) {
    e.preventDefault();
    photoUpload.style.borderColor = '';
    photoUpload.style.background = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processPhoto(file);
    }
}

function processPhoto(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide.');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('L\'image est trop volumineuse. Taille maximale : 10 Mo.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        photoPreview.src = e.target.result;
        photoPreview.classList.add('active');
        uploadPlaceholder.style.display = 'none';
        
        // Auto-adjust preview position
        photoPreview.onload = () => {
            if (photoPreview.naturalHeight > photoPreview.naturalWidth) {
                photoPreview.style.objectPosition = 'center 15%';
            } else {
                photoPreview.style.objectPosition = 'center center';
            }
        };
    };
    reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier.');
    };
    reader.readAsDataURL(file);
}

// Form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const photoSrc = photoPreview.src;
    
    // Validation
    if (!prenom || !nom) {
        alert('Veuillez remplir tous les champs.');
        return;
    }
    
    if (!photoSrc || !photoPreview.classList.contains('active')) {
        alert('Veuillez ajouter une photo.');
        return;
    }
    
    // Show loading
    showLoading();
    
    // Switch views immediately to ensure dimensions are available for calculation
    formSection.style.display = 'none';
    badgeSection.style.display = 'block';

    // Update badge content
    badgeName.textContent = `${prenom} ${nom.toUpperCase()}`;
    badgePhoto.src = photoSrc;
    
    // Reset adjustments
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    updateImageTransform();
    
    // Wait for image to load and adjust position
    await new Promise((resolve) => {
        const adjustAndResolve = () => {
            fitImageToZone();
            resolve();
        };

        if (badgePhoto.complete) {
            adjustAndResolve();
        } else {
            badgePhoto.onload = adjustAndResolve;
        }
    });
    
    // Generate image
    await generateBadgeImage();
    
    // Hide loading
    hideLoading();
    
    // Scroll to badge
    badgeSection.scrollIntoView({ behavior: 'smooth' });
}

// Generate badge image using html2canvas - 1080x1080px HD
async function generateBadgeImage() {
    try {
        // Calculate scale to get 1080px output
        const badgeWidth = badge.offsetWidth;
        const targetSize = 1080;
        const scale = targetSize / badgeWidth;
        
        const canvas = await html2canvas(badge, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: badgeWidth,
            height: badgeWidth // Square format
        });
        
        // Convert to blob and auto-publish to gallery
        canvas.toBlob(async (blob) => {
            generatedImageBlob = blob;
            generatedImageUrl = URL.createObjectURL(blob);
            
            // Auto-publish to gallery
            const prenom = prenomInput.value.trim();
            const nom = nomInput.value.trim();
            const reader = new FileReader();
            reader.onloadend = async () => {
                await saveBadgeToGallery(reader.result, prenom, nom);
            };
            reader.readAsDataURL(blob);
        }, 'image/png', 1.0);
        
    } catch (error) {
        console.error('Error generating badge:', error);
        alert('Une erreur est survenue lors de la génération du badge.');
    }
}

// Download handler - Always regenerate to capture user adjustments
async function handleDownload() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const filename = `badge_UP_${prenom}_${nom}.png`.replace(/\s+/g, '_');
    
    // Always regenerate to capture current adjustments (zoom, position)
    try {
        const badgeWidth = badge.offsetWidth;
        const targetSize = 1080;
        const scale = targetSize / badgeWidth;
        
        const canvas = await html2canvas(badge, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: badgeWidth,
            height: badgeWidth
        });
        
        // Download the freshly generated image
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
        
    } catch (error) {
        console.error('Error downloading badge:', error);
        alert('Une erreur est survenue lors du téléchargement.');
    }
}

// WhatsApp share handler - Regenerate to capture adjustments
async function handleWhatsAppShare() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const message = `🗳️ *Moi ${prenom} ${nom.toUpperCase()}, je maintiens le CAP !*

✅ Je soutiens UP – Le Renouveau pour les élections législatives et communales 2025.

💚 Rejoignez le mouvement !

#UPLeRenouveau #JeMaintiensLeCap #Elections2025 #Benin`;
    
    // Regenerate image to capture current adjustments
    try {
        const badgeWidth = badge.offsetWidth;
        const targetSize = 1080;
        const scale = targetSize / badgeWidth;
        
        const canvas = await html2canvas(badge, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: badgeWidth,
            height: badgeWidth
        });
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        
        // Try Web Share API first (mobile)
        if (navigator.canShare) {
            const file = new File([blob], `badge_UP_${prenom}_${nom}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Mon badge UP – Le Renouveau',
                    text: message
                });
                return;
            }
        }
    } catch (error) {
        console.log('Web Share failed, using WhatsApp URL');
    }
    
    // Fallback: Open WhatsApp with message
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + '\n\n📲 Créez votre badge : ' + window.location.href)}`;
    window.open(whatsappUrl, '_blank');
}

// Facebook share handler - Regenerate to capture adjustments
async function handleFacebookShare() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const message = `🗳️ Moi ${prenom} ${nom.toUpperCase()}, je maintiens le CAP !

✅ Je soutiens UP – Le Renouveau pour les élections législatives et communales 2025.

💚 Rejoignez le mouvement !

#UPLeRenouveau #JeMaintiensLeCap #Elections2025`;
    
    // Regenerate image to capture current adjustments
    try {
        const badgeWidth = badge.offsetWidth;
        const targetSize = 1080;
        const scale = targetSize / badgeWidth;
        
        const canvas = await html2canvas(badge, {
            scale: scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            width: badgeWidth,
            height: badgeWidth
        });
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        
        // Try Web Share API first (mobile)
        if (navigator.canShare) {
            const file = new File([blob], `badge_UP_${prenom}_${nom}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Mon badge UP – Le Renouveau',
                    text: message
                });
                return;
            }
        }
    } catch (error) {
        console.log('Web Share failed, using Facebook URL');
    }
    
    // Fallback: Open Facebook share dialog
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    // Also download the image so user can add it manually
    setTimeout(() => {
        if (confirm('Votre badge a été téléchargé.\\n\\nSur Facebook, cliquez sur "Photo/Vidéo" pour ajouter votre badge à la publication.')) {
            handleDownload();
        }
    }, 500);
}

// Reset form
function resetForm() {
    // Reset form fields
    badgeForm.reset();
    
    // Reset photo preview
    photoPreview.src = '';
    photoPreview.classList.remove('active');
    uploadPlaceholder.style.display = '';
    
    // Reset generated image
    if (generatedImageUrl) {
        URL.revokeObjectURL(generatedImageUrl);
    }
    generatedImageBlob = null;
    generatedImageUrl = null;
    
    // Show form, hide badge
    formSection.style.display = '';
    badgeSection.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Loading overlay
function showLoading() {
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// Image Adjustment Logic
let initialPinchDistance = null;
let initialScale = null;

function setupImageAdjustment() {
    // Zoom buttons
    zoomInBtn.addEventListener('click', () => updateZoom(0.1));
    zoomOutBtn.addEventListener('click', () => updateZoom(-0.1));

    // Dragging events for Mouse
    badge.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Touch events (Drag + Pinch)
    badge.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function updateZoom(delta) {
    currentScale += delta;
    if (currentScale < 0.1) currentScale = 0.1; // Min zoom
    if (currentScale > 5) currentScale = 5;     // Max zoom
    updateImageTransform();
}

// Mouse Drag
function startDrag(e) {
    // Only allow dragging if we are clicking on the badge area
    // We don't check for specific target because overlays might block it
    
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    badgePhotoZone.style.cursor = 'grabbing';
}

// Touch Handlers
function handleTouchStart(e) {
    if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        isDragging = false; // Stop dragging if pinching
        initialPinchDistance = getPinchDistance(e);
        initialScale = currentScale;
    } else if (e.touches.length === 1) {
        // Drag start
        e.preventDefault(); // Prevent scrolling
        isDragging = true;
        startX = e.touches[0].clientX - currentX;
        startY = e.touches[0].clientY - currentY;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && initialPinchDistance) {
        // Pinch move
        e.preventDefault();
        const currentDistance = getPinchDistance(e);
        const scaleDiff = currentDistance / initialPinchDistance;
        currentScale = initialScale * scaleDiff;
        
        // Clamp scale
        if (currentScale < 0.1) currentScale = 0.1;
        if (currentScale > 5) currentScale = 5;
        
        updateImageTransform();
    } else if (e.touches.length === 1 && isDragging) {
        // Drag move
        e.preventDefault();
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        
        currentX = clientX - startX;
        currentY = clientY - startY;
        
        updateImageTransform();
    }
}

function handleTouchEnd(e) {
    if (e.touches.length < 2) {
        initialPinchDistance = null;
    }
    if (e.touches.length === 0) {
        isDragging = false;
    }
}

function getPinchDistance(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    );
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    currentX = clientX - startX;
    currentY = clientY - startY;
    
    updateImageTransform();
}

function stopDrag() {
    isDragging = false;
    badgePhotoZone.style.cursor = 'move';
}

function updateImageTransform() {
    badgePhoto.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
}

function fitImageToZone() {
    const zoneWidth = badgePhotoZone.offsetWidth;
    const zoneHeight = badgePhotoZone.offsetHeight;
    const imgWidth = badgePhoto.naturalWidth;
    const imgHeight = badgePhoto.naturalHeight;
    
    if (!zoneWidth || !zoneHeight || !imgWidth || !imgHeight) return;
    
    const zoneRatio = zoneWidth / zoneHeight;
    const imgRatio = imgWidth / imgHeight;
    
    if (imgRatio > zoneRatio) {
        // Image is wider than zone: fit height
        badgePhoto.style.height = '100%';
        badgePhoto.style.width = 'auto';
    } else {
        // Image is taller than zone: fit width
        badgePhoto.style.width = '100%';
        badgePhoto.style.height = 'auto';
        
        // Optional: Adjust Y to show face (top part) for portrait images
        // Since flex centers it, the top is cut off.
        // To show the top, we would need to translate Y positive.
        // For now, we leave it centered as the user can drag it.
    }
}

// =====================
// GALLERY FUNCTIONS
// =====================

// Load preview badges on home page
async function loadGalleryPreview() {
    let badges = [];
    
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            badges = await response.json();
        }
    } catch (error) {
        console.log('API not available');
        badges = getGalleryData();
    }
    
    // Update counter
    const count = badges.length;
    badgeCounter.textContent = `${count} supporter${count > 1 ? 's' : ''}`;
    
    // Clear and populate preview
    galleryPreviewScroll.innerHTML = '';
    
    if (badges.length === 0) {
        galleryPreviewScroll.appendChild(galleryPreviewEmpty);
        galleryPreviewEmpty.classList.remove('hidden');
        return;
    }
    
    galleryPreviewEmpty.classList.add('hidden');
    
    // Show first 10 badges in preview
    badges.slice(0, 10).forEach(badge => {
        const item = createPreviewItem(badge);
        galleryPreviewScroll.appendChild(item);
    });
}

function createPreviewItem(badge) {
    const item = document.createElement('div');
    item.className = 'gallery-preview-item';
    
    const thumbnailSrc = badge.thumbnailUrl || badge.thumbnail || badge.imageUrl;
    const fullImageSrc = badge.imageUrl || badge.fullImage;
    
    item.innerHTML = `
        <img src="${thumbnailSrc}" alt="${badge.prenom}" loading="lazy">
        <span class="preview-name">${badge.prenom}</span>
    `;
    
    item.addEventListener('click', () => {
        openGalleryModal({...badge, fullImage: fullImageSrc});
    });
    
    return item;
}

// Open full gallery
function openFullGallery() {
    galleryFull.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadFullGallery();
}

// Close full gallery
function closeFullGallery() {
    galleryFull.classList.remove('active');
    document.body.style.overflow = '';
}

// Load full gallery
async function loadFullGallery() {
    galleryGrid.innerHTML = '';
    galleryLoading.classList.remove('hidden');
    galleryEmpty.classList.remove('visible');
    
    let badges = [];
    
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            badges = await response.json();
        }
    } catch (error) {
        console.log('API not available, using local storage');
        badges = getGalleryData();
    }
    
    galleryLoading.classList.add('hidden');
    galleryBadgeCount.textContent = `${badges.length} badge${badges.length > 1 ? 's' : ''}`;
    
    if (badges.length === 0) {
        galleryEmpty.classList.add('visible');
        return;
    }
    
    badges.forEach(badge => {
        const item = createGalleryItem(badge);
        galleryGrid.appendChild(item);
    });
}

function getGalleryData() {
    try {
        const data = localStorage.getItem(GALLERY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading gallery data:', error);
        return [];
    }
}

function saveGalleryData(data) {
    try {
        localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving gallery data:', error);
        if (error.name === 'QuotaExceededError') {
            alert('Espace de stockage insuffisant. Supprimez quelques badges de la galerie.');
        }
    }
}

// Save badge - API or Local
async function saveBadgeToGallery(imageDataUrl, prenom, nom) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prenom,
                nom,
                imageUrl: imageDataUrl
            })
        });
        
        if (response.ok) {
            loadGalleryPreview(); // Refresh preview
            return;
        }
        throw new Error('API error');
    } catch (error) {
        console.log('API not available, saving to local storage');
        saveToLocalGallery(imageDataUrl, prenom, nom, {
            id: Date.now().toString(),
            prenom,
            nom,
            date: new Date().toISOString()
        });
        loadGalleryPreview();
    }
}

function saveToLocalGallery(imageDataUrl, prenom, nom, badgeData) {
    const gallery = getGalleryData();
    
    const localBadgeData = {
        ...badgeData,
        imageUrl: imageDataUrl,
        isLocal: true
    };
    
    gallery.unshift(localBadgeData);
    
    if (gallery.length > 20) {
        gallery.pop();
    }
    
    saveGalleryData(gallery);
}

function createGalleryItem(badge) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.id = badge.id;
    
    const date = new Date(badge.createdAt || badge.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const thumbnailSrc = badge.thumbnailUrl || badge.thumbnail || badge.imageUrl;
    const fullImageSrc = badge.imageUrl || badge.fullImage;
    
    item.innerHTML = `
        <img src="${thumbnailSrc}" alt="Badge de ${badge.prenom} ${badge.nom}" loading="lazy">
        <div class="gallery-item-overlay">
            <p class="gallery-item-name">${badge.prenom} ${badge.nom.toUpperCase()}</p>
            <p class="gallery-item-date">${formattedDate}</p>
        </div>
        <div class="gallery-item-actions">
            <button class="gallery-item-btn download" title="Télécharger">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
        </div>
    `;
    
    item.dataset.fullImage = fullImageSrc;
    
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.gallery-item-btn')) {
            openGalleryModal({...badge, fullImage: fullImageSrc});
        }
    });
    
    item.querySelector('.gallery-item-btn.download').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadGalleryBadge({...badge, fullImage: fullImageSrc});
    });
    
    return item;
}

function downloadGalleryBadge(badge) {
    const filename = `badge_UP_${badge.prenom}_${badge.nom}.png`.replace(/\s+/g, '_');
    const link = document.createElement('a');
    link.href = badge.fullImage || badge.imageUrl;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function openGalleryModal(badge) {
    let modal = document.getElementById('galleryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'galleryModal';
        modal.className = 'gallery-modal';
        document.body.appendChild(modal);
    }
    
    const date = new Date(badge.date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const fullImageSrc = badge.fullImage || badge.imageUrl;
    
    modal.innerHTML = `
        <div class="gallery-modal-content">
            <button class="gallery-modal-close">&times;</button>
            <img src="${fullImageSrc}" alt="Badge de ${badge.prenom} ${badge.nom}">
            <div class="gallery-modal-info">
                <h3>${badge.prenom} ${badge.nom.toUpperCase()}</h3>
                <p>Publié le ${formattedDate}</p>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    modal.querySelector('.gallery-modal-close').addEventListener('click', closeGalleryModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeGalleryModal();
    });
    
    document.addEventListener('keydown', handleModalEscape);
}

function closeGalleryModal() {
    const modal = document.getElementById('galleryModal');
    if (modal) {
        modal.classList.remove('active');
    }
    document.removeEventListener('keydown', handleModalEscape);
}

function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeGalleryModal();
    }
}

// Publish to gallery handler
async function handlePublishToGallery() {
    if (!generatedImageBlob) {
        alert('Veuillez d\'abord générer un badge.');
        return;
    }
    
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const btn = document.getElementById('publishToGallery');
    const originalHTML = btn.innerHTML;
    
    // Show loading state
    btn.innerHTML = '<div class="spinner-small"></div><span>Publication...</span>';
    btn.disabled = true;
    
    // Convert blob to data URL for storage
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            await saveBadgeToGallery(reader.result, prenom, nom);
            
            // Show success
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Publié !</span>';
            btn.style.background = 'var(--primary-color)';
            btn.style.color = 'white';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            console.error('Error publishing:', error);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            alert('Erreur lors de la publication. Réessayez.');
        }
    };
    reader.readAsDataURL(generatedImageBlob);
}
