document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    const musicContainer = document.querySelector('.music-container');
    const animatedElements = [container, musicContainer].filter(Boolean);

    animatedElements.forEach((element) => {
        element.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        element.style.zIndex = '1';
        element.style.position = 'relative';
        element.style.willChange = 'transform';
        element.style.backfaceVisibility = 'hidden';
        element.style.transformStyle = 'preserve-3d';
        element.style.opacity = '1';
    });

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let targetYOffset = container ? -60 : 0;
    let currentYOffset = targetYOffset;

    function animateTransform() {
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        currentYOffset += (targetYOffset - currentYOffset) * 0.05;

        if (container) {
            container.style.transform = `perspective(1000px) translateY(${currentYOffset}px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;
        }

        if (musicContainer) {
            musicContainer.style.transform = `perspective(1000px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;
        }

        requestAnimationFrame(animateTransform);
    }

    requestAnimationFrame(animateTransform);

    animatedElements.forEach((element) => {
        element.addEventListener('mousemove', (event) => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const offsetX = (x - centerX) / centerX;
            const offsetY = (y - centerY) / centerY;
            const intensity = 9;

            targetX = offsetX * intensity;
            targetY = offsetY * intensity;
            event.stopPropagation();
        });

        element.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
        });

        element.addEventListener('mouseenter', (event) => {
            event.stopPropagation();
        });
    });
});
