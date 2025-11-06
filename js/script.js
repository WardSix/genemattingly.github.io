document.addEventListener('DOMContentLoaded', function () {
    var yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = String(new Date().getFullYear());
    }

    var parallaxNodes = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var supportsMatchMedia = typeof window.matchMedia === 'function';
    var parallaxMediaQuery = supportsMatchMedia ? window.matchMedia('(max-width: 768px)') : null;
    var narrowViewportQuery = supportsMatchMedia ? window.matchMedia('(max-width: 640px)') : null;
    var reduceMotionQuery = supportsMatchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

    function getViewportWidth() {
        return window.innerWidth || document.documentElement.clientWidth || 0;
    }

    function enableParallax() {
        var avoidParallax = parallaxMediaQuery ? parallaxMediaQuery.matches : getViewportWidth() <= 768;
        return parallaxNodes.length && typeof window !== 'undefined' && !avoidParallax;
    }

    if (enableParallax()) {
        var ticking = false;

        function updateParallax() {
            var scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            parallaxNodes.forEach(function (node) {
                var factor = parseFloat(node.getAttribute('data-parallax')) || 0;
                var offset = scrollY * factor;
                node.style.transform = 'translate3d(0,' + offset + 'px,0)';
            });
            ticking = false;
        }

        function requestUpdate() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestUpdate, { passive: true });
        requestUpdate();
    }

    function handleParallaxToggle(event) {
        if (parallaxNodes.length === 0 || !event) {
            return;
        }
        if (event.matches) {
            parallaxNodes.forEach(function (node) {
                node.style.transform = '';
            });
        } else if (enableParallax()) {
            window.requestAnimationFrame(function () {
                window.dispatchEvent(new Event('scroll'));
            });
        }
    }

    if (parallaxMediaQuery) {
        if (typeof parallaxMediaQuery.addEventListener === 'function') {
            parallaxMediaQuery.addEventListener('change', handleParallaxToggle);
        } else if (typeof parallaxMediaQuery.addListener === 'function') {
            parallaxMediaQuery.addListener(handleParallaxToggle);
        }
    }

    var backdrop = document.querySelector('.video-backdrop');
    var backdropVideo = document.querySelector('.video-backdrop__media');
    var reduceMotion = reduceMotionQuery ? reduceMotionQuery.matches : false;
    var prefersStaticVideo = reduceMotion || (narrowViewportQuery ? narrowViewportQuery.matches : getViewportWidth() <= 640);
    if (backdropVideo && !prefersStaticVideo) {
        var playlist = [];
        var rawList = backdropVideo.getAttribute('data-playlist');
        if (rawList) {
            playlist = rawList.split(',').map(function (item) {
                return item.trim();
            }).filter(Boolean);
        }

        var currentIndex = 0;

        function playIndex(index) {
            if (!playlist.length) {
                return;
            }

            currentIndex = index % playlist.length;
            var src = playlist[currentIndex];
            if (backdropVideo.getAttribute('src') !== src) {
                backdropVideo.src = src;
                backdropVideo.load();
            }

            var playPromise = backdropVideo.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {
                    /* ignore autoplay errors */
                });
            }
        }

        backdropVideo.addEventListener('ended', function () {
            playIndex(currentIndex + 1);
        });

        playIndex(0);
    } else if (backdrop && backdropVideo) {
        backdropVideo.removeAttribute('src');
        backdropVideo.load();
        backdrop.classList.add('is-static');
    }

    var lightbox = document.querySelector('[data-lightbox]');
    var lightboxImage = lightbox ? lightbox.querySelector('.lightbox__image') : null;

    function openLightbox(src, altText) {
        if (!lightbox || !lightboxImage) {
            return;
        }

        lightboxImage.src = src;
        lightboxImage.alt = altText || 'Full screen preview';
        lightbox.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox || !lightboxImage) {
            return;
        }

        lightbox.setAttribute('hidden', '');
        lightboxImage.src = '';
        document.body.style.overflow = '';
    }

    if (lightbox) {
        var closeButton = lightbox.querySelector('.lightbox__close');
        if (closeButton) {
            closeButton.addEventListener('click', closeLightbox);
        }
        lightbox.addEventListener('click', function (event) {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
                closeLightbox();
            }
        });
    }

    var mobileMedia = narrowViewportQuery;

    var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
    carousels.forEach(function (carousel) {
        if (carousel.dataset.carouselReady === 'true') {
            return;
        }
        carousel.dataset.carouselReady = 'true';

        var cards = Array.prototype.slice.call(carousel.querySelectorAll('.carousel__card'));
        var stack = carousel.querySelector('.carousel__stack');
        if (!cards.length || !stack) {
            return;
        }

        var prevButton = carousel.querySelector('.carousel__nav--prev');
        var nextButton = carousel.querySelector('.carousel__nav--next');
        var invertNav = carousel.hasAttribute('data-carousel-nav-inverted');
        var currentCardIndex = 0;
        var maxFanOut = Math.max(1, Math.min(3, Math.floor(cards.length / 2)));
        var directionAttr = carousel.getAttribute('data-carousel-direction');
        var directionMultiplier = directionAttr === 'reverse' ? -1 : 1;
        var isMobileView = mobileMedia ? mobileMedia.matches : getViewportWidth() <= 640;
        var swipeDirectionMultiplier = directionAttr === 'reverse' ? -1 : 1;
        var swipeState = {
            active: false,
            startX: 0,
            startY: 0,
            vertical: false,
            lockedDirection: null
        };
        var swipeThreshold = 32;
        var directionLockThreshold = 12;
        var diagonalForgivenessRatio = 1.35;

        function setActiveCard(newIndex) {
            currentCardIndex = (newIndex + cards.length) % cards.length;
            var activeElement = document.activeElement;
            cards.forEach(function (card, cardIndex) {
                var offset = cardIndex - currentCardIndex;
                var clampedOffset = Math.max(Math.min(offset, maxFanOut), -maxFanOut);
                var translateX = clampedOffset * 10 * directionMultiplier;
                var rotate = clampedOffset * 2.5 * directionMultiplier;
                var translateY = Math.abs(clampedOffset) * 4;
                var hidden = Math.abs(offset) > maxFanOut;

                card.style.transform = 'translate(-50%, -50%) translateX(' + translateX + '%) translateY(' + translateY + 'px) rotate(' + rotate + 'deg)';
                card.style.zIndex = String(cards.length - Math.abs(clampedOffset));
                card.style.opacity = hidden ? '0' : '1';
                card.style.pointerEvents = hidden ? 'none' : '';
                if (cardIndex === currentCardIndex) {
                    card.classList.add('is-active');
                    card.removeAttribute('aria-hidden');
                    card.tabIndex = 0;
                } else {
                    if (activeElement === card) {
                        card.blur();
                    }
                    card.classList.remove('is-active');
                    card.setAttribute('aria-hidden', 'true');
                    card.tabIndex = -1;
                }
            });
        }

        setActiveCard(0);

        function setNavCopy(button, ariaText, srCopy) {
            if (!button) {
                return;
            }
            button.setAttribute('aria-label', ariaText);
            var sr = button.querySelector('.sr-only');
            if (sr) {
                sr.textContent = srCopy;
            }
        }

        if (invertNav) {
            setNavCopy(prevButton, 'Show next photo set', 'Next');
            setNavCopy(nextButton, 'Show previous photo set', 'Previous');
        }

        if (prevButton) {
            prevButton.addEventListener('click', function () {
                setActiveCard(currentCardIndex + (invertNav ? 1 : -1));
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                setActiveCard(currentCardIndex + (invertNav ? -1 : 1));
            });
        }

        cards.forEach(function (card, cardIndex) {
            card.addEventListener('click', function () {
                setActiveCard(cardIndex);
                if (isMobileView) {
                    return;
                }
                var img = card.querySelector('img');
                var fullSrc = card.getAttribute('data-full') || (img ? img.src : '');
                var altCopy = img ? img.alt : '';
                if (fullSrc) {
                    openLightbox(fullSrc, altCopy);
                }
            });
        });

        function handleTouchStart(event) {
            if (!isMobileView) {
                return;
            }
            var touch = event.touches && event.touches[0];
            if (!touch) {
                return;
            }
            swipeState.active = true;
            swipeState.startX = touch.clientX;
            swipeState.startY = touch.clientY;
            swipeState.vertical = false;
            swipeState.lockedDirection = null;
        }

        function handleTouchMove(event) {
            if (!isMobileView || !swipeState.active) {
                return;
            }
            var touch = event.touches && event.touches[0];
            if (!touch) {
                return;
            }
            var deltaX = touch.clientX - swipeState.startX;
            var deltaY = touch.clientY - swipeState.startY;
            var absDeltaX = Math.abs(deltaX);
            var absDeltaY = Math.abs(deltaY);

            if (!swipeState.lockedDirection) {
                if (absDeltaX < directionLockThreshold && absDeltaY < directionLockThreshold) {
                    return;
                }
                if (absDeltaY > absDeltaX * diagonalForgivenessRatio) {
                    swipeState.lockedDirection = 'vertical';
                    swipeState.vertical = true;
                    return;
                }
                swipeState.lockedDirection = 'horizontal';
                return;
            }

            if (swipeState.lockedDirection === 'horizontal' && absDeltaY > absDeltaX * diagonalForgivenessRatio) {
                swipeState.vertical = true;
                swipeState.lockedDirection = 'vertical';
            }
        }

        function handleTouchEnd(event) {
            if (!isMobileView || !swipeState.active) {
                return;
            }
            var touch = event.changedTouches && event.changedTouches[0];
            if (!touch) {
                swipeState.active = false;
                swipeState.lockedDirection = null;
                return;
            }
            if (swipeState.vertical) {
                swipeState.active = false;
                swipeState.lockedDirection = null;
                return;
            }
            var deltaX = touch.clientX - swipeState.startX;
            if (deltaX <= -swipeThreshold) {
                setActiveCard(currentCardIndex + (1 * swipeDirectionMultiplier));
            } else if (deltaX >= swipeThreshold) {
                setActiveCard(currentCardIndex - (1 * swipeDirectionMultiplier));
            }
            swipeState.active = false;
            swipeState.lockedDirection = null;
        }

        function handleTouchCancel() {
            swipeState.active = false;
            swipeState.vertical = false;
            swipeState.lockedDirection = null;
        }

        if (stack) {
            stack.addEventListener('touchstart', handleTouchStart, { passive: true });
            stack.addEventListener('touchmove', handleTouchMove, { passive: true });
            stack.addEventListener('touchend', handleTouchEnd, { passive: true });
            stack.addEventListener('touchcancel', handleTouchCancel, { passive: true });
        }

        function handleMediaChange() {
            isMobileView = mobileMedia ? mobileMedia.matches : getViewportWidth() <= 640;
            carousel.classList.toggle('carousel--touch', isMobileView);
        }

        if (mobileMedia) {
            if (typeof mobileMedia.addEventListener === 'function') {
                mobileMedia.addEventListener('change', handleMediaChange);
            } else if (typeof mobileMedia.addListener === 'function') {
                mobileMedia.addListener(handleMediaChange);
            }
        } else {
            window.addEventListener('resize', handleMediaChange);
        }

        handleMediaChange();
    });

    var tallyTriggers = Array.prototype.slice.call(document.querySelectorAll('[data-tally-trigger]'));
    if (tallyTriggers.length) {
        var tallyFormId = 'b5VLA6';
        var tallyMobileMedia = mobileMedia;

        function openTallyPopup() {
            var isCompact = tallyMobileMedia ? tallyMobileMedia.matches : getViewportWidth() <= 640;
            if (isCompact) {
                window.location.href = 'tally-mobile.html';
                return;
            }

            if (typeof window.Tally !== 'undefined' && typeof window.Tally.openPopup === 'function') {
                window.Tally.openPopup(tallyFormId, {
                    layout: 'modal',
                    width: 720,
                    hideTitle: false,
                    overlay: true,
                    alignLeft: false,
                    autoClose: 0
                });
            } else {
                window.open('https://tally.so/r/' + tallyFormId, '_blank', 'noopener');
            }
        }

        tallyTriggers.forEach(function (trigger) {
            trigger.addEventListener('click', openTallyPopup);
        });
    }
});
