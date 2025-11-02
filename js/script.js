// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Fade-in on scroll using Intersection Observer
const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.fade-section').forEach(function (section) {
    observer.observe(section);
});

// Portfolio filter buttons
const filterButtons = document.querySelectorAll('.portfolio-filter');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const filter = this.dataset.filter;

        filterButtons.forEach(function (btn) { btn.classList.remove('is-active'); btn.setAttribute('aria-pressed', 'false'); });
        this.classList.add('is-active');
        this.setAttribute('aria-pressed', 'true');

        portfolioItems.forEach(function (item) {
            if (filter === 'all' || item.dataset.category === filter) {
                item.classList.remove('hidden');
                item.classList.add('block');
            } else {
                item.classList.add('hidden');
                item.classList.remove('block');
            }
        });
    });
});

// Activate "All" filter by default
const defaultFilter = document.querySelector('.portfolio-filter[data-filter="all"]');
if (defaultFilter) {
    defaultFilter.click();
}

// Simple lightbox effect
const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxTriggers = document.querySelectorAll('[data-lightbox-trigger]');

lightboxTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () {
        const source = trigger.getAttribute('data-lightbox-src') || trigger.src;
        if (!source) return;
        lightboxImage.src = source;
        lightbox.classList.remove('hidden');
    });
});

function closeLightbox() {
    lightbox.classList.add('hidden');
    lightboxImage.src = '';
}

lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox || event.target === lightboxImage) {
        closeLightbox();
    }
});

lightboxClose.addEventListener('click', closeLightbox);

// Portfolio gallery overlay
const galleryOverlay = document.getElementById('gallery-overlay');
const galleryOverlayImage = document.getElementById('gallery-overlay-image');
const galleryOverlayLabel = document.getElementById('gallery-overlay-label');
const galleryOverlayIndicator = document.getElementById('gallery-overlay-indicator');
const galleryOverlayPrev = document.getElementById('gallery-overlay-prev');
const galleryOverlayNext = document.getElementById('gallery-overlay-next');
const galleryOverlayClose = document.getElementById('gallery-overlay-close');

