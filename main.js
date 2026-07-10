// Portfolio Main JavaScript
// Reads content from certifications.json and projects.json (managed via /admin - Decap CMS).
// No client-side admin/CRUD — all editing happens through the CMS, which commits to GitHub.

class PortfolioManager {
    constructor() {
        this.projects = [];
        this.certifications = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.sortBy = 'date-desc';
        this.init();
    }

    async init() {
        await Promise.all([
            this.loadProjects(),
            this.loadCertifications()
        ]);
        this.setupEventListeners();
        this.initializeAnimations();
        this.applyProjectView();
        this.renderCertifications();
        this.setupScrollEffects();
        this.initializeParticles();
    }

    // ─── Data Loading ──────────────────────────────────────────────────────────

    async loadProjects() {
        try {
            const response = await fetch('projects.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load projects.json');
            const data = await response.json();
            this.projects = Array.isArray(data.items) ? data.items : [];
        } catch (error) {
            console.error(error);
            this.projects = [];
        }
    }

    async loadCertifications() {
        try {
            const response = await fetch('certifications.json', { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load certifications.json');
            const data = await response.json();
            this.certifications = Array.isArray(data.items) ? data.items : [];
        } catch (error) {
            console.error(error);
            this.certifications = [];
        }
    }

    // ─── Certifications ────────────────────────────────────────────────────────

    renderCertifications() {
        const certGrid = document.getElementById('certifications-grid');
        if (!certGrid) return;

        if (!this.certifications.length) {
            certGrid.innerHTML = `
                <div class="col-span-full text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p class="text-gray-600">No certifications yet.</p>
                </div>`;
            return;
        }

        const limit = parseInt(certGrid.dataset.limit, 10);
        const certsToRender = limit ? this.certifications.slice(0, limit) : this.certifications;

        certGrid.innerHTML = certsToRender.map((cert) => {
            // Image block — fallback uses flex centering in plain HTML, no innerHTML injection
            const imageBlock = cert.image
                ? `<div class="w-full h-40 bg-sage-50 overflow-hidden flex items-center justify-center">
                       <img src="${cert.image}" alt="${cert.title}"
                            class="cert-img w-full h-full object-contain p-2"
                            data-fallback="icon">
                   </div>`
                : `<div class="w-full h-40 bg-sage-50 flex items-center justify-center">
                       ${this._certIconSvg()}
                   </div>`;

            const cardInner = `
                ${imageBlock}
                <div class="p-6 text-center">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${cert.title}</h3>
                    <p class="text-gray-600 text-sm mb-3">${cert.issuer}</p>
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-sage-600 font-medium text-sm">${cert.year}</span>
                        ${cert.credentialUrl
                            ? `<span class="text-sage-400">•</span><span class="text-sage-600 text-sm font-medium">View credential →</span>`
                            : ''}
                    </div>
                </div>`;

            return cert.credentialUrl
                ? `<a href="${cert.credentialUrl}" target="_blank" rel="noopener noreferrer"
                      class="certification-badge block bg-white rounded-lg overflow-hidden border border-gray-100 hover:border-sage-300 hover:shadow-lg transition-all">
                       ${cardInner}
                   </a>`
                : `<div class="certification-badge bg-white rounded-lg overflow-hidden border border-gray-100">
                       ${cardInner}
                   </div>`;
        }).join('');

        // Attach error handlers after DOM is written — replaces broken img with centered icon
        certGrid.querySelectorAll('img.cert-img').forEach(img => {
            img.addEventListener('error', () => {
                const wrapper = img.closest('.w-full.h-40');
                if (wrapper) {
                    wrapper.innerHTML = `<div class="w-full h-full flex items-center justify-center">${this._certIconSvg()}</div>`;
                }
            });
        });
    }

    _certIconSvg() {
        return `<svg class="w-10 h-10 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0
                     3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946
                     3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138
                     3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806
                     3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438
                     3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z">
            </path>
        </svg>`;
    }

    // ─── Projects ──────────────────────────────────────────────────────────────

    applyProjectView() {
        this.renderProjects(this.getFilteredProjects());
    }

    getFilteredProjects() {
        let projects = [...this.projects];

        if (this.currentFilter !== 'all') {
            projects = projects.filter(p => p.category === this.currentFilter);
        }

        if (this.searchTerm) {
            projects = projects.filter(p =>
                p.title.toLowerCase().includes(this.searchTerm) ||
                p.description.toLowerCase().includes(this.searchTerm) ||
                p.technologies.join(' ').toLowerCase().includes(this.searchTerm)
            );
        }

        projects.sort((a, b) => {
            if (this.sortBy === 'date-asc')   return new Date(a.date) - new Date(b.date);
            if (this.sortBy === 'title-asc')  return a.title.localeCompare(b.title);
            if (this.sortBy === 'title-desc') return b.title.localeCompare(a.title);
            return new Date(b.date) - new Date(a.date);
        });

        return projects;
    }

    renderProjects(filteredProjects = null) {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        let projectsToRender = filteredProjects !== null ? filteredProjects : [...this.projects];

        if (!projectsToRender.length) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 bg-white rounded-lg p-8 border border-gray-100">
                    No projects match your search.
                </div>`;
            return;
        }

        const limit = parseInt(container.dataset.limit, 10);
        if (limit) projectsToRender = projectsToRender.slice(0, limit);

        container.innerHTML = projectsToRender.map((project, index) => {
            const pid = (project.id !== undefined && project.id !== null) ? project.id : `idx-${index}`;
            return `
            <div class="project-card group transform transition-all duration-300 hover:shadow-2xl"
                 data-project-id="${pid}">
                <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full">

                    <!-- Image zone — click opens lightbox -->
                    <div class="project-image-trigger relative overflow-hidden cursor-zoom-in flex-shrink-0"
                         data-project-id="${pid}">
                        <img src="${project.image}" alt="${project.title}"
                             class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                        <div class="w-full h-48 bg-sage-100 items-center justify-center" style="display:none;">
                            <svg class="w-12 h-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828
                                         0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2
                                         2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <!-- hover overlay hint -->
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                                    opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                    flex items-center justify-center pointer-events-none">
                            <span class="text-white text-xs font-mono tracking-widest uppercase">preview</span>
                        </div>
                        <!-- category badge -->
                        <div class="absolute top-3 right-3">
                            <span class="px-3 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full">
                                ${project.category}
                            </span>
                        </div>
                    </div>

                    <!-- Card body -->
                    <div class="p-6 flex flex-col flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-sage-600 transition-colors">
                            ${project.title}
                        </h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                            ${project.description}
                        </p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${project.technologies.map(tech =>
                                `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${tech}</span>`
                            ).join('')}
                        </div>
                        <div class="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
                            <span class="text-sm text-gray-400">
                                ${new Date(project.date).toLocaleDateString()}
                            </span>
                            <!-- View more — stops propagation so it doesn't also trigger the image lightbox -->
                            <button class="view-details-btn text-sage-600 hover:text-sage-800 font-semibold text-sm
                                           transition-colors"
                                    data-project-id="${pid}">
                                View more →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        anime({
            targets: '.project-card',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 600,
            easing: 'easeOutExpo',
            delay: anime.stagger(100)
        });
    }

    handleFilter(filter) {
        this.currentFilter = filter;

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('bg-sage-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });

        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
            activeBtn.classList.add('bg-sage-600', 'text-white');
        }

        this.applyProjectView();
    }

    // ─── Modals ────────────────────────────────────────────────────────────────

    showProjectModal(projectId) {
        const project = typeof projectId === 'string' && projectId.startsWith('idx-')
            ? this.projects[parseInt(projectId.replace('idx-', ''), 10)]
            : this.projects.find(p => p.id === projectId);
        if (!project) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div class="relative">
                    <button class="modal-close absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                                   bg-white/90 rounded-full text-gray-600 hover:text-gray-900 hover:bg-white
                                   shadow transition-all z-10">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <img src="${project.image}" alt="${project.title}"
                         class="w-full h-56 object-cover rounded-t-xl"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div class="w-full h-56 bg-sage-100 items-center justify-center rounded-t-xl" style="display:none;">
                        <svg class="w-16 h-16 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01
                                     M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-8">
                    <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">${project.title}</h2>
                            <span class="px-3 py-1 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
                                ${project.category}
                            </span>
                        </div>
                        <span class="text-gray-400 text-sm font-mono">
                            ${new Date(project.date).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="text-gray-700 mb-6 leading-relaxed">${project.description}</p>
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 mb-3">Technologies</h3>
                        <div class="flex flex-wrap gap-2">
                            ${project.technologies.map(tech =>
                                `<span class="px-3 py-1 bg-sage-100 text-sage-700 text-sm rounded-full">${tech}</span>`
                            ).join('')}
                        </div>
                    </div>
                    ${project.liveUrl || project.githubUrl ? `
                    <div class="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                        ${project.liveUrl ? `
                            <a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer"
                               class="px-5 py-2.5 bg-sage-600 text-white rounded-lg text-sm font-semibold
                                      hover:bg-sage-700 transition-colors">
                               Live Demo →
                            </a>` : ''}
                        ${project.githubUrl ? `
                            <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer"
                               class="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm
                                      font-semibold hover:bg-gray-50 transition-colors">
                               View Code
                            </a>` : ''}
                    </div>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        anime({ targets: modal,           opacity: [0, 1], duration: 250, easing: 'easeOutExpo' });
        anime({ targets: '.modal-content', scale: [0.94, 1], opacity: [0, 1], duration: 350, easing: 'easeOutExpo' });

        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    }

    showImageLightbox(projectId) {
        const project = typeof projectId === 'string' && projectId.startsWith('idx-')
            ? this.projects[parseInt(projectId.replace('idx-', ''), 10)]
            : this.projects.find(p => p.id === projectId);
        if (!project) return;

        const modal = document.createElement('div');
        modal.className = 'lightbox-overlay fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6';
        modal.innerHTML = `
            <button class="modal-close absolute top-5 right-5 w-10 h-10 flex items-center justify-center
                           rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
            <figure class="max-w-4xl w-full">
                <img src="${project.image}" alt="${project.title}"
                     class="w-full max-h-[80vh] object-contain rounded-lg shadow-2xl">
                <figcaption class="text-center text-white/70 mt-4 font-mono text-sm">${project.title}</figcaption>
            </figure>
        `;

        document.body.appendChild(modal);
        anime({ targets: modal, opacity: [0, 1], duration: 250, easing: 'easeOutExpo' });
        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay, .lightbox-overlay');
        if (modal) {
            anime({
                targets: modal,
                opacity: [1, 0],
                duration: 180,
                easing: 'easeOutExpo',
                complete: () => modal.remove()
            });
        }
    }

    // ─── Event Listeners ───────────────────────────────────────────────────────

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu    = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                const isOpen = !mobileMenu.classList.contains('hidden');
                mobileMenu.classList.toggle('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.currentTarget.dataset.filter);
            });
        });

        // Single delegated click handler on the document —
        // Order matters: check "View more" first, then image trigger, to avoid both firing.
        document.addEventListener('click', (e) => {
            // 1. "View more" button → open details modal
            const viewBtn = e.target.closest('.view-details-btn');
            if (viewBtn) {
                e.stopPropagation();
                const raw = viewBtn.dataset.projectId;
                const id = raw.startsWith('idx-') ? raw : parseInt(raw, 10);
                this.showProjectModal(id);
                return;
            }

            // 2. Image area → open lightbox
            const imgTrigger = e.target.closest('.project-image-trigger');
            if (imgTrigger) {
                const raw = imgTrigger.dataset.projectId;
                const id = raw.startsWith('idx-') ? raw : parseInt(raw, 10);
                this.showImageLightbox(id);
                return;
            }

            // 3. Click on overlay backdrop → close
            if (e.target.classList.contains('modal-overlay') ||
                e.target.classList.contains('lightbox-overlay')) {
                this.closeModal();
                return;
            }
        });

        // Escape key closes any open overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });

        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm.bind(this));
        }

        // Smooth scroll for in-page anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const sel = this.getAttribute('href');
                if (sel === '#') return;
                const target = document.querySelector(sel);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Search / sort (projects.html only)
        const searchInput = document.getElementById('search-input');
        const sortSelect  = document.getElementById('sort-select');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.trim().toLowerCase();
                this.applyProjectView();
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.applyProjectView();
            });
        }
    }

    // ─── Animations ────────────────────────────────────────────────────────────

    initializeAnimations() {
        if (document.querySelector('.hero-title')) {
            anime({
                targets: '.hero-title',
                opacity: [0, 1],
                translateY: [50, 0],
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 300
            });
        }
        if (document.querySelector('.hero-subtitle')) {
            anime({
                targets: '.hero-subtitle',
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 800,
                easing: 'easeOutExpo',
                delay: 600
            });
        }
        this.animateSkillBars();
    }

    animateSkillBars() {
        document.querySelectorAll('.skill-bar').forEach((bar, index) => {
            const width = bar.dataset.width || '80%';
            anime({
                targets: bar,
                width: width,
                duration: 1000,
                easing: 'easeOutExpo',
                delay: 200 * index
            });
        });
    }

    setupScrollEffects() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    }

    initializeParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = Array.from({ length: 50 }, () => ({
            x:       Math.random() * canvas.width,
            y:       Math.random() * canvas.height,
            vx:      (Math.random() - 0.5) * 0.5,
            vy:      (Math.random() - 0.5) * 0.5,
            size:    Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width)  p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 184, 150, ${p.opacity})`;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', () => {
            canvas.width  = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // ─── Contact Form ──────────────────────────────────────────────────────────

    handleContactForm(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : null;

        if (submitBtn) {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        }

        // No backend wired — hook up to Formspree or a serverless function to deliver messages.
        setTimeout(() => {
            showNotification("Message sent! I'll get back to you within 24 hours.", 'success');
            e.target.reset();
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }, 1200);
    }
}

// ─── Notification toast ────────────────────────────────────────────────────────

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = [
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm',
        'transform translate-x-full transition-transform duration-300',
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error'   ? 'bg-red-500 text-white'   : 'bg-blue-500 text-white'
    ].join(' ');
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => { notification.style.transform = 'translateX(0)'; }, 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 350);
    }, 5000);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
});
