// 🔒 Lockscreen Configuration
const LOCKSCREEN_CONFIG = {
    // 🎥 Video Source - Change this path to your desired video
    videoUrl: '/img/video.webm',

    // 🎵 Audio Source - Music to play during lockscreen
    audioUrl: '/img/domain.mp3', // Change this to your desired audio file

    // ⏱️ Duration in seconds
    duration: 30,

    // 📝 Display Text
    title: "Domain Yenileyiniz.",
    subtitle: "Lütfen Domain Yenilemek İçin Ensomg İle İrtibata Geçiniz.",

    // 🖥️ Features
    autoFullscreen: true,
    disableRightClick: true,
    disableDevTools: true
};

// Main Function
function initLockscreen() {
    // 1. Create Lockscreen Elements
    const lockscreen = document.createElement('div');
    lockscreen.id = 'modern-lockscreen';

    // Styles for the lockscreen
    Object.assign(lockscreen.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '9999999', // Higher z-index to be absolutely sure
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
        cursor: 'not-allowed',
        pointerEvents: 'all' // Ensure it captures all clicks
    });

    // 2. Background Video with Blur
    const video = document.createElement('video');
    // Ensure URL is properly encoded if it contains spaces
    video.src = LOCKSCREEN_CONFIG.videoUrl.replace(/\s/g, '%20');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    Object.assign(video.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '100%',
        minHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'cover',
        filter: 'blur(15px) brightness(0.6)',
        zIndex: '1',
        pointerEvents: 'none' // Video shouldn't capture clicks
    });

    lockscreen.appendChild(video);

    // 3. Audio Setup
    let audio = null;
    if (LOCKSCREEN_CONFIG.audioUrl) {
        audio = new Audio(LOCKSCREEN_CONFIG.audioUrl);
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = 0.5; // Start at 50% volume
    }

    // 4. Content Container (Glassmorphism)
    const content = document.createElement('div');
    Object.assign(content.style, {
        position: 'relative',
        zIndex: '10', // Higher than video
        textAlign: 'center',
        color: 'white',
        fontFamily: "'Satoshi', sans-serif",
        backdropFilter: 'blur(10px)',
        padding: '3rem 4rem',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        pointerEvents: 'none' // Content shouldn't be clickable unless buttons are added
    });

    const titleConfig = document.createElement('h1');
    titleConfig.innerText = LOCKSCREEN_CONFIG.title;
    Object.assign(titleConfig.style, {
        fontSize: '2.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
    });

    const subtitleConfig = document.createElement('p');
    subtitleConfig.innerText = LOCKSCREEN_CONFIG.subtitle;
    Object.assign(subtitleConfig.style, {
        fontSize: '1rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '2rem'
    });

    const timer = document.createElement('div');
    Object.assign(timer.style, {
        fontSize: '4rem',
        fontWeight: '900',
        fontFamily: "'Chillax', sans-serif",
        color: '#fff',
        textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
    });

    content.appendChild(titleConfig);
    content.appendChild(subtitleConfig);
    content.appendChild(timer);
    lockscreen.appendChild(content);

    document.body.appendChild(lockscreen);

    // 5. Hide Main Content
    const container = document.getElementById('container') || document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.visibility = 'hidden';
        container.style.transition = 'opacity 0.8s ease';
    }

    // 6. Interaction Logic (Autoplay & Fullscreen)
    const attemptFeatures = () => {
        // Auto Fullscreen
        if (LOCKSCREEN_CONFIG.autoFullscreen) {
            const elem = document.documentElement;
            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(() => { });
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
            }
        }

        // Auto Audio
        if (audio && audio.paused) {
            audio.play().catch(() => { });
        }
    };

    // Try immediately
    attemptFeatures();

    // Try on any click on the lockscreen - effectively intercepting "background" clicks
    lockscreen.addEventListener('click', (e) => {
        attemptFeatures();
        e.stopPropagation(); // Stop click from reaching anything else
        e.preventDefault(); // Prevent default action
    });

    // Aggressive autoplay on any interaction
    const aggressiveEvents = ['click', 'keydown', 'touchstart'];
    const handleInteraction = () => {
        attemptFeatures();
        // Check if we should remove listeners (only if successful? Audio state check?)
        if (audio && !audio.paused && document.fullscreenElement) {
            // Optional: remove listeners if everything is active. 
            // But valid to keep them to retry if things stop/exit.
        }
    };

    aggressiveEvents.forEach(evt => {
        document.addEventListener(evt, handleInteraction, { once: false, capture: true });
        lockscreen.addEventListener(evt, handleInteraction, { once: false, capture: true });
    });


    // 7. Timer & Cleanup Logic
    let timeLeft = LOCKSCREEN_CONFIG.duration;
    timer.innerText = timeLeft;

    const interval = setInterval(() => {
        timeLeft--;
        timer.innerText = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(interval);
            unlockSite(lockscreen, container, audio);
        }
    }, 1000);

    // 8. Security Features
    if (LOCKSCREEN_CONFIG.disableRightClick) {
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    if (LOCKSCREEN_CONFIG.disableDevTools) {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.keyCode === 73 || e.keyCode === 74)) {
                e.preventDefault();
            }
            if (e.key === 'F12' || e.keyCode === 123) {
                e.preventDefault();
            }
            if (e.ctrlKey && (e.key === 'u' || e.keyCode === 85)) {
                e.preventDefault();
            }
        });
    }
}

function unlockSite(lockscreen, container, audio) {
    // Fade out audio if passed
    if (audio) {
        const fadeOut = setInterval(() => {
            if (audio.volume > 0.05) {
                audio.volume -= 0.05;
            } else {
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fadeOut);
            }
        }, 100);
    }

    // Fade out lockscreen
    lockscreen.style.transition = 'opacity 1s ease, transform 1s ease';
    lockscreen.style.opacity = '0';
    lockscreen.style.transform = 'scale(1.1)';
    lockscreen.style.pointerEvents = 'none'; // Ensure clicks pass through immediately after fade starts

    // Fade in content
    if (container) {
        container.style.visibility = 'visible';
        container.style.opacity = '1';

        // Trigger animations if they exist
        if (typeof animarElementosSequencialmente === 'function') {
            setTimeout(animarElementosSequencialmente, 500);
        }
    }

    // Remove from DOM
    setTimeout(() => {
        if (lockscreen.parentNode) {
            lockscreen.parentNode.removeChild(lockscreen);
        }
    }, 1000);
}

// Ensure init runs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLockscreen);
} else {
    initLockscreen();
}

// Re-implementing the function to animate elements sequentially 
function animarElementosSequencialmente() {
    const elementos = document.querySelectorAll('.elemento-para-animar');

    elementos.forEach((elemento) => {
        const delayClass = Array.from(elemento.classList).find(cls => cls.startsWith('delay-'));
        let delay = 0;

        if (delayClass) {
            const delayValue = parseInt(delayClass.replace('delay-', ''), 10);
            delay = delayValue * 100;
        } else if (elemento.dataset.delay) {
            delay = parseInt(elemento.dataset.delay, 10);
        }

        setTimeout(() => {
            elemento.style.transition = 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)';
            elemento.style.opacity = '1';
            elemento.style.transform = 'translateY(0)';
        }, delay);
    });
}