const galleryData = {
    creative: [
        { src: 'images/creative/main.JPG', alt: 'Creative portrait featuring halloween pumpkin', label: 'Creepy Halloween' },
        { src: 'images/creative/IMG_0050.JPG', alt: 'Creative aircraft across a cloudy sky', label: 'Aerial Manuever' },
        { src: 'images/creative/IMG_0043.JPG', alt: 'Backlit upside down aircraft stunt', label: 'Aircraft Silhouette' },
        { src: 'images/creative/IMG_0041.JPG', alt: 'Creative shot of inverted aircraft', label: 'Thunderbirds Inverted' },
        { src: 'images/creative/IMG_0683 Copy.JPG', alt: 'Creative perspective shot inside Austin, Texas Capital', label: 'Austin Capital' },
        { src: 'images/creative/DSC02434 (2).jpg', alt: 'Creative halloween headless graveyard portrait', label: 'Headless Pumpkin' },
        { src: 'images/creative/DSC02597 (1).JPG', alt: 'Creative halloween getting ready with pumpkin heads', label: 'Heads On' },
        { src: 'images/creative/DSC02658 (1).jpg', alt: 'Street photography perspective shot of hotel emma', label: 'Hotel Emma' },
        { src: 'images/creative/DSC02665 (1).jpg', alt: 'Abstract lights shot from below', label: 'Lights Abstract' },
        { src: 'images/creative/DSC06160.jpeg', alt: 'Studio portrait exploring light and shadows', label: 'Christian Cross' },
        { src: 'images/creative/DSC06174.jpeg', alt: 'Creative close-up with saturated color wash', label: 'Saint Baby' },
        { src: 'images/creative/E300F31B-CB50-46F8-97A9-A8D02E3E9688.jpg', alt: 'Editorial portrait with cinematic lighting', label: 'Lone Tree' },
        { src: 'images/creative/eclipse_vert.jpg', alt: 'Moody eclipse composite', label: 'Eclipse Composite' },
        { src: 'images/creative/844F8551-8827-443D-A980-8D7CE368D677.jpg', alt: 'Fine art apache helicopter explosion', label: 'Apache Explosion' }
    ],
    tomey_babyshower: [
        { src: 'images/tomey_babyshower/main.jpg', alt: 'Tomey baby shower highlight moment', label: 'Baby Shower' },
        { src: 'images/tomey_babyshower/DSC01802.jpg', alt: 'Tomey baby shower baby bump with sash', label: 'Baby Bump' },
        { src: 'images/tomey_babyshower/DSC01804.jpg', alt: 'Over-the-shoulder shot of mother', label: 'Love Look' },
        { src: 'images/tomey_babyshower/DSC01826.jpg', alt: 'Baby shower games bringing laughter to the Tomey celebration', label: 'Gift Giving' },
        { src: 'images/tomey_babyshower/DSC01853.jpg', alt: 'Tomey parents-to-be sharing a quiet moment at their baby shower', label: 'Gift Giving' },
        { src: 'images/tomey_babyshower/DSC01919.jpg', alt: 'Guests raising a toast at the Tomey baby shower', label: 'Toast Moment' }
    ],
    tayla_graduation: [
        { src: 'images/tayla_graduation/main.jpg', alt: 'Tayla senior portrait at Tea Gardens', label: 'Tea Gardens' },
        { src: 'images/tayla_graduation/DSC01190.jpg', alt: 'Tayla senior portrait outdoors at sunset', label: 'Sunset Senior' },
        { src: 'images/tayla_graduation/DSC01193.jpg', alt: 'Tayla senior session smiling under canopy of green', label: 'Canopy Smile' },
        { src: 'images/tayla_graduation/DSC01229.jpg', alt: 'Upshot of Tayla along a higher path at Tea Gardens', label: 'Upshot Senior' },
        { src: 'images/tayla_graduation/DSC01235.jpg', alt: 'Tayla senior portraits upshot #2', label: 'Upshot Smile' },
        { src: 'images/tayla_graduation/DSC01270.jpg', alt: 'Close senior portrait of Tayla with dramatic lighting', label: 'Dramatic Close' },
        { src: 'images/tayla_graduation/DSC01541.jpg', alt: 'Tayla senior session under light scrim', label: 'Tea Gardens' }
    ],
    automotive: [
        { src: 'images/automotive/main.jpeg', alt: 'Hero automotive portrait under downtown lights', label: 'Tag Plate' },
        { src: 'images/automotive/IMG_0012.JPG', alt: 'Chevrolet SS parked beneath downtown lights', label: 'King Camaro' },
        { src: 'images/automotive/DSC00515_1.jpg', alt: 'Track-prepped coupe staged in the paddock', label: 'Corvette Sunset' },
        { src: 'images/automotive/DSC03807.jpeg', alt: 'Classic muscle car staged in sunset glow', label: 'Corvette' },
        { src: 'images/automotive/DSC04195.jpeg', alt: 'Performance coupe under showroom lighting', label: 'Subaru WRX' },
        { src: 'images/automotive/37_mini_rally.jpg', alt: 'Mini rally car kicking up dust mid turn', label: 'Mini Rally Drift' },
        { src: 'images/automotive/SRT.jpg', alt: 'Dodge SRT lit with dramatic gels at night', label: 'SRT' },
        { src: 'images/automotive/zr2_nighttime_bw.jpg', alt: 'ZR2 truck rendered in black and white', label: 'ZR2' },
        { src: 'images/automotive/mustang_5.jpeg', alt: 'Mustang front quarter detail at dusk', label: 'Mustang Detail' },
        { src: 'images/automotive/edelbrock.jpg', alt: 'Edelbrock engine detail with ambient lighting', label: 'Engine Detail' },
        { src: 'images/automotive/jeepwheel.jpg', alt: 'Custom Jeep wheel close-up from night shoot', label: 'Jeep Wheel Close' },
        { src: 'images/automotive/thunderbird.jpg', alt: 'Thunderbird front grille with polished chrome', label: 'Thunderbird Profile' }
    ],
    sports: [
        { src: 'images/sports/main.jpg', alt: 'Highlight frame from a track and field meet', label: 'Dribble' },
        { src: 'images/sports/DSC02060.jpg', alt: 'Athlete launching a discus under stadium lights', label: 'Chase' }
    ],
    kathy_birthday: [
        { src: 'images/kathy_birthday/main.jpg', alt: 'Kathy birthday party highlight with the guest of honor', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC08999_2.jpg', alt: 'Kathy birthday party portrait with dramatic flare', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC09117.jpg', alt: 'Couple portrait with string lights at Kathy birthday party', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC09121.jpg', alt: 'Candid moment during Kathy birthday celebration', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC09124.jpg', alt: 'Family cheering at Kathy birthday party', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC09182.jpg', alt: 'Family laughing together at Kathy birthday party', label: 'Birthday Highlight' },
        { src: 'images/kathy_birthday/DSC09500.jpg', alt: 'Kathy birthday portrait captured at golden hour', label: 'Guest Book' }
    ]
};

let activeGalleryKey = null;
let activeGalleryIndex = 0;
let galleryIsOpen = false;

function updateGalleryImage() {
    if (!galleryOverlay || !galleryOverlayImage || !galleryOverlayLabel || !galleryOverlayIndicator) return;
    const gallery = galleryData[activeGalleryKey];
    if (!gallery || !gallery.length) {
        galleryOverlayImage.src = '';
        galleryOverlayImage.alt = '';
        galleryOverlayLabel.textContent = '';
        galleryOverlayIndicator.textContent = '';
        return;
    }

    if (activeGalleryIndex < 0) {
        activeGalleryIndex = gallery.length - 1;
    } else if (activeGalleryIndex >= gallery.length) {
        activeGalleryIndex = 0;
    }

    const currentItem = gallery[activeGalleryIndex];
    galleryOverlayImage.src = currentItem.src;
    galleryOverlayImage.alt = currentItem.alt;
    galleryOverlayLabel.textContent = currentItem.label || activeGalleryKey;
    galleryOverlayIndicator.textContent = (activeGalleryIndex + 1) + ' / ' + gallery.length;
}

function openGalleryOverlay(key) {
    if (!galleryData[key] || !galleryData[key].length) return;
    activeGalleryKey = key;
    activeGalleryIndex = 0;
    updateGalleryImage();
    galleryOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    galleryIsOpen = true;
}

function closeGalleryOverlay() {
    galleryOverlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
    galleryOverlayImage.src = '';
    galleryOverlayLabel.textContent = '';
    galleryOverlayIndicator.textContent = '';
    galleryIsOpen = false;
}

if (galleryOverlayPrev && galleryOverlayNext) {
    galleryOverlayPrev.addEventListener('click', function () {
        if (!galleryIsOpen) return;
        activeGalleryIndex -= 1;
        updateGalleryImage();
    });

    galleryOverlayNext.addEventListener('click', function () {
        if (!galleryIsOpen) return;
        activeGalleryIndex += 1;
        updateGalleryImage();
    });
}

if (galleryOverlayClose) {
    galleryOverlayClose.addEventListener('click', closeGalleryOverlay);
}

if (galleryOverlay) {
    galleryOverlay.addEventListener('click', function (event) {
        if (event.target === galleryOverlay) {
            closeGalleryOverlay();
        }
    });
}

portfolioItems.forEach(function (item) {
    item.addEventListener('click', function () {
        if (item.classList.contains('hidden')) return;
        const targetGallery = item.dataset.gallery;
        if (!targetGallery) return;
        openGalleryOverlay(targetGallery);
    });
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        if (!lightbox.classList.contains('hidden')) {
            closeLightbox();
            return;
        }
        if (galleryIsOpen) {
            closeGalleryOverlay();
            return;
        }
    }

    if (!galleryIsOpen) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        activeGalleryIndex -= 1;
        updateGalleryImage();
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        activeGalleryIndex += 1;
        updateGalleryImage();
    }
});
