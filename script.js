
const themeToggle = document.getElementById('themeToggle');
const languageToggle = document.getElementById('languageToggle');
const root = document.documentElement;
let currentLang = localStorage.getItem('lang') === 'en' ? 'en' : 'tr';
const originalTextNodes = new WeakMap();

function getI18nData() {
    return (window.I18N_TRANSLATIONS && window.I18N_TRANSLATIONS.en) || { texts: {}, aria: {}, titles: {} };
}

function t(text) {
    if (currentLang !== 'en') return text;
    const map = getI18nData().texts || {};
    return map[text] || text;
}

function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

function updateLanguageButton() {
    if (!languageToggle) return;
    languageToggle.textContent = currentLang === 'en' ? 'TR' : 'EN';
}

function updateDocumentTitle() {
    const titles = getI18nData().titles || {};
    const path = window.location.pathname.endsWith('contact.html') ? '/contact.html' : '/index.html';

    if (currentLang === 'en') {
        document.title = titles[path] || document.title;
    } else {
        document.title = path === '/contact.html'
            ? 'İletişim ve Sponsorluk | DCFL Teknoloji Takımları'
            : 'DCFL Teknoloji Takımları | Ana Sayfa';
    }
}

function translateTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    let node;
    while ((node = walker.nextNode())) {
        if (!originalTextNodes.has(node)) {
            originalTextNodes.set(node, node.nodeValue);
        }

        const original = originalTextNodes.get(node);
        const normalized = normalizeText(original);

        if (currentLang === 'en') {
            const translated = t(normalized);
            if (translated !== normalized) {
                const leading = (original.match(/^\s*/) || [''])[0];
                const trailing = (original.match(/\s*$/) || [''])[0];
                node.nodeValue = `${leading}${translated}${trailing}`;
                if (node.parentElement) {
                    node.parentElement.classList.remove('i18n-flash');
                    void node.parentElement.offsetWidth;
                    node.parentElement.classList.add('i18n-flash');
                    setTimeout(() => {
                        node.parentElement?.classList.remove('i18n-flash');
                    }, 380);
                }
            } else {
                node.nodeValue = original;
            }
        } else {
            node.nodeValue = original;
            if (node.parentElement && normalized) {
                node.parentElement.classList.remove('i18n-flash');
                void node.parentElement.offsetWidth;
                node.parentElement.classList.add('i18n-flash');
                setTimeout(() => {
                    node.parentElement?.classList.remove('i18n-flash');
                }, 380);
            }
        }
    }
}

function translateAriaLabels() {
    const ariaMap = getI18nData().aria || {};
    document.querySelectorAll('[aria-label]').forEach((el) => {
        const current = el.getAttribute('aria-label');
        if (!current) return;

        if (!el.dataset.i18nAriaOriginal) {
            el.dataset.i18nAriaOriginal = current;
        }

        if (currentLang === 'en') {
            el.setAttribute('aria-label', ariaMap[el.dataset.i18nAriaOriginal] || el.dataset.i18nAriaOriginal);
        } else {
            el.setAttribute('aria-label', el.dataset.i18nAriaOriginal);
        }
    });
}

function translatePlaceholders() {
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const original = el.getAttribute('data-i18n-placeholder');
        if (!original) return;

        if (currentLang === 'en') {
            el.setAttribute('placeholder', t(original));
        } else {
            el.setAttribute('placeholder', original);
        }
    });
}

function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'tr';
    localStorage.setItem('lang', currentLang);
    document.documentElement.lang = currentLang;

    translateTextNodes();
    translateAriaLabels();
    translatePlaceholders();
    updateDocumentTitle();
    updateLanguageButton();
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    root.classList.add('light');
} else {
    root.classList.remove('light');
}

themeToggle?.addEventListener('click', () => {
    themeToggle.classList.remove('is-switching');
    void themeToggle.offsetWidth;
    themeToggle.classList.add('is-switching');

    root.classList.toggle('light');
    const currentTheme = root.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);

    setTimeout(() => {
        themeToggle.classList.remove('is-switching');
    }, 450);
});

languageToggle?.addEventListener('click', () => {
    languageToggle.classList.remove('is-switching');
    void languageToggle.offsetWidth;
    languageToggle.classList.add('is-switching');

    applyLanguage(currentLang === 'en' ? 'tr' : 'en');

    setTimeout(() => {
        languageToggle.classList.remove('is-switching');
    }, 450);
});

async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
}

function initializeCopyActions() {
    const copyButtons = document.querySelectorAll('[data-copy]');

    copyButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const textToCopy = button.getAttribute('data-copy');
            if (!textToCopy) return;

            const card = button.closest('.contact-card');
            const feedback = card?.querySelector('[data-copy-feedback]');

            try {
                await copyText(textToCopy);
                if (feedback) {
                    feedback.textContent = t('Telefon kopyalandı');
                    setTimeout(() => {
                        feedback.textContent = '';
                    }, 1800);
                }
            } catch {
                if (feedback) {
                    feedback.textContent = t('Kopyalama başarısız');
                }
            }
        });
    });
}

