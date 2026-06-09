/**
 * Cyberpunk Arcade Cabinet Portfolio Logic
 * Tailored for Shivan (Class XI-C)
 */

// --- 1. RETRO AUDIO SYNTHESIZER ---
class RetroSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser.");
        }
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', decay = true) {
        if (this.muted) return;
        
        // Safety check: Context must be explicitly running via user gesture
        if (!this.ctx || this.ctx.state === 'suspended') return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Low volume to be pleasant
        if (decay) {
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        } else {
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime + duration - 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        }

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

// Global engine instanced but protected against automated gesture blocks
const synthEngine = new RetroSynth();

document.addEventListener('click', () => {
    synthEngine.resume();
    }, { once: true });

    // Track scroll events to capture manual swipes/scrolls
    let scrollTimeout;
    viewport.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const width = viewport.clientWidth;
            if (width === 0) return;
            const computedIndex = Math.round(viewport.scrollLeft / width);
            if (computedIndex !== activeIndex) {
                activeIndex = computedIndex;
                synth.slide();
                triggerPanelAnimations(activeIndex);
            }
        }, 120);
    });

    // Helper to scroll to specific panel
    function navigateToPanel(index) {
        if (!screenPoweredOn) return;
        if (index < 0 || index >= numPanels) return;
        
        activeIndex = index;
        const targetX = index * viewport.clientWidth;
        viewport.scrollTo({
            left: targetX,
            behavior: 'smooth'
        });
        
        synth.slide();
        triggerPanelAnimations(activeIndex);
    }

    // Trigger animations in panels (e.g. Stats Bars loading)
    function triggerPanelAnimations(index) {
        // Stats page animations
        if (index === 1) {
            const statBars = document.querySelectorAll('.stat-bar-inner');
            statBars.forEach(bar => {
                const targetVal = bar.getAttribute('data-level');
                bar.style.width = targetVal;
            });
        } else {
            // Reset stats bar width when moving away to re-animate later
            const statBars = document.querySelectorAll('.stat-bar-inner');
            statBars.forEach(bar => {
                bar.style.width = '0%';
            });
        }

        // Marquee coin status tracker
        const coinPill = document.getElementById('cabinet-status-pill');
        if (index === 0) {
            coinPill.textContent = "COINS: 01";
            coinPill.style.color = "var(--neon-green)";
            coinPill.style.borderColor = "var(--neon-green)";
        } else {
            coinPill.textContent = "PLAYING";
            coinPill.style.color = "var(--neon-cyan)";
            coinPill.style.borderColor = "var(--neon-cyan)";
        }
    }

    // Initialize stats bars to 0% at start
    const statBars = document.querySelectorAll('.stat-bar-inner');
    statBars.forEach(bar => bar.style.width = '0%');

    // --- 3. HARDWARE BUTTON INTERACTION LOGIC ---

    // Joystick arrows
    const joyLeft = document.getElementById('joystick-left-btn');
    const joyRight = document.getElementById('joystick-right-btn');
    const joyStick = document.getElementById('joystick-stick');

    function animateJoystick(direction) {
        synth.click();
        if (direction === 'left') {
            joyStick.style.transform = 'translate(-10px, 0)';
            navigateToPanel(activeIndex - 1);
        } else {
            joyStick.style.transform = 'translate(10px, 0)';
            navigateToPanel(activeIndex + 1);
        }
        setTimeout(() => {
            joyStick.style.transform = 'none';
        }, 150);
    }

    joyLeft.addEventListener('click', () => animateJoystick('left'));
    joyRight.addEventListener('click', () => animateJoystick('right'));

    // Keyboard support (Arrow keys)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            animateJoystick('left');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            animateJoystick('right');
        }
    });

    // Arcade Navigation Buttons
    const btnLeft = document.getElementById('arcade-btn-left');
    const btnRight = document.getElementById('arcade-btn-right');
    const btnFx = document.getElementById('arcade-btn-fx');
    const btnMute = document.getElementById('arcade-btn-mute');

    btnLeft.addEventListener('click', () => {
        synth.click();
        navigateToPanel(activeIndex - 1);
    });
    btnRight.addEventListener('click', () => {
        synth.click();
        navigateToPanel(activeIndex + 1);
    });

    // Toggle FX (scanlines & flicker toggle)
    let fxActive = true;
    const scanlines = document.getElementById('crt-scanlines-layer');
    const flicker = document.getElementById('crt-flicker-layer');

    btnFx.addEventListener('click', () => {
        synth.click();
        fxActive = !fxActive;
        if (fxActive) {
            scanlines.style.opacity = '1';
            flicker.style.animationPlayState = 'running';
            btnFx.style.filter = 'none';
        } else {
            scanlines.style.opacity = '0';
            flicker.style.animationPlayState = 'paused';
            // dim button when off
            btnFx.style.filter = 'brightness(0.5)';
        }
    });

    // Sound toggle (mute/unmute)
    btnMute.addEventListener('click', () => {
        synth.muted = !synth.muted;
        if (synth.muted) {
            btnMute.style.filter = 'brightness(0.5)';
        } else {
            btnMute.style.filter = 'none';
            synth.click();
        }
    });

    // System utility buttons (Select, Start, Power)
    const btnSelect = document.getElementById('arcade-select-btn');
    const btnStart = document.getElementById('arcade-start-btn');
    const btnPower = document.getElementById('arcade-power-btn');
    const startScreenBtn = document.getElementById('start-game-btn');

    // Select takes to home/hero
    btnSelect.addEventListener('click', () => {
        synth.click();
        navigateToPanel(0);
    });

    // Start button acts as insert coin
    function startGameSequence() {
        synth.coin();
        // flash marquee status
        const logo = document.getElementById('marquee-logo-blink');
        logo.style.color = 'var(--neon-yellow)';
        setTimeout(() => {
            logo.style.color = '';
            navigateToPanel(1); // navigate to stats/education screen
        }, 600);
    }

    btnStart.addEventListener('click', startGameSequence);
    startScreenBtn.addEventListener('click', startGameSequence);

    // Power toggle (simulates CRT shutdown)
    btnPower.addEventListener('click', () => {
        screenPoweredOn = !screenPoweredOn;
        if (screenPoweredOn) {
            // turn on
            viewport.classList.remove('crt-off');
            viewport.classList.remove('crt-off-done');
            btnPower.style.filter = 'none';
            synth.power(true);
            triggerPanelAnimations(activeIndex);
        } else {
            // turn off
            synth.power(false);
            viewport.classList.add('crt-off');
            btnPower.style.filter = 'brightness(0.4)';
            setTimeout(() => {
                if (!screenPoweredOn) {
                    viewport.classList.add('crt-off-done');
                }
            }, 550);
        }
    });

    // --- 4. GITHUB DYNAMIC PROJECTS LOADER ---
    const repoGrid = document.getElementById('projects-grid-container');
    const apiIndicator = document.getElementById('api-status-indicator');

    // Fallback static project cards for Shivan's portfolio
    const fallbackProjects = [
        {
            name: "COMMERCE LEDGER CLI",
            language: "Python",
            description: "A secure console double-entry ledger database. Tracks transaction entries, accounts, trial balances, and compiles auto-formatted balance sheets.",
            html_url: "https://github.com/shivanchowdhry123"
        },
        {
            name: "LEDGER DATA VISUALIZER",
            language: "Python",
            description: "Interprets corporate journal data into analytical charts, displaying revenue breakdowns, cost distributions, and inventory turnovers.",
            html_url: "https://github.com/shivanchowdhry123"
        },
        {
            name: "CYBERPUNK CABINET PORTFOLIO",
            language: "HTML",
            description: "A gorgeous retro arcade aesthetic portfolio featuring responsive glass layout, simulated CRT visual filters, and custom synthesized 8-bit sound fx.",
            html_url: "https://github.com/shivanchowdhry123"
        }
    ];

    function renderProjects(projects) {
        repoGrid.innerHTML = ''; // Clear contents
        projects.forEach(project => {
            const langClass = (project.language || 'HTML').toLowerCase();
            const langLabel = project.language || 'CODESPACE';

            const card = document.createElement('div');
            card.className = `project-card lang-${langClass}`;
            card.innerHTML = `
                <div class="card-top-row">
                    <span class="project-title">${project.name.toUpperCase().replace(/-/g, ' ')}</span>
                    <span class="game-badge">${langLabel}</span>
                </div>
                <p class="project-description">${project.description || 'No description provided. Click below to inspect code and read details.'}</p>
                <div class="card-footer">
                    <div class="project-lang-detail">
                        <span class="lang-dot"></span>${langLabel}
                    </div>
                    <a href="${project.html_url}" target="_blank" class="project-link">
                        PLAY CODE <i class="fa-solid fa-chevron-right"></i>
                    </a>
                </div>
            `;
            
            // Add sound on hover
            card.addEventListener('mouseenter', () => {
                if (screenPoweredOn) synth.click();
            });

            repoGrid.appendChild(card);
        });
    }

    async function loadGitHubProjects() {
        try {
            const response = await fetch('https://api.github.com/users/shivanchowdhry123/repos?sort=updated&per_page=6');
            if (!response.ok) {
                throw new Error("API Limit reached or profile not found");
            }
            const data = await response.json();
            
            if (data && data.length > 0) {
                apiIndicator.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
                apiIndicator.style.color = 'var(--neon-green)';
                
                // Map API results
                const filteredRepos = data.map(repo => ({
                    name: repo.name,
                    language: repo.language || 'JavaScript',
                    description: repo.description,
                    html_url: repo.html_url
                }));
                renderProjects(filteredRepos);
            } else {
                // If user exists but has no public repos
                useFallbacks("NO PUBLIC REPOS DETECTED");
            }
        } catch (err) {
            useFallbacks("API OFFLINE (USING ARCHIVE)");
        }
    }

    function useFallbacks(message) {
        apiIndicator.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        apiIndicator.style.color = 'var(--neon-yellow)';
        renderProjects(fallbackProjects);
    }

    loadGitHubProjects();

    // --- 5. TERMINAL COMMAND FORM SUBMISSION ---
    const contactForm = document.getElementById('contact-terminal-form');
    const logsOutput = document.getElementById('terminal-logs');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear prior logs
            logsOutput.innerHTML = '';
            synth.click();

            const nameVal = document.getElementById('contact-name').value;
            const emailVal = document.getElementById('contact-email').value;
            const messageVal = document.getElementById('contact-message').value;

            // Simple validation check
            if (!nameVal || !emailVal || !messageVal) {
                printLogLine("shivan@codespace:~$ ERROR: Null fields detected.", "log-error");
                synth.error();
                return;
            }

            // Print sequence of CLI lines with timeouts to look like computations
            await printLogLine("shivan@codespace:~$ executing com-link transmission...", "log-prompt");
            await delay(400);
            await printLogLine("[CONNECTING] establishing orbital handshake...", "");
            await delay(500);
            await printLogLine("[ENCRYPTING] compiling secure digital envelope...", "");
            await delay(400);
            
            const submitBtn = document.getElementById('terminal-submit-btn');
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';

            try {
                // Perform async submission to Formspree
                const response = await fetch(contactForm.action, {
                    method: contactForm.method,
                    body: new FormData(contactForm),
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    await printLogLine("[TRANSMITTING] sending packet to codespace...", "");
                    await delay(500);
                    await printLogLine("[SUCCESS] transmission received! Code 200 OK.", "log-success");
                    synth.success();
                    contactForm.reset();
                } else {
                    throw new Error("Transmission interrupted.");
                }
            } catch (err) {
                await printLogLine("[FAILURE] transmission interrupted. Signal lost.", "log-error");
                await printLogLine("shivan@codespace:~$ RECOMMEND: manual com-link to shivanchowdhry123@gmail.com", "log-prompt");
                synth.error();
            } finally {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        });
    }

    // Helper functions for typewriter terminal logging
    function printLogLine(text, className) {
        return new Promise((resolve) => {
            const line = document.createElement('div');
            if (className) line.className = className;
            line.style.borderRight = '2px solid var(--neon-green)';
            line.style.whiteSpace = 'nowrap';
            line.style.overflow = 'hidden';
            logsOutput.appendChild(line);

            let charIdx = 0;
            function typeChar() {
                if (charIdx < text.length) {
                    line.textContent += text[charIdx];
                    charIdx++;
                    setTimeout(typeChar, 18);
                } else {
                    line.style.borderRight = 'none'; // remove cursor blinking
                    resolve();
                }
            }
            typeChar();
        });
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});
