const prefersReducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

const rootElement = document.documentElement;
let lenisInstance = null;
let lenisRafId = null;
let lenisProxyApplied = false;
let lenisRefreshListenerBound = false;
let parallaxTweens = [];

const parallaxVideos = Array.from(document.querySelectorAll('.parallax-container video'));
const responsiveSrcCache = new Map();
const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
    const bodyElement = document.body;
    const dismissSplash = function () {
        if (splashScreen.classList.contains('is-hidden')) {
            return;
        }
        splashScreen.classList.add('is-hidden');
        if (bodyElement) {
            bodyElement.classList.remove('splash-active');
        }
        window.setTimeout(function () {
            if (splashScreen && splashScreen.parentNode) {
                splashScreen.parentNode.removeChild(splashScreen);
            }
        }, 2300);
    };
    window.addEventListener('load', function () {
        const delay = prefersReducedMotion && prefersReducedMotion.matches ? 1400 : 2200;
        window.setTimeout(dismissSplash, delay);
    });
    window.setTimeout(dismissSplash, 7500);
}
function normalizeManifestKey(path) {
    if (!path) return '';
    return path.replace(/^[./\\]+/, '');
}

function getResponsiveSrcSet(path) {
    const normalized = normalizeManifestKey(path);
    if (responsiveSrcCache.has(normalized)) {
        return responsiveSrcCache.get(normalized);
    }

    let srcset = '';
    if (typeof responsiveManifest !== 'undefined' && responsiveManifest) {
        srcset = responsiveManifest[normalized] || responsiveManifest[path] || '';
    }

    responsiveSrcCache.set(normalized, srcset);
    if (path && normalized !== path) {
        responsiveSrcCache.set(path, srcset);
    }
    return srcset;
}

function applyResponsiveAttributes(img, path, sizes) {
    if (!img) return;
    const srcset = getResponsiveSrcSet(path);
    if (srcset) {
        img.setAttribute('srcset', srcset);
        if (sizes) {
            img.setAttribute('sizes', sizes);
        } else if (!img.getAttribute('sizes')) {
            img.setAttribute('sizes', '100vw');
        }
    } else {
        img.removeAttribute('srcset');
        if (sizes) {
            img.setAttribute('sizes', sizes);
        }
    }
}

parallaxVideos.forEach(function (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
});

function smoothScrollToTarget(target) {
    if (!target) return;
    if (lenisInstance && typeof lenisInstance.scrollTo === 'function') {
        lenisInstance.scrollTo(target, {
            offset: -80,
            duration: 1.2
        });
    } else {
        target.scrollIntoView({ behavior: 'smooth' });
    }
}

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
        const hash = this.getAttribute('href');
        if (!hash || hash === '#') {
            return;
        }
        const target = document.querySelector(hash);
        if (!target) {
            return;
        }
        event.preventDefault();
        smoothScrollToTarget(target);
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

const portfolioItems = document.querySelectorAll('.portfolio-item');
const filterButtons = document.querySelectorAll('.portfolio-filter');

portfolioItems.forEach(function (item) {
    const previewImage = item.querySelector('img');
    if (previewImage && !previewImage.dataset.lightboxSrc) {
        const explicitSrc = previewImage.getAttribute('src');
        previewImage.dataset.lightboxSrc = explicitSrc || previewImage.src || '';
    }
});

filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const filter = this.dataset.filter;

        filterButtons.forEach(function (btn) {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-pressed', 'false');
        });
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

const defaultFilter = document.querySelector('.portfolio-filter[data-filter="all"]');
if (defaultFilter) {
    defaultFilter.click();
}

const debounce = function (fn, delay) {
    let timer = null;
    return function () {
        const context = this;
        const args = arguments;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
};

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

function killParallaxTweens() {
    parallaxTweens.forEach(function (tween) {
        if (tween && typeof tween.kill === 'function') {
            tween.kill();
        }
        if (tween && tween.scrollTrigger && typeof tween.scrollTrigger.kill === 'function') {
            tween.scrollTrigger.kill();
        }
    });
    parallaxTweens = [];
}

function resetParallaxTransforms() {
    document.querySelectorAll('.parallax-container [data-depth]').forEach(function (layer) {
        layer.style.transform = 'translate3d(0, 0, 0)';
    });
}

function updateParallaxVideoPlayback() {
    parallaxVideos.forEach(function (video) {
        if (prefersReducedMotion.matches) {
            if (!video.paused) {
                video.pause();
            }
            video.currentTime = 0;
        } else if (video.paused) {
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () { /* Ignore autoplay blocks */ });
            }
        }
    });
}

