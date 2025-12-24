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

// Store the generated image
let generatedImageBlob = null;
let generatedImageUrl = null;

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
            // Automatic cropping heuristic:
            // If image is portrait (taller than wide), focus on the top part (face)
            if (badgePhoto.naturalHeight > badgePhoto.naturalWidth) {
                badgePhoto.style.objectPosition = 'center 15%';
            } else {
                badgePhoto.style.objectPosition = 'center center';
            }
            resolve();
        };

        if (badgePhoto.complete) {
            adjustAndResolve();
        } else {
            badgePhoto.onload = adjustAndResolve;
        }
    });
    
    // Show badge section and hide form
    formSection.style.display = 'none';
    badgeSection.style.display = 'block';
    
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
        
        // Convert to blob
        canvas.toBlob((blob) => {
            generatedImageBlob = blob;
            generatedImageUrl = URL.createObjectURL(blob);
        }, 'image/png', 1.0);
        
    } catch (error) {
        console.error('Error generating badge:', error);
        alert('Une erreur est survenue lors de la génération du badge.');
    }
}

// Download handler
async function handleDownload() {
    if (!generatedImageBlob) {
        await generateBadgeImage();
    }
    
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const filename = `badge_UP_${prenom}_${nom}.png`.replace(/\s+/g, '_');
    
    // Create download link
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// WhatsApp share handler
async function handleWhatsAppShare() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const message = `🗳️ *Moi ${prenom} ${nom.toUpperCase()}, je maintiens le CAP !*

✅ Je soutiens UP – Le Renouveau pour les élections législatives et communales 2025.

💚 Rejoignez le mouvement !

#UPLeRenouveau #JeMaintiensLeCap #Elections2025 #Benin`;
    
    // Try Web Share API first (mobile)
    if (navigator.canShare && generatedImageBlob) {
        try {
            const file = new File([generatedImageBlob], `badge_UP_${prenom}_${nom}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Mon badge UP – Le Renouveau',
                    text: message
                });
                return;
            }
        } catch (error) {
            console.log('Web Share failed, using WhatsApp URL');
        }
    }
    
    // Fallback: Open WhatsApp with message
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message + '\n\n📲 Créez votre badge : ' + window.location.href)}`;
    window.open(whatsappUrl, '_blank');
}

// Facebook share handler
async function handleFacebookShare() {
    const prenom = prenomInput.value.trim();
    const nom = nomInput.value.trim();
    const message = `🗳️ Moi ${prenom} ${nom.toUpperCase()}, je maintiens le CAP !

✅ Je soutiens UP – Le Renouveau pour les élections législatives et communales 2025.

💚 Rejoignez le mouvement !

#UPLeRenouveau #JeMaintiensLeCap #Elections2025`;
    
    // Try Web Share API first (mobile)
    if (navigator.canShare && generatedImageBlob) {
        try {
            const file = new File([generatedImageBlob], `badge_UP_${prenom}_${nom}.png`, { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'Mon badge UP – Le Renouveau',
                    text: message
                });
                return;
            }
        } catch (error) {
            console.log('Web Share failed, using Facebook URL');
        }
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
function setupImageAdjustment() {
    // Zoom buttons
    zoomInBtn.addEventListener('click', () => updateZoom(0.1));
    zoomOutBtn.addEventListener('click', () => updateZoom(-0.1));

    // Dragging events for Mouse
    badgePhotoZone.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);

    // Dragging events for Touch
    badgePhotoZone.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', stopDrag);
}

function updateZoom(delta) {
    currentScale += delta;
    if (currentScale < 0.5) currentScale = 0.5; // Min zoom
    if (currentScale > 3) currentScale = 3;     // Max zoom
    updateImageTransform();
}

function startDrag(e) {
    if (e.target !== badgePhoto && e.target !== badgePhotoZone) return;
    
    isDragging = true;
    
    // Get start position
    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX - currentX;
        startY = e.touches[0].clientY - currentY;
    } else {
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;
    }
    
    badgePhotoZone.style.cursor = 'grabbing';
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent scrolling on touch
    
    let clientX, clientY;
    
    if (e.type === 'touchmove') {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
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
