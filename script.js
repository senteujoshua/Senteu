// ============================================
// JOSHUA SENTEU PORTFOLIO - Scripts
// ============================================

// ---- AI/ML Neural Network Background ----
(function () {
    const canvas = document.getElementById('neuralCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, nodes, pulses, mouse;

    const CONFIG = {
        nodeCount: 80,
        connectionDistance: 180,
        nodeSpeed: 0.3,
        nodeMinRadius: 1.5,
        nodeMaxRadius: 3,
        pulseSpeed: 2,
        pulseSpawnRate: 0.02,
        mouseRadius: 200,
        baseAlpha: 0.35,
        colors: {
            node: [155, 168, 171],       // --light
            connection: [74, 92, 106],    // --mid
            pulse: [155, 168, 171],       // --light
            glow: [37, 55, 69]           // --dark-3
        }
    };

    mouse = { x: -1000, y: -1000 };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createNodes() {
        nodes = [];
        const count = Math.min(CONFIG.nodeCount, Math.floor((width * height) / 15000));
        for (let i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * CONFIG.nodeSpeed,
                vy: (Math.random() - 0.5) * CONFIG.nodeSpeed,
                radius: CONFIG.nodeMinRadius + Math.random() * (CONFIG.nodeMaxRadius - CONFIG.nodeMinRadius),
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
        pulses = [];
    }

    function spawnPulse(fromNode, toNode) {
        pulses.push({
            fromX: fromNode.x,
            fromY: fromNode.y,
            toX: toNode.x,
            toY: toNode.y,
            progress: 0,
            speed: CONFIG.pulseSpeed / dist(fromNode.x, fromNode.y, toNode.x, toNode.y)
        });
    }

    function dist(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function update(time) {
        // Update nodes
        for (const node of nodes) {
            node.x += node.vx;
            node.y += node.vy;
            node.pulsePhase += 0.02;

            // Bounce off edges
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;

            // Keep in bounds
            node.x = Math.max(0, Math.min(width, node.x));
            node.y = Math.max(0, Math.min(height, node.y));

            // Mouse repulsion (subtle)
            const dx = node.x - mouse.x;
            const dy = node.y - mouse.y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < CONFIG.mouseRadius && d > 0) {
                const force = (CONFIG.mouseRadius - d) / CONFIG.mouseRadius * 0.02;
                node.vx += (dx / d) * force;
                node.vy += (dy / d) * force;
            }

            // Speed limit
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > CONFIG.nodeSpeed * 2) {
                node.vx = (node.vx / speed) * CONFIG.nodeSpeed * 2;
                node.vy = (node.vy / speed) * CONFIG.nodeSpeed * 2;
            }
        }

        // Spawn pulses randomly
        if (Math.random() < CONFIG.pulseSpawnRate && nodes.length > 1) {
            const from = nodes[Math.floor(Math.random() * nodes.length)];
            let closest = null;
            let closestDist = Infinity;
            for (const node of nodes) {
                if (node === from) continue;
                const d = dist(from.x, from.y, node.x, node.y);
                if (d < CONFIG.connectionDistance && d < closestDist) {
                    closest = node;
                    closestDist = d;
                }
            }
            if (closest) spawnPulse(from, closest);
        }

        // Update pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
            pulses[i].progress += pulses[i].speed;
            if (pulses[i].progress >= 1) {
                pulses.splice(i, 1);
            }
        }
    }

    function draw(time) {
        ctx.clearRect(0, 0, width, height);

        const scrollFade = Math.max(0, 1 - window.scrollY / (height * 1.5));
        const globalAlpha = CONFIG.baseAlpha * (0.3 + scrollFade * 0.7);

        // Draw connections
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const d = dist(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
                if (d < CONFIG.connectionDistance) {
                    const alpha = (1 - d / CONFIG.connectionDistance) * globalAlpha * 0.4;
                    const [r, g, b] = CONFIG.colors.connection;
                    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw data pulses
        for (const pulse of pulses) {
            const x = pulse.fromX + (pulse.toX - pulse.fromX) * pulse.progress;
            const y = pulse.fromY + (pulse.toY - pulse.fromY) * pulse.progress;
            const alpha = Math.sin(pulse.progress * Math.PI) * globalAlpha * 1.5;
            const [r, g, b] = CONFIG.colors.pulse;

            // Glow
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw nodes
        for (const node of nodes) {
            const pulse = 0.5 + Math.sin(node.pulsePhase) * 0.5;
            const [r, g, b] = CONFIG.colors.node;
            const alpha = globalAlpha * (0.4 + pulse * 0.6);

            // Glow
            const [gr, gg, gb] = CONFIG.colors.glow;
            const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4);
            glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`);
            glowGradient.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
            ctx.fill();

            // Node core
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function loop(time) {
        update(time);
        draw(time);
        requestAnimationFrame(loop);
    }

    window.addEventListener('resize', () => {
        resize();
        createNodes();
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    resize();
    createNodes();
    requestAnimationFrame(loop);
})();

document.addEventListener('DOMContentLoaded', () => {

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active nav link
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // ---- Mobile nav toggle ----
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // ---- Scroll reveal / Intersection Observer ----
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animation
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all elements with data-aos attribute or animatable classes
    const animateElements = document.querySelectorAll(
        '.skill-category, .timeline-item, .project-card, .achievement-card, .education-card'
    );
    animateElements.forEach(el => observer.observe(el));

    // ---- Counter animation ----
    const statNumbers = document.querySelectorAll('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => counterObserver.observe(num));

    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 30;
        const duration = 1500;
        const stepTime = duration / 30;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, stepTime);
    }

    // ---- Smooth scroll for anchor links ----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ---- Parallax effect on hero grid ----
    const heroGrid = document.querySelector('.hero-bg-grid');
    if (heroGrid) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            heroGrid.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }

    // ---- Navbar toggle animation ----
    const style = document.createElement('style');
    style.textContent = `
        .nav-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        .nav-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        .nav-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }
    `;
    document.head.appendChild(style);
});
