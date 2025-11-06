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
});
