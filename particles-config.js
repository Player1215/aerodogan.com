/* Particles.js Config */
function getParticlesColor() {
    return document.documentElement.classList.contains('light') ? '#0b1220' : '#00d4ff';
}

function getParticlesCount() {
    const isPhone = window.matchMedia('(max-width: 768px)').matches;
    return isPhone ? 34 : 100;
}

function hexToRgbObject(hex) {
    const normalized = hex.replace('#', '');
    const fullHex = normalized.length === 3
        ? normalized.split('').map((ch) => ch + ch).join('')
        : normalized;

    const intVal = parseInt(fullHex, 16);
    return {
        r: (intVal >> 16) & 255,
        g: (intVal >> 8) & 255,
        b: intVal & 255
    };
}

function applyParticlesThemeColor() {
    if (!window.pJSDom || !window.pJSDom.length) return;

    const pJS = window.pJSDom[0].pJS;
    const color = getParticlesColor();

    pJS.particles.color.value = color;
    pJS.particles.line_linked.color = color;

    pJS.particles.array.forEach((particle) => {
        particle.color.value = color;
        particle.color.rgb = hexToRgbObject(color);
    });

    pJS.fn.particlesRefresh();
}

particlesJS("particles-js", {
    "particles": {
        "number": {
            "value": getParticlesCount(),
            "density": {
                "enable": true,
                "value_area": 800
            }
        },
        "color": {
            "value": getParticlesColor()
        },
        "shape": {
            "type": "circle",
            "stroke": {
                "width": 0,
                "color": "#000000"
            },
            "polygon": {
                "nb_sides": 5
            }
        },
        "opacity": {
            "value": 0.5,
            "random": false,
            "anim": {
                "enable": false,
                "speed": 1,
                "opacity_min": 0.1,
                "sync": false
            }
        },
        "size": {
            "value": 3,
            "random": true,
            "anim": {
                "enable": false,
                "speed": 10,
                "size_min": 0.1,
                "sync": false
            }
        },
        "line_linked": {
            "enable": true,
            "distance": 150,
            "color": getParticlesColor(),
            "opacity": 0.4,
            "width": 1
        },
        "move": {
            "enable": true,
            "speed": 1,
            "direction": "none",
            "random": false,
            "straight": false,
            "out_mode": "out",
            "bounce": false,
            "attract": {
                "enable": false,
                "rotateX": 600,
                "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "window",
        "events": {
            "onhover": {
                "enable": true,
                "mode": "grab"
            },
            "onclick": {
                "enable": true,
                "mode": "repulse"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 150,
                "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                "size": 40,
                "duration": 2,
                "opacity": 8,
                "speed": 3
            },
            "repulse": {
                "distance": 200,
                "duration": 2
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": true
});

const themeClassObserver = new MutationObserver(() => {
    applyParticlesThemeColor();
});

themeClassObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
});
