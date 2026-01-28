
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.interactive-card');
    const body = document.body;
    let overlay = null;
    let expandedCard = null;
    let cardPlaceholder = null;

    function createOverlay() {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            body.appendChild(overlay);

            overlay.addEventListener('click', closeExpandedCard);
        }
        return overlay;
    }

    function expandCard(card) {
        if (expandedCard === card) return;

        if (expandedCard) {
            closeExpandedCard();
        }

        const overlay = createOverlay();

        cardPlaceholder = document.createElement('div');
        cardPlaceholder.style.display = 'none';
        card.parentNode.insertBefore(cardPlaceholder, card);

        body.appendChild(card);

        expandedCard = card;
        card.classList.add('expanded');

        cards.forEach(otherCard => {
            if (otherCard !== card) {
                otherCard.classList.add('minimized');
            }
        });

        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        body.style.overflow = 'hidden';

        setTimeout(() => {
            card.scrollTop = 0;
        }, 100);
    }

    function closeExpandedCard() {
        if (!expandedCard) return;

        if (cardPlaceholder && cardPlaceholder.parentNode) {
            cardPlaceholder.parentNode.insertBefore(expandedCard, cardPlaceholder);
            cardPlaceholder.remove();
            cardPlaceholder = null;
        }

        expandedCard.classList.remove('expanded');

        cards.forEach(card => {
            card.classList.remove('minimized');
        });

        if (overlay) {
            overlay.classList.remove('active');
        }

        body.style.overflow = '';

        expandedCard = null;
    }

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn') ||
                e.target.closest('.close-btn') ||
                card.classList.contains('expanded')) {
                return;
            }

            expandCard(card);
        });

        const closeBtn = card.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeExpandedCard();
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && expandedCard) {
            closeExpandedCard();
        }
    });

    cards.forEach(card => {
        card.addEventListener('wheel', (e) => {
            if (card.classList.contains('expanded')) {
                e.stopPropagation();
            }
        });
    });
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');

    orbs.forEach((orb, index) => {
        const speed = 0.3 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

const interactiveCards = document.querySelectorAll('.interactive-card');

interactiveCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        if (card.classList.contains('expanded') || card.classList.contains('minimized')) {
            return;
        }

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 30;
        const rotateY = (centerX - x) / 30;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('expanded') && !card.classList.contains('minimized')) {
            card.style.transform = '';
        }
    });
});

window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.interactive-section').forEach(section => {
    observer.observe(section);
});

const VEHICLE_CONFIG = {
    'aero': [
        { name: 'SFX-223', img: 'images/SFX-223.jpg', video: 'videos/Afx_Fly.mp4', btnText: 'Uçuş Videosunu İzle' },
        { name: 'AFX-323', img: 'images/AFX-323.jpeg', video: null, btnText: 'Tanıtım Videosu' },
        { name: 'SFX-122', img: 'images/SFX-122.jpg', video: null, btnText: 'Tasarım Detayları' }
    ],
    'hidro': [
        { name: 'CAKA_ROV', img: 'images/cakarov.jpeg', video: 'videos/cakarov.mp4', btnText: 'Test Sürüşü' },
        { name: 'Altay', img: 'images/ALTAY.jpeg', video: 'videos/altay.mp4', btnText: 'Norveç Sualtı Videosu' },
        { name: 'Tuna', img: 'images/Tuna_foto.png', video: 'videos/ida_swim.mp4', btnText: 'Yüzme Videosu' },
        { name: 'Barbaros', img: 'images/barbaros.jpeg', video: null, btnText: 'Uçuş Videosu' },
        { name: 'ida', img: 'images/nacar.jpeg', video: null, btnText: 'Uçuş Videosu' },
        { name: 'prototip', img: 'images/prototip.png', video: null, btnText: 'Uçuş Videosu' }
    ],
    'gok': [
        { name: 'Roket denemesi', img: 'images/roket_1.jpeg', video: null, btnText: 'Fırlatma Videosu' }
    ],
    'elektro': [
        { name: 'robolig', img: 'images/TTR-123.jpeg', video: null, btnText: 'Çalışma Videosu' }
    ]
};

function renderVehicles() {
    Object.keys(VEHICLE_CONFIG).forEach(teamKey => {
        const container = document.querySelector(`[data-team="${teamKey}"] .vehicle-gallery`);
        if (!container) return;

        container.innerHTML = VEHICLE_CONFIG[teamKey].map(v => `
            <div class="vehicle-item" data-video="${v.video || ''}">
                <div class="vehicle-img-container">
                    <img src="${v.img}" alt="${v.name}" loading="lazy">
                    ${v.video ? `
                    <div class="video-overlay">
                        <button class="play-video-btn">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            <span>${v.btnText || 'Uçuş Videosunu İzle'}</span>
                        </button>
                    </div>
                    ` : ''}
                </div>
                <span class="vehicle-name">${v.name}</span>
            </div>
        `).join('');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderVehicles();

    const videoModal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const modalClose = document.querySelector('.modal-close');

    if (!videoModal || !modalVideo || !modalClose) return;

    document.addEventListener('click', (e) => {
        const playBtn = e.target.closest('.play-video-btn');
        if (!playBtn) return;

        const item = playBtn.closest('.vehicle-item');
        if (!item) return;

        const videoSrc = item.getAttribute('data-video');
        if (!videoSrc) return;

        e.stopPropagation();

        modalVideo.src = videoSrc;
        videoModal.classList.add('active');

        setTimeout(() => {
            modalVideo.play().catch(err => {
                console.log("Video auto-play failed: ", err);
            });
        }, 300);
    });

    const closeVideoModal = () => {
        videoModal.classList.remove('active');
        modalVideo.pause();
        modalVideo.currentTime = 0;
        modalVideo.src = "";
    };

    modalClose.addEventListener('click', closeVideoModal);
    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) closeVideoModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
});
