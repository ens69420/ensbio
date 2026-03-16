document.addEventListener('DOMContentLoaded', () => {
    const lockscreen = document.getElementById('lockscreen');
    const audio = document.querySelector('.audioPlayer');
    const playIcon = document.querySelector('.play-pause');
    const pauseIcon = document.querySelector('.pause-icon');

    if (!lockscreen) {
        return;
    }

    const startMusic = () => {
        if (!audio) {
            return;
        }

        const playAttempt = audio.play();
        if (playAttempt && typeof playAttempt.catch === 'function') {
            playAttempt.catch(() => {
                // Ignore play race errors; user can still use manual controls.
            });
        }

        if (playIcon && pauseIcon) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        }
    };

    const unlock = () => {
        if (lockscreen.classList.contains('unlock')) {
            return;
        }

        startMusic();
        lockscreen.classList.add('unlock');
        window.setTimeout(() => {
            lockscreen.remove();
        }, 500);
    };

    lockscreen.addEventListener('click', unlock, { once: true });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            unlock();
        }
    });
});