function initParallaxTweens() {
    const layers = document.querySelectorAll('.parallax-container [data-depth]');
    killParallaxTweens();

    if (!layers.length || prefersReducedMotion.matches || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        resetParallaxTransforms();
        return;
    }

    layers.forEach(function (layer) {
        const depth = parseFloat(layer.dataset.depth);
        const intensity = Number.isFinite(depth) ? depth : 0.2;
        const movement = gsap.utils.clamp(4, 60, intensity * 100);
        const triggerTarget = layer.closest('section') || layer.parentElement || layer;

        const tween = gsap.fromTo(layer,
            { yPercent: -movement },
            {
                yPercent: movement,
                ease: 'none',
                overwrite: 'auto',
                force3D: true,
                scrollTrigger: {
                    trigger: triggerTarget,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                    invalidateOnRefresh: true
                }
            }
        );

        parallaxTweens.push(tween);
    });

    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
    }
}

function startLenis() {
    if (lenisInstance || typeof Lenis === 'undefined' || prefersReducedMotion.matches) {
        return;
    }

    lenisInstance = new Lenis({
        duration: 1.2,
        easing: function (t) {
            return Math.min(1, 1 - Math.pow(2, -10 * t));
        },
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.4,
        normalizeWheel: true,
        autoRaf: false
    });

    rootElement.classList.add('lenis-enabled');

    if (typeof ScrollTrigger !== 'undefined') {
        if (!lenisProxyApplied) {
            ScrollTrigger.scrollerProxy(document.body, {
                scrollTop: function (value) {
                    if (typeof value === 'number') {
                        lenisInstance.scrollTo(value, { immediate: true });
                        return;
                    }
                    return lenisInstance.scroll;
                },
                getBoundingClientRect: function () {
                    return {
                        top: 0,
                        left: 0,
                        width: window.innerWidth,
                        height: window.innerHeight
                    };
                },
                pinType: document.body.style.transform ? 'transform' : 'fixed'
            });
            lenisProxyApplied = true;
        }

        if (!lenisRefreshListenerBound) {
            ScrollTrigger.addEventListener('refresh', function () {
                if (lenisInstance && typeof lenisInstance.resize === 'function') {
                    lenisInstance.resize();
                }
            });
            lenisRefreshListenerBound = true;
        }

        lenisInstance.on('scroll', ScrollTrigger.update);
    }

    const update = function (time) {
        if (!lenisInstance) {
            return;
        }
        lenisInstance.raf(time);
        lenisRafId = requestAnimationFrame(update);
    };

    lenisRafId = requestAnimationFrame(update);
}

function stopLenis() {
    if (lenisRafId) {
        cancelAnimationFrame(lenisRafId);
        lenisRafId = null;
    }
    if (lenisInstance) {
        if (typeof lenisInstance.off === 'function' && typeof ScrollTrigger !== 'undefined') {
            lenisInstance.off('scroll', ScrollTrigger.update);
        }
        if (typeof lenisInstance.destroy === 'function') {
            lenisInstance.destroy();
        }
        lenisInstance = null;
    }
    rootElement.classList.remove('lenis-enabled');
}

function applyMotionPreferences() {
    updateParallaxVideoPlayback();

    if (prefersReducedMotion.matches) {
        stopLenis();
        killParallaxTweens();
        resetParallaxTransforms();
        return;
    }

    startLenis();
    initParallaxTweens();
    updateParallaxVideoPlayback();
}

applyMotionPreferences();

if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', applyMotionPreferences);
} else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(applyMotionPreferences);
}

const debouncedRefresh = debounce(function () {
    if (lenisInstance && typeof lenisInstance.resize === 'function') {
        lenisInstance.resize();
    }
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh) {
        ScrollTrigger.refresh();
    }
}, 180);

window.addEventListener('resize', debouncedRefresh, { passive: true });

window.addEventListener('load', function () {
    if (!prefersReducedMotion.matches) {
        applyMotionPreferences();
    }
});

