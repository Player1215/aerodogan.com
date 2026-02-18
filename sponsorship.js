// Sponsorship Form Management
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('sponsorshipForm');
    const steps = {
        type: document.getElementById('step-type'),
        financial: document.getElementById('step-financial'),
        material: document.getElementById('step-material'),
        contact: document.getElementById('step-contact')
    };
    
    const buttons = {
        next: document.getElementById('nextBtn'),
        back: document.getElementById('backBtn'),
        submit: document.getElementById('submitBtn')
    };

    let currentStep = 'type';
    let sponsorshipType = null;
    let selectedPackage = null;
    let formStarted = false;
    let formSubmitted = false;

    // Turnstile status tracking
    const connectionDot = document.getElementById('connectionDot');
    const connectionText = document.getElementById('connectionStatusText');
    const turnstileMountId = 'turnstile-mount';
    let turnstileToken = null;
    let turnstileWidgetId = null;
    let turnstileStatus = 'pending';
    const turnstileWaiters = [];

    // Get translation function
    const t = (key) => {
        const lang = document.documentElement.lang || 'tr';
        if (lang === 'en' && window.I18N_TRANSLATIONS?.en?.texts?.[key]) {
            return window.I18N_TRANSLATIONS.en.texts[key];
        }
        return key;
    };

    // Track if form has been started
    const trackFormStart = () => {
        if (!formStarted) {
            formStarted = true;
        }
    };

    const setConnectionStatus = (state, messageKey, fallback) => {
        // state: pending | success | error
        turnstileStatus = state;
        const message = t(messageKey) || fallback;
        if (connectionText) connectionText.textContent = message;
        if (connectionDot) {
            connectionDot.classList.remove('status-pending', 'status-success', 'status-error');
            connectionDot.classList.add(`status-${state}`);
        }
    };

    const resolveTurnstileWaiters = (token) => {
        while (turnstileWaiters.length) {
            const resolver = turnstileWaiters.shift();
            resolver(token);
        }
    };

    const initTurnstile = () => {
        // Called once the Turnstile script is ready
        if (!window.turnstile) {
            setConnectionStatus('pending', 'Cloudflare bağlantısı kuruluyor...', 'Cloudflare bağlantısı kuruluyor...');
            setTimeout(initTurnstile, 600);
            return;
        }

        try {
            turnstileWidgetId = window.turnstile.render(`#${turnstileMountId}`, {
                sitekey: '0x4AAAAAACfLCnVLrRcwM0Ws',
                size: 'invisible',
                callback: (token) => {
                    turnstileToken = token;
                    setConnectionStatus('success', 'Cloudflare bağlantısı kuruldu.', 'Cloudflare bağlantısı kuruldu.');
                    resolveTurnstileWaiters(token);
                },
                'error-callback': () => {
                    turnstileToken = null;
                    setConnectionStatus('error', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
                },
                'timeout-callback': () => {
                    turnstileToken = null;
                    setConnectionStatus('error', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
                }
            });

            setConnectionStatus('pending', 'Cloudflare bağlantısı kuruluyor...', 'Cloudflare bağlantısı kuruluyor...');
            window.turnstile.execute(turnstileWidgetId);
        } catch (err) {
            turnstileToken = null;
            setConnectionStatus('error', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
            console.error('Turnstile init error:', err);
        }
    };

    const ensureTurnstileToken = () => {
        return new Promise((resolve, reject) => {
            if (turnstileToken) {
                return resolve(turnstileToken);
            }

            if (!window.turnstile || !turnstileWidgetId) {
                return reject(new Error('turnstile-unavailable'));
            }

            turnstileWaiters.push(resolve);

            try {
                setConnectionStatus('pending', 'Cloudflare bağlantısı kuruluyor...', 'Cloudflare bağlantısı kuruluyor...');
                window.turnstile.execute(turnstileWidgetId);
            } catch (err) {
                turnstileWaiters.pop();
                setConnectionStatus('error', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
                return reject(err);
            }

            // Timeout guard
            setTimeout(() => {
                if (!turnstileToken) {
                    setConnectionStatus('error', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.', 'Bağlantı sorunu. Lütfen daha sonra tekrar deneyin.');
                    reject(new Error('turnstile-timeout'));
                }
            }, 7000);
        });
    };

    // Add event listeners to detect form interaction
    form.addEventListener('change', trackFormStart);
    form.addEventListener('input', trackFormStart);

    // Confirm before leaving page if form is started but not submitted
    window.addEventListener('beforeunload', function(e) {
        if (formStarted && !formSubmitted) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });

    // Custom modal elements
    const modal = document.getElementById('exitModal');
    const modalCancel = document.getElementById('modalCancel');
    const modalConfirm = document.getElementById('modalConfirm');
    let pendingNavigation = null;

    // Show modal
    const showExitModal = () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Hide modal
    const hideExitModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        pendingNavigation = null;
    };

    // Modal cancel
    modalCancel.addEventListener('click', hideExitModal);

    // Modal confirm
    modalConfirm.addEventListener('click', () => {
        if (pendingNavigation) {
            formSubmitted = true;
            window.location.href = pendingNavigation;
        }
        hideExitModal();
    });

    // Close modal on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideExitModal();
        }
    });

    // Intercept navigation links
    const interceptNavigation = (e) => {
        if (formStarted && !formSubmitted) {
            e.preventDefault();
            pendingNavigation = e.currentTarget.href;
            showExitModal();
        }
    };

    // Add listeners to all navigation links
    const navLinks = [
        'navHomeLink', 'navIndexLink', 'navContactLink',
        'footerHomeLink', 'footerContactLink'
    ];
    
    navLinks.forEach(linkId => {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', interceptNavigation);
        }
    });

    // Initialize invisible Turnstile check
    initTurnstile();

    // Check if coming from URL with package parameter
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedPackage = urlParams.get('package');
    
    if (preselectedPackage) {
        // Auto-select financial sponsorship
        const financialRadio = document.querySelector('input[name="sponsorshipType"][value="financial"]');
        if (financialRadio) {
            financialRadio.checked = true;
            sponsorshipType = 'financial';
            
            // Auto-select the package
            setTimeout(() => {
                const packageRadio = document.querySelector(`input[name="financialPackage"][value="${preselectedPackage}"]`);
                if (packageRadio) {
                    packageRadio.checked = true;
                    selectedPackage = preselectedPackage;
                }
            }, 100);
        }
    }

    // Sponsorship Type Selection
    const typeRadios = document.querySelectorAll('input[name="sponsorshipType"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            sponsorshipType = this.value;
            buttons.next.disabled = false;
        });
    });
    
    // Make entire selection card clickable
    const selectionCards = document.querySelectorAll('.selection-card');
    selectionCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking the radio directly
            if (e.target.tagName === 'INPUT') return;
            
            const radio = this.querySelector('input[type="radio"]');
            if (radio && radio.name === 'sponsorshipType') {
                radio.checked = true;
                sponsorshipType = radio.value;
                buttons.next.disabled = false;
                // Trigger change event
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    // Financial Package Selection
    const financialRadios = document.querySelectorAll('input[name="financialPackage"]');
    financialRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            selectedPackage = this.value;
        });
    });
    
    // Make entire package card clickable
    const packageCards = document.querySelectorAll('.package-card');
    packageCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't trigger if clicking the radio directly (it will handle itself)
            if (e.target.tagName === 'INPUT') return;
            
            const radio = this.querySelector('input[type="radio"]');
            if (radio && radio.name === 'financialPackage') {
                radio.checked = true;
                selectedPackage = radio.value;
                // Trigger change event
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    });

    // Next Button
    buttons.next.addEventListener('click', function() {
        if (currentStep === 'type') {
            if (!sponsorshipType) {
                alert(t('Lütfen bir sponsorluk türü seçin.'));
                return;
            }
            
            // Move to appropriate next step
            steps.type.classList.add('hidden');
            
            if (sponsorshipType === 'financial') {
                steps.financial.classList.remove('hidden');
                currentStep = 'financial';
            } else {
                steps.material.classList.remove('hidden');
                currentStep = 'material';
            }
            
            buttons.back.classList.remove('hidden');
            
        } else if (currentStep === 'financial') {
            if (!selectedPackage) {
                alert(t('Lütfen bir paket seçin.'));
                return;
            }
            
            steps.financial.classList.add('hidden');
            steps.contact.classList.remove('hidden');
            currentStep = 'contact';
            
            buttons.next.classList.add('hidden');
            buttons.submit.classList.remove('hidden');
            
        } else if (currentStep === 'material') {
            const materialDesc = document.getElementById('materialDescription').value;
            const materialValue = document.querySelector('input[name="materialValue"]:checked');
            
            if (!materialDesc.trim() || !materialValue) {
                alert(t('Lütfen ürün/hizmet bilgisini ve değer aralığını doldurun.'));
                return;
            }
            
            steps.material.classList.add('hidden');
            steps.contact.classList.remove('hidden');
            currentStep = 'contact';
            
            buttons.next.classList.add('hidden');
            buttons.submit.classList.remove('hidden');
        }
        
        // Scroll to top of form smoothly
        setTimeout(() => {
            const stepTitle = document.querySelector('.step-title');
            if (stepTitle) {
                stepTitle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    });

    // Back Button
    buttons.back.addEventListener('click', function() {
        if (currentStep === 'financial' || currentStep === 'material') {
            steps.financial.classList.add('hidden');
            steps.material.classList.add('hidden');
            steps.type.classList.remove('hidden');
            currentStep = 'type';
            
            buttons.back.classList.add('hidden');
            
        } else if (currentStep === 'contact') {
            steps.contact.classList.add('hidden');
            
            if (sponsorshipType === 'financial') {
                steps.financial.classList.remove('hidden');
                currentStep = 'financial';
            } else {
                steps.material.classList.remove('hidden');
                currentStep = 'material';
            }
            
            buttons.next.classList.remove('hidden');
            buttons.submit.classList.add('hidden');
        }
        
        // Scroll to top of form smoothly
        setTimeout(() => {
            const stepTitle = document.querySelector('.step-title');
            if (stepTitle) {
                stepTitle.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 50);
    });

    // Form Submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate contact information
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!fullName || !email) {
            alert(t('Lütfen zorunlu alanları doldurun.'));
            return;
        }

        let turnstileResponse = null;
        try {
            turnstileResponse = await ensureTurnstileToken();
        } catch (err) {
            alert(t('Güvenlik doğrulaması şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'));
            return;
        }
        
        // Collect form data
        const formData = {
            sponsorshipType: sponsorshipType,
            fullName: fullName,
            email: email,
            phone: document.getElementById('phone').value.trim(),
            company: document.getElementById('company').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };
        
        if (sponsorshipType === 'financial') {
            formData.package = selectedPackage;
        } else {
            formData.materialDescription = document.getElementById('materialDescription').value.trim();
            formData.materialValue = document.querySelector('input[name="materialValue"]:checked')?.value;
        }
        
        // Log form data
        console.log('Sponsorship Application:', formData);

        // Send form data to Cloudflare Worker API
        const API_URL = "https://forum-api.smtaktas123.workers.dev";

        // Keep payload simple to avoid preflight; include token in multiple keys for backend flexibility
        const dbPayload = {
            sponsorship_type: formData.sponsorshipType,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            company: formData.company || null,
            notes: formData.notes || null,
            package: formData.package || null,
            material_description: formData.materialDescription || null,
            material_value: formData.materialValue || null,
            'cf-turnstile-response': turnstileResponse,
            turnstile_response: turnstileResponse
        };

        try {
            const response = await fetch(`${API_URL}/sponsorships`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "cf-turnstile-response": turnstileResponse
                },
                body: JSON.stringify(dbPayload)
            });

            const raw = await response.text();
            let result;
            try {
                result = JSON.parse(raw);
            } catch {
                result = { success: false, error: 'non-json', raw };
            }

            if (!response.ok || !result.success) {
                console.error("Veritabanına kayıt başarısız:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: result
                });
                alert(t('Form kaydedilemedi. Lütfen tekrar deneyin.'));
                return;
            }

            console.log("Veritabanına başarıyla kaydedildi.", result);
        } catch (err) {
            console.error("Veritabanına gönderim hatası:", err);
            alert(t('Form kaydedilemedi. Lütfen tekrar deneyin.'));
            return;
        } finally {
            if (window.turnstile && turnstileWidgetId) {
                window.turnstile.reset(turnstileWidgetId);
                turnstileToken = null;
                setConnectionStatus('pending', 'Cloudflare bağlantısı kuruluyor...', 'Cloudflare bağlantısı kuruluyor...');
                window.turnstile.execute(turnstileWidgetId);
            }
        }
        
        // Mark form as submitted to prevent warning
        formSubmitted = true;
        
        // Show success message
        showSuccessMessage();
    });

    function showSuccessMessage() {
        const formContainer = document.querySelector('.form-container');
        formContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✓</div>
                <h2 style="font-family: var(--font-display); font-size: 2rem; margin-bottom: 1rem; color: var(--color-primary);" data-i18n="Başvurunuz Alındı!">
                    ${t('Başvurunuz Alındı!')}
                </h2>
                <p style="color: var(--color-text-muted); font-size: 1.1rem; margin-bottom: 2rem;" data-i18n="Destek teklifiniz başarıyla iletildi. Ekibimiz en kısa sürede sizinle iletişime geçecektir.">
                    ${t('Destek teklifiniz başarıyla iletildi. Ekibimiz en kısa sürede sizinle iletişime geçecektir.')}
                </p>
                <a href="index.html" class="btn btn-next" style="text-decoration: none; display: inline-flex;" data-i18n="Ana Sayfaya Dön">
                    ${t('Ana Sayfaya Dön')}
                </a>
            </div>
        `;
    }

    // Phone number formatting (optional enhancement)
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.startsWith('90')) {
                    value = value.substring(2);
                }
                if (value.length <= 10) {
                    if (value.length > 6) {
                        value = value.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3');
                    } else if (value.length > 3) {
                        value = value.replace(/(\d{3})(\d{0,3})/, '$1 $2');
                    }
                    e.target.value = value.trim() ? '+90 ' + value.trim() : '';
                }
            }
        });
    }
});

const cors = {
  'Access-Control-Allow-Origin': 'https://aerodogan.com',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: cors });
}

// … işlem sonrası:
return new Response(JSON.stringify({ success: true }), {
  status: 200,
  headers: { 'Content-Type': 'application/json', ...cors }
});