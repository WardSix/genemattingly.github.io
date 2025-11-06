document.addEventListener('DOMContentLoaded', function () {
    var yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = String(new Date().getFullYear());
    }

    var parallaxNodes = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!parallaxNodes.length || typeof window === 'undefined') {
        return;
    }

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
});
