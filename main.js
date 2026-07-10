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

    renderCertifications() {
        const certGrid = document.getElementById('certifications-grid');
        if (!certGrid) return;

        if (!this.certifications.length) {
            certGrid.innerHTML = `
                <div class="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center col-span-full">
                    <p class="text-gray-600">No certifications yet.</p>
                </div>`;
            return;
        }

        const certIconSvg = `<svg class="w-10 h-10 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`;

        certGrid.innerHTML = this.certifications.map((cert) => {
            const cardInner = `
                <div class="w-full h-40 bg-sage-50 overflow-hidden flex items-center justify-center">
                    ${cert.image
                        ? `<img src="${cert.image}" alt="${cert.title}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.parentElement.innerHTML='${certIconSvg.replace(/'/g, "\\'")}';">`
                        : certIconSvg}
                </div>
                <div class="p-6 text-center">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${cert.title}</h3>
                    <p class="text-gray-600 text-sm mb-3">${cert.issuer}</p>
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-sage-600 font-medium text-sm">${cert.year}</span>
                        ${cert.credentialUrl ? `<span class="text-sage-400">•</span><span class="text-sage-600 text-sm font-medium">View credential →</span>` : ''}
                    </div>
                </div>`;

            return cert.credentialUrl
                ? `<a href="${cert.credentialUrl}" target="_blank" rel="noopener noreferrer" class="certification-badge block bg-white rounded-lg overflow-hidden relative border border-gray-100 hover:border-sage-300 hover:shadow-lg transition-all">${cardInner}</a>`
                : `<div class="certification-badge bg-white rounded-lg overflow-hidden relative border border-gray-100">${cardInner}</div>`;
        }).join('');
    }

    setupEventListeners() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                const isOpen = !mobileMenu.classList.contains('hidden');
                mobileMenu.classList.toggle('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', (!isOpen).toString());
            });
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilter(e.target.dataset.filter);
            });
        });

        // Project cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.project-card')) {
                const projectId = parseInt(e.target.closest('.project-card').dataset.projectId, 10);
                this.showProjectModal(projectId);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Contact form (any page that has one)
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm.bind(this));
        }

        // Smooth scrolling for in-page anchors
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetSelector = this.getAttribute('href');
                if (targetSelector === '#') return;
                const target = document.querySelector(targetSelector);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Search / sort (projects.html)
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
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

    applyProjectView() {
        this.renderProjects(this.getFilteredProjects());
    }

    getFilteredProjects() {
        let projects = [...this.projects];

        if (this.currentFilter !== 'all') {
            projects = projects.filter(project => project.category === this.currentFilter);
        }

        if (this.searchTerm) {
            projects = projects.filter(project =>
                project.title.toLowerCase().includes(this.searchTerm) ||
                project.description.toLowerCase().includes(this.searchTerm) ||
                project.technologies.join(' ').toLowerCase().includes(this.searchTerm)
            );
        }

        projects.sort((a, b) => {
            if (this.sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (this.sortBy === 'title-asc') return a.title.localeCompare(b.title);
            if (this.sortBy === 'title-desc') return b.title.localeCompare(a.title);
            return new Date(b.date) - new Date(a.date);
        });

        return projects;
    }

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
        const skillBars = document.querySelectorAll('.skill-bar');
        skillBars.forEach((bar, index) => {
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

    renderProjects(filteredProjects = null) {
        const container = document.getElementById('projects-grid');
        if (!container) return;

        const projectsToRender = filteredProjects || this.projects;

        if (!projectsToRender.length) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-500 bg-white rounded-lg p-8 border border-gray-100">
                    No projects match your search.
                </div>`;
            return;
        }

        container.innerHTML = projectsToRender.map(project => `
            <div class="project-card group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                 data-project-id="${project.id}">
                <div class="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-100">
                    <div class="relative overflow-hidden">
                        <img src="${project.image}" alt="${project.title}"
                             class="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div class="w-full h-48 bg-sage-100 flex items-center justify-center" style="display: none;">
                            <svg class="w-12 h-12 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="absolute top-4 right-4">
                            <span class="px-3 py-1 bg-sage-100 text-sage-700 text-xs font-medium rounded-full">
                                ${project.category}
                            </span>
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-sage-600 transition-colors">
                            ${project.title}
                        </h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                            ${project.description}
                        </p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${project.technologies.map(tech => `
                                <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    ${tech}
                                </span>
                            `).join('')}
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-500">
                                ${new Date(project.date).toLocaleDateString()}
                            </span>
                            <button class="text-sage-600 hover:text-sage-800 font-medium text-sm">
                                View Details →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

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

    showProjectModal(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="relative">
                    <button class="modal-close absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <img src="${project.image}" alt="${project.title}" class="w-full h-64 object-cover rounded-t-lg"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="w-full h-64 bg-sage-100 flex items-center justify-center rounded-t-lg" style="display: none;">
                        <svg class="w-16 h-16 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                </div>
                <div class="p-8">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-3xl font-bold text-gray-900 mb-2">${project.title}</h2>
                            <span class="px-3 py-1 bg-sage-100 text-sage-700 text-sm font-medium rounded-full">
                                ${project.category}
                            </span>
                        </div>
                        <span class="text-gray-500 text-sm">
                            ${new Date(project.date).toLocaleDateString()}
                        </span>
                    </div>
                    <p class="text-gray-700 mb-6 leading-relaxed">
                        ${project.description}
                    </p>
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">Technologies Used</h3>
                        <div class="flex flex-wrap gap-2">
                            ${project.technologies.map(tech => `
                                <span class="px-3 py-1 bg-sage-100 text-sage-700 text-sm rounded-full">
                                    ${tech}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        anime({ targets: modal, opacity: [0, 1], duration: 300, easing: 'easeOutExpo' });
        anime({ targets: '.modal-content', scale: [0.8, 1], opacity: [0, 1], duration: 400, easing: 'easeOutExpo', delay: 100 });

        modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            anime({
                targets: modal,
                opacity: [1, 0],
                duration: 200,
                easing: 'easeOutExpo',
                complete: () => modal.remove()
            });
        }
    }

    setupScrollEffects() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.scroll-animate').forEach(el => observer.observe(el));
    }

    initializeParticles() {
        const canvas = document.getElementById('particles-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(168, 184, 150, ${particle.opacity})`;
                ctx.fill();
            });
            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    handleContactForm(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : null;

        if (submitBtn) {
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        }

        // No backend wired up yet — this only simulates submission.
        // Hook this up to a form service (e.g. Formspree) or serverless function to actually deliver messages.
        setTimeout(() => {
            showNotification("Message sent successfully! I'll get back to you within 24 hours.", 'success');
            e.target.reset();
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }, 1200);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    window.portfolioManager = new PortfolioManager();
});
