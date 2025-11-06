document.addEventListener('DOMContentLoaded', function () {
    var yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = String(new Date().getFullYear());
    }

    var parallaxNodes = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (parallaxNodes.length && typeof window !== 'undefined') {
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

    var backdropVideo = document.querySelector('.video-backdrop__media');
    if (backdropVideo) {
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

    var carousels = Array.prototype.slice.call(document.querySelectorAll('[data-carousel]'));
    carousels.forEach(function (carousel) {
        var cards = Array.prototype.slice.call(carousel.querySelectorAll('.carousel__card'));
        if (!cards.length) {
            return;
        }

        var prevButton = carousel.querySelector('.carousel__nav--prev');
        var nextButton = carousel.querySelector('.carousel__nav--next');
        var currentCardIndex = 0;
        var directionAttr = carousel.getAttribute('data-carousel-direction');
        var directionMultiplier = directionAttr === 'reverse' ? -1 : 1;

        function setActiveCard(newIndex) {
            currentCardIndex = (newIndex + cards.length) % cards.length;
            cards.forEach(function (card, cardIndex) {
                var offset = cardIndex - currentCardIndex;
                var translateX = offset * 12 * directionMultiplier;
                var rotate = offset * 3 * directionMultiplier;
                var translateY = Math.abs(offset) * 4;
                card.style.transform = 'translate(-50%, -50%) translateX(' + translateX + '%) translateY(' + translateY + 'px) rotate(' + rotate + 'deg)';
                card.style.zIndex = String(cards.length - Math.abs(offset));
                if (cardIndex === currentCardIndex) {
                    card.classList.add('is-active');
                    card.removeAttribute('aria-hidden');
                    card.tabIndex = 0;
                } else {
                    card.classList.remove('is-active');
                    card.setAttribute('aria-hidden', 'true');
                    card.tabIndex = -1;
                }
            });
        }

        setActiveCard(0);

        if (prevButton) {
            prevButton.addEventListener('click', function () {
                setActiveCard(currentCardIndex - 1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                setActiveCard(currentCardIndex + 1);
            });
        }

        cards.forEach(function (card, cardIndex) {
            card.addEventListener('click', function () {
                setActiveCard(cardIndex);
                var img = card.querySelector('img');
                var fullSrc = card.getAttribute('data-full') || (img ? img.src : '');
                var altCopy = img ? img.alt : '';
                if (fullSrc) {
                    openLightbox(fullSrc, altCopy);
                }
            });
        });
    });
});