// Simple lightbox effect
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxTriggers = document.querySelectorAll('[data-lightbox-trigger]');
const lightboxImage = lightbox ? lightbox.querySelector('img') : null;

function closeLightbox() {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.add('hidden');
    lightboxImage.src = '';
    lightboxImage.removeAttribute('srcset');
    lightboxImage.removeAttribute('sizes');
}

if (lightbox && lightboxImage && lightboxClose) {
    lightboxTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            const source = trigger.getAttribute('data-lightbox-src') || trigger.getAttribute('src') || trigger.currentSrc || trigger.src;
            if (!source) return;
            lightboxImage.src = source;
            applyResponsiveAttributes(lightboxImage, source, 'min(100vw, 1200px)');
            lightbox.classList.remove('hidden');
        });
    });

    lightbox.addEventListener('click', function (event) {
        if (event.target === lightbox || event.target === lightboxImage) {
            closeLightbox();
        }
    });

    lightboxClose.addEventListener('click', closeLightbox);
}

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
        { src: 'images/creative/IMG_0050.JPG', alt: 'Creative aircraft across a cloudy sky', label: 'Aerial Maneuver' },
        { src: 'images/creative/IMG_0041.JPG', alt: 'Creative shot of inverted aircraft', label: 'Thunderbirds Inverted' },
        { src: 'images/creative/IMG_0683 Copy.JPG', alt: 'Creative perspective shot inside Austin, Texas Capital', label: 'Austin Capital' },
        { src: 'images/creative/DSC02434 (2).jpg', alt: 'Creative halloween headless graveyard portrait', label: 'Headless Pumpkin' },
        { src: 'images/creative/DSC02658 (1).jpg', alt: 'Street photography perspective shot of Hotel Emma', label: 'Hotel Emma' },
        { src: 'images/creative/DSC06160.jpeg', alt: 'Studio portrait exploring light and shadows', label: 'Christian Cross' },
        { src: 'images/creative/DSC06174.jpeg', alt: 'Creative close-up with saturated color wash', label: 'Saint Baby' },
        { src: 'images/creative/eclipse_vert.jpg', alt: 'Moody eclipse composite', label: 'Eclipse Composite' }
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
        { src: 'images/tayla_graduation/DSC01229.jpg', alt: 'Upshot of Tayla along a higher path at Tea Gardens', label: 'Upshot Senior' },
        { src: 'images/tayla_graduation/DSC01235.jpg', alt: 'Tayla senior portraits upshot #2', label: 'Upshot Smile' },
        { src: 'images/tayla_graduation/DSC01270.jpg', alt: 'Close senior portrait of Tayla with dramatic lighting', label: 'Dramatic Close' },
        { src: 'images/tayla_graduation/DSC01541.jpg', alt: 'Tayla senior session under light scrim', label: 'Tea Gardens' }
    ],
    automotive: [
        { src: 'images/automotive/main.jpeg', alt: 'Hero automotive portrait under downtown lights', label: 'Tag Plate' },
        { src: 'images/automotive/IMG_0012.JPG', alt: 'Chevrolet SS parked beneath downtown lights', label: 'King Camaro' },
        { src: 'images/automotive/DSC00515_1.jpg', alt: 'Track-prepped coupe staged in the paddock', label: 'Corvette Sunset' },
        { src: 'images/automotive/DSC04195.jpeg', alt: 'Performance coupe under showroom lighting', label: 'Subaru WRX' },
        { src: 'images/automotive/37_mini_rally.jpg', alt: 'Mini rally car kicking up dust mid turn', label: 'Mini Rally Drift' },
        { src: 'images/automotive/SRT.jpg', alt: 'Dodge SRT lit with dramatic gels at night', label: 'SRT' },
        { src: 'images/automotive/zr2_nighttime_bw.jpg', alt: 'ZR2 truck rendered in black and white', label: 'ZR2' },
        { src: 'images/automotive/edelbrock.jpg', alt: 'Edelbrock engine detail with ambient lighting', label: 'Engine Detail' },
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
    applyResponsiveAttributes(galleryOverlayImage, currentItem.src, 'min(100vw, 1200px)');
    galleryOverlayImage.dataset.lightboxSrc = currentItem.src;
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
    galleryOverlayImage.removeAttribute('srcset');
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
        if (lightbox && lightboxImage && !lightbox.classList.contains('hidden')) {
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