function optimizeMediaAssets() {
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
        if (img.hasAttribute('loading')) return;
        img.loading = index < 2 ? 'eager' : 'lazy';
        img.decoding = 'async';
    });
}

function initializeVehicleHoverPreview() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const videoItems = document.querySelectorAll('.vehicle-item[data-video]');
    videoItems.forEach((item) => {
        const videoSrc = item.getAttribute('data-video');
        const container = item.querySelector('.vehicle-img-container');

        if (!videoSrc || !container) return;

        if (container.querySelector('.vehicle-preview-video')) return;

        const preview = document.createElement('video');
        preview.className = 'vehicle-preview-video';
        preview.src = videoSrc;
        preview.muted = true;
        preview.loop = true;
        preview.playsInline = true;
        preview.preload = 'metadata';

        container.appendChild(preview);

        item.addEventListener('mouseenter', () => {
            item.classList.add('is-previewing');
            preview.play().catch(() => { });
        });

        item.addEventListener('mouseleave', () => {
            item.classList.remove('is-previewing');
            preview.pause();
            preview.currentTime = 0;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    applyLanguage(currentLang);
    initializeCopyActions();
    optimizeMediaAssets();

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
        { name: 'Altay', img: 'images/ALTAY.jpeg', video: 'videos/altay.mp4', btnText: 'Norveç Su Altı Videosu' },
        { name: 'Tuna', img: 'images/Tuna_foto.png', video: 'videos/ida_swim.mp4', btnText: 'Yüzme Videosu' },
        { name: 'Barbaros', img: 'images/barbaros.jpeg', video: null, btnText: 'Uçuş Videosu' },
        { name: 'Orhun', img: 'images/nacar.jpeg', video: null, btnText: 'Uçuş Videosu' },
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
    initializeVehicleHoverPreview();

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

/* ========================================
   EVENTS SLIDER FUNCTIONALITY
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    const sliderTrack = document.querySelector('.slider-track');
    const slides = document.querySelectorAll('.event-slide');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (!sliderTrack || slides.length === 0) return;

    let currentIndex = 0;
    let autoplayInterval;
    const autoplayDelay = 8000; // 8 saniye

    // Dot'ları oluştur
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (index === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Slide ${index + 1}`);
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.slider-dot');

    function updateSlider() {
        sliderTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        // Dot'ları güncelle
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        if (currentIndex >= slides.length) currentIndex = 0;
        if (currentIndex < 0) currentIndex = slides.length - 1;
        updateSlider();
        resetAutoplay();
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Autoplay
    function startAutoplay() {
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    function stopAutoplay() {
        clearInterval(autoplayInterval);
    }

    function resetAutoplay() {
        stopAutoplay();
        startAutoplay();
    }

    // Event Listeners
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    // Hover'da autoplay'i durdur
    const eventsSection = document.querySelector('.events-section');
    eventsSection.addEventListener('mouseenter', stopAutoplay);
    eventsSection.addEventListener('mouseleave', startAutoplay);

    // Touch/Swipe desteği
    let touchStartX = 0;
    let touchEndX = 0;

    sliderTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    sliderTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (diff > swipeThreshold) {
            nextSlide();
        } else if (diff < -swipeThreshold) {
            prevSlide();
        }
    }

    // Slide tıklama - ilgili takım kartına scroll
    slides.forEach(slide => {
        slide.addEventListener('click', (e) => {
            const targetTeam = slide.getAttribute('data-target');
            const scrollTo = slide.getAttribute('data-scroll-to');
            if (!targetTeam) return;

            // İlgili takım kartını bul
            const targetCard = document.querySelector(`.interactive-card[data-team="${targetTeam}"]`);
            if (!targetCard) return;

            // Önce kartı tıkla (genişletmek için)
            targetCard.click();

            // Kart açıldıktan sonra ilgili bölüme scroll et
            setTimeout(() => {
                const expandedCard = document.querySelector('.interactive-card.expanded');
                if (expandedCard && scrollTo) {
                    // Hedef elementi bul
                    const targetElement = expandedCard.querySelector(`#${scrollTo}`);
                    if (targetElement) {
                        // Biraz gecikme ile scroll - offset ile daha erken dur
                        setTimeout(() => {
                            const elementTop = targetElement.offsetTop;
                            const offset = 150; // Daha erken durması için offset
                            expandedCard.scrollTo({
                                top: elementTop - offset,
                                behavior: 'smooth'
                            });
                        }, 200);
                    }
                }
            }, 500);
        });
    });

    // Klavye navigasyonu
    document.addEventListener('keydown', (e) => {
        if (e.target.closest('.events-section')) {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        }
    });

    // Başlat
    startAutoplay();
});
