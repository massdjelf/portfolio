// Portfolio Main JavaScript
// Modern Portfolio with Interactive Components and Admin Authentication

class PortfolioManager {
    constructor() {
        this.defaultProjects = [
            {
                id: 1,
                title: "Web Application Dashboard",
                category: "web",
                description: "Comprehensive project management dashboard with real-time analytics, user management, and data visualization. Built with modern web technologies and responsive design principles, in addition to that uml methods were used to insure that the project is well organized and lacks on nothing in terms of funtionalities and performance",
                technologies: ["React", "Node.js","Chart.js","pyhton","apache","php"],
                image: "resources/app-pfe.jpg",
                date: "2024-10-10",
                featured: true
            },
            {
                id: 2,
                title: "Mobile Social App",
                category: "mobile",
                description: "Social networking application with clean UI design, real-time messaging, and intuitive user experience. Optimized for Android platforms.",
                technologies: ["Java","androidstudio","xml","sqlite"],
                image: "resources/project-mobile.jpg",
                date: "2024-07-20",
                featured: true
            },
            {
                id: 3,
                title: "Data Analytics Platform",
                category: "data",
                description: "Linear programming where i used mathematical methods to calculate optimum solutions for a specific problem the number of data that u could insert is huge and i'm using Big-M method to calculate it while showing the first matrix and then directly the answer this is the repository: https://github.com/massdjelf/plBig-M ",
                technologies: ["Python"],
                image: "resources/project-data.jpg",
                date: "2024-06-10",
                featured: true
            },
            {
                id: 4,
                title: "E-Commerce Store",
                category: "web",
                description: "Full-featured online store with product management, shopping cart, payment integration, and inventory tracking. Modern design with JS automated animations costume built for the clients liking with an excellent user experience.",
                technologies: ["flask", "python", "MySQL", "JS","bootsrap"],
                image: "resources/project-design.jpg",
                date: "2024-05-05",
                featured: false
            },
            {
                id: 5,
                title: "Creative Portfolio",
                category: "design",
                description: "Artistic portfolio website showcasing creative work with beautiful galleries, smooth animations, and engaging visual storytelling.",
                technologies: ["HTML5", "CSS3", "JavaScript", "GSAP"],
                image: "resources/project-portfolio.jpg",
                date: "2024-04-12",
                featured: true
            },
     
        ];
        
        this.projects = [];
        this.defaultCertifications = [
            { id: 1, title: 'Responsive Web Design', issuer: 'freeCodeCamp', year: '2024', image: '' },
            { id: 2, title: 'Python for Data Analysis', issuer: 'Coursera', year: '2024', image: '' },
            { id: 3, title: 'Android App Development', issuer: 'Google Career Certificate', year: '2025', image: '' }
        ];
        this.certifications = [];
        this.isCertAdmin = false;
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.sortBy = 'date-desc';
        this.isAdmin = false;
        this.adminPassword = null;
        this.uploadedFiles = [];
        this.editingProjectId = null;
        this.init();
    }

    async init() {
        await this.loadEnvConfig();
        this.loadProjects();
        this.setupEventListeners();
        this.initializeAnimations();
        this.applyProjectView();
        this.setupScrollEffects();
        this.initializeParticles();
        this.initializeAdminFeatures();
        this.initializeUploadFeatures();
        this.initializeProjectManagement();
        this.initializeCertificationFeatures();
    }
    initializeCertificationFeatures() {
        const certGrid = document.getElementById('certifications-grid');
        if (!certGrid) return;
        const certAdminBtn = document.getElementById('cert-admin-btn');
        const certAdminPanel = document.getElementById('cert-admin-panel');
        const certAdminNote = document.getElementById('cert-admin-note');
        const certForm = document.getElementById('cert-form');
        this.isCertAdmin = localStorage.getItem('portfolioAdmin') === 'true';
        this.certifications = this.loadCertifications();

        const renderCertifications = () => {
            certGrid.innerHTML = this.certifications.map((cert) => `
                <div class="certification-badge bg-white rounded-lg p-6 text-center relative border border-gray-100">
                    ${this.isCertAdmin ? `<button type="button" data-cert-id="${cert.id}" class="delete-cert-btn absolute top-3 right-3 text-red-500 hover:text-red-700">✕</button>` : ''}
                    <div class="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                        ${cert.image ? `<img src="${cert.image}" alt="${cert.title}" class="w-full h-full object-cover">` : `<svg class="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>`}
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 mb-2">${cert.title}</h3>
                    <p class="text-gray-600 text-sm mb-3">${cert.issuer}</p>
                    <span class="text-sage-600 font-medium text-sm">${cert.year}</span>
                </div>`).join('');
        };
        const refreshAdminUI = () => {
            if (certAdminPanel) certAdminPanel.classList.toggle('hidden', !this.isCertAdmin);
            if (certAdminBtn) certAdminBtn.textContent = this.isCertAdmin ? 'Certification Admin Logout' : 'Certification Admin Login';
            if (certAdminNote) certAdminNote.textContent = this.isCertAdmin ? 'Admin mode enabled: you can add and remove certifications.' : 'Login to add or remove certifications.';
            renderCertifications();
        };
        if (certAdminBtn) {
            certAdminBtn.addEventListener('click', () => {
                if (this.isCertAdmin) {
                    this.isCertAdmin = false;
                    refreshAdminUI();
                    return;
                }
                this.showAdminLogin();
                this.isCertAdmin = this.isAdmin;
                refreshAdminUI();
            });
        }
        certGrid.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-cert-btn');
            if (!deleteBtn || !this.isCertAdmin) return;
            const certId = Number(deleteBtn.dataset.certId);
            this.certifications = this.certifications.filter((cert) => cert.id !== certId);
            this.saveCertifications();
            renderCertifications();
        });
        if (certForm) {
            certForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!this.isCertAdmin) return;
                const formData = new FormData(certForm);
                const imageFile = formData.get('imageFile');
                let image = formData.get('imageUrl') || '';
                if (imageFile && imageFile.size > 0) {
                    image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = (event) => resolve(event.target?.result || '');
                        reader.onerror = reject;
                        reader.readAsDataURL(imageFile);
                    });
                }
                this.certifications.unshift({ id: Date.now(), title: formData.get('title').trim(), issuer: formData.get('issuer').trim(), year: String(formData.get('year')).trim(), image });
                this.saveCertifications();
                certForm.reset();
                renderCertifications();
            });
        }
        refreshAdminUI();
    }
    loadCertifications() {
        try {
            const stored = localStorage.getItem('portfolioCertifications');
            return stored ? JSON.parse(stored) : this.defaultCertifications;
        } catch (err) {
            return this.defaultCertifications;
        }
    }
    saveCertifications() {
        localStorage.setItem('portfolioCertifications', JSON.stringify(this.certifications));
    }

    async loadEnvConfig() {
        try {
            const response = await fetch('.env');
            if (!response.ok) return;
            const envText = await response.text();
            envText.split('\n').forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=').trim();
                if (key.trim() === 'ADMIN_PASSWORD') {
                    this.adminPassword = value;
                }
            });
        } catch (error) {
            // Ignore when .env is not available
        }
        if (!this.adminPassword) {
            this.adminPassword = localStorage.getItem('portfolioAdminPassword') || null;
        }
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
            if (e.target.closest('.project-admin-action')) return;
            if (e.target.closest('.project-card')) {
                const projectId = parseInt(e.target.closest('.project-card').dataset.projectId);
                this.showProjectModal(projectId);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactForm.bind(this));
        }

        // Admin login
        const adminLoginBtn = document.getElementById('admin-login-btn');
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', this.showAdminLogin.bind(this));
        }

        // Smooth scrolling for navigation
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

        // Upload files list actions
        document.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.delete-upload-btn');
            if (!deleteButton) return;

            const fileId = deleteButton.dataset.fileId;
            this.deleteUploadedFile(fileId);
        });

        // Project edit and delete actions
        document.addEventListener('click', (e) => {
            const editButton = e.target.closest('.edit-project-btn');
            if (editButton) {
                this.openProjectModal(parseInt(editButton.dataset.projectId, 10));
                return;
            }

            const deleteButton = e.target.closest('.delete-project-btn');
            if (!deleteButton) return;

            const projectId = parseInt(deleteButton.dataset.projectId, 10);
            this.deleteProject(projectId);
        });
    }

    initializeAdminFeatures() {
        // Check if user is already logged in as admin
        const adminStatus = localStorage.getItem('portfolioAdmin');
        if (adminStatus === 'true') {
            this.isAdmin = true;
            this.showAdminControls();
        } else {
            this.hideAdminControls();
        }
    }

    showAdminLogin() {
        if (!this.adminPassword) {
            const newPassword = prompt('ADMIN_PASSWORD not found. Set a temporary admin password for this browser:');
            if (!newPassword || !newPassword.trim()) {
                showNotification('Admin password setup canceled.', 'error');
                return;
            }
            this.adminPassword = newPassword.trim();
            localStorage.setItem('portfolioAdminPassword', this.adminPassword);
            showNotification('Temporary admin password saved for this browser.', 'success');
        }
        const password = prompt('Enter admin password:');
        if (password === this.adminPassword) {
            this.isAdmin = true;
            localStorage.setItem('portfolioAdmin', 'true');
            this.showAdminControls();
            showNotification('Admin access granted!', 'success');
        } else {
            showNotification('Incorrect password!', 'error');
        }
    }

    showAdminControls() {
        // Show admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.classList.remove('hidden');
        });

        // Hide admin info message
        const adminInfo = document.getElementById('admin-info');
        if (adminInfo) {
            adminInfo.classList.add('hidden');
        }

        // Update admin login button
        const adminLoginBtn = document.getElementById('admin-login-btn');
        if (adminLoginBtn) {
            adminLoginBtn.textContent = 'Admin Logout';
            adminLoginBtn.removeEventListener('click', this.showAdminLogin.bind(this));
            adminLoginBtn.addEventListener('click', this.logoutAdmin.bind(this));
        }

        this.applyProjectView();
    }

    hideAdminControls() {
        // Hide admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.classList.add('hidden');
        });

        // Show admin info message
        const adminInfo = document.getElementById('admin-info');
        if (adminInfo) {
            adminInfo.classList.remove('hidden');
        }

        // Update admin login button
        const adminLoginBtn = document.getElementById('admin-login-btn');
        if (adminLoginBtn) {
            adminLoginBtn.textContent = 'Admin Login';
            adminLoginBtn.removeEventListener('click', this.logoutAdmin.bind(this));
            adminLoginBtn.addEventListener('click', this.showAdminLogin.bind(this));
        }

        this.applyProjectView();
    }

    logoutAdmin() {
        this.isAdmin = false;
        localStorage.removeItem('portfolioAdmin');
        this.hideAdminControls();
        showNotification('Logged out successfully!', 'info');
    }

    initializeUploadFeatures() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        if (!uploadArea || !fileInput) return;

        this.loadUploadedFiles();
        this.renderUploadedFiles();

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
            fileInput.value = '';
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer?.files || [];
            this.handleFileUpload(files);
        });
    }

    loadUploadedFiles() {
        try {
            const storedFiles = localStorage.getItem('portfolioUploadedFiles');
            this.uploadedFiles = storedFiles ? JSON.parse(storedFiles) : [];
        } catch (error) {
            this.uploadedFiles = [];
        }
    }

    saveUploadedFiles() {
        localStorage.setItem('portfolioUploadedFiles', JSON.stringify(this.uploadedFiles));
    }

    handleFileUpload(fileList) {
        const files = Array.from(fileList);
        if (!files.length) return;

        const acceptedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024;

        files.forEach((file) => {
            if (!acceptedMimeTypes.includes(file.type)) {
                showNotification(`"${file.name}" is not supported. Use PNG, JPG, or PDF.`, 'error');
                return;
            }

            if (file.size > maxSize) {
                showNotification(`"${file.name}" exceeds 10MB.`, 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const uploadedFile = {
                    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    url: event.target?.result || ''
                };

                this.uploadedFiles.unshift(uploadedFile);
                this.saveUploadedFiles();
                this.renderUploadedFiles();
                this.populateProjectImageOptions();
                showNotification(`Uploaded "${file.name}" successfully.`, 'success');
            };

            reader.onerror = () => {
                showNotification(`Failed to upload "${file.name}".`, 'error');
            };

            reader.readAsDataURL(file);
        });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    renderUploadedFiles() {
        const uploadedFilesContainer = document.getElementById('uploaded-files');
        if (!uploadedFilesContainer) return;

        if (!this.uploadedFiles.length) {
            uploadedFilesContainer.innerHTML = `
                <div class="col-span-full text-sm text-gray-500 bg-white rounded-lg p-4 text-center border border-gray-200">
                    No files uploaded yet.
                </div>
            `;
            return;
        }

        uploadedFilesContainer.innerHTML = this.uploadedFiles.map((file) => `
            <div class="bg-white rounded-lg border border-gray-200 p-3 relative">
                <button
                    class="delete-upload-btn absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
                    data-file-id="${file.id}"
                    type="button"
                    aria-label="Delete ${file.name}"
                >
                    ✕
                </button>
                <div class="mb-2 h-20 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                    ${file.type === 'application/pdf'
                        ? '<span class="text-xs font-semibold text-sage-700">PDF</span>'
                        : `<img src="${file.url}" alt="${file.name}" class="w-full h-full object-cover">`
                    }
                </div>
                <p class="text-xs text-gray-800 truncate" title="${file.name}">${file.name}</p>
                <p class="text-[11px] text-gray-500">${this.formatFileSize(file.size)}</p>
            </div>
        `).join('');
    }

    deleteUploadedFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.id !== fileId);
        this.saveUploadedFiles();
        this.renderUploadedFiles();
        this.populateProjectImageOptions();
        showNotification('File removed.', 'info');
    }

    initializeProjectManagement() {
        const addProjectBtn = document.getElementById('add-project-btn');
        const projectForm = document.getElementById('add-project-form');
        const closeModalBtn = document.getElementById('close-modal-btn');
        const cancelBtn = document.getElementById('cancel-btn');
        const modal = document.getElementById('add-project-modal');
        const searchInput = document.getElementById('search-input');
        const sortSelect = document.getElementById('sort-select');
        const loadMoreBtn = document.getElementById('load-more-btn');

        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => this.openProjectModal());
        }

        if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeProjectModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeProjectModal());

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeProjectModal();
            });
        }

        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleProjectFormSubmit(e));
        }

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

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                showNotification('All projects are already loaded.', 'info');
            });
        }

        this.populateProjectImageOptions();
    }

    loadProjects() {
        try {
            const storedProjects = localStorage.getItem('portfolioProjects');
            this.projects = storedProjects ? JSON.parse(storedProjects) : [...this.defaultProjects];
        } catch (error) {
            this.projects = [...this.defaultProjects];
        }
    }

    saveProjects() {
        localStorage.setItem('portfolioProjects', JSON.stringify(this.projects));
    }

    openProjectModal(projectId = null) {
        const modal = document.getElementById('add-project-modal');
        const form = document.getElementById('add-project-form');
        if (!modal || !form) return;

        this.editingProjectId = projectId;
        this.populateProjectImageOptions();

        const title = document.getElementById('project-modal-title');
        const submitText = document.getElementById('project-submit-text');

        if (projectId) {
            const project = this.projects.find(item => item.id === projectId);
            if (!project) return;

            form.elements.title.value = project.title;
            form.elements.category.value = project.category;
            form.elements.description.value = project.description;
            form.elements.technologies.value = project.technologies.join(', ');
            form.elements.date.value = project.date;
            form.elements['image-select'] ? form.elements['image-select'].value = project.image || '' : null;
            if (title) title.textContent = 'Edit Project';
            if (submitText) submitText.textContent = 'Save Changes';
        } else {
            form.reset();
            if (title) title.textContent = 'Add New Project';
            if (submitText) submitText.textContent = 'Add Project';
        }

        modal.classList.remove('hidden');
    }

    closeProjectModal() {
        const modal = document.getElementById('add-project-modal');
        const form = document.getElementById('add-project-form');
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
        this.editingProjectId = null;
    }

    populateProjectImageOptions() {
        const imageSelect = document.getElementById('project-image-select');
        if (!imageSelect) return;

        const imageFiles = this.uploadedFiles.filter(file => file.type.startsWith('image/'));
        imageSelect.innerHTML = `
            <option value="">Default portfolio image</option>
            ${imageFiles.map(file => `<option value="${file.url}">${file.name}</option>`).join('')}
        `;
    }

    async handleProjectFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);

        const screenshotFile = formData.get('projectScreenshot');
        const selectedImage = formData.get('image-select') || '';
        let image = selectedImage || 'resources/project-portfolio.jpg';

        if (screenshotFile && screenshotFile.size > 0) {
            image = await this.readFileAsDataUrl(screenshotFile);
        }

        const projectData = {
            title: formData.get('title').trim(),
            category: formData.get('category'),
            description: formData.get('description').trim(),
            technologies: formData.get('technologies').split(',').map(item => item.trim()).filter(Boolean),
            date: formData.get('date'),
            image,
            featured: true
        };

        if (this.editingProjectId) {
            this.projects = this.projects.map(project =>
                project.id === this.editingProjectId ? { ...project, ...projectData } : project
            );
            showNotification('Project updated successfully.', 'success');
        } else {
            const newId = this.projects.length ? Math.max(...this.projects.map(project => project.id)) + 1 : 1;
            this.projects.unshift({ id: newId, ...projectData });
            showNotification('Project added successfully.', 'success');
        }

        this.saveProjects();
        this.applyProjectView();
        this.closeProjectModal();
    }

    readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result || '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    deleteProject(projectId) {
        const project = this.projects.find(item => item.id === projectId);
        if (!project) return;

        if (!confirm(`Delete "${project.title}"?`)) return;

        this.projects = this.projects.filter(item => item.id !== projectId);
        this.saveProjects();
        this.applyProjectView();
        showNotification('Project deleted.', 'info');
    }

    applyProjectView() {
        const projectsToRender = this.getFilteredProjects();
        this.renderProjects(projectsToRender);
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
        // Animate hero text
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

        // Animate hero subtitle
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

        // Animate skill bars
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
        const isProjectsPage = Boolean(document.getElementById('add-project-btn'));
        
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
                            <div class="flex items-center gap-2">
                                <button class="text-sage-600 hover:text-sage-800 font-medium text-sm">
                                    View Details →
                                </button>
                                ${this.isAdmin && isProjectsPage ? `
                                <button class="project-admin-action edit-project-btn text-xs px-2 py-1 rounded bg-sage-100 text-sage-700" data-project-id="${project.id}" type="button">Edit</button>
                                <button class="project-admin-action delete-project-btn text-xs px-2 py-1 rounded bg-red-100 text-red-700" data-project-id="${project.id}" type="button">Delete</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Animate project cards
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
        
        // Update active filter button
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
                    <div class="flex gap-4">
                        <button class="px-6 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors">
                            View Live Demo
                        </button>
                        <button class="px-6 py-2 border border-sage-600 text-sage-600 rounded-lg hover:bg-sage-50 transition-colors">
                            View Code
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Animate modal
        anime({
            targets: modal,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutExpo'
        });

        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutExpo',
            delay: 100
        });

        // Close modal functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            anime({
                targets: modal,
                opacity: [1, 0],
                duration: 200,
                easing: 'easeOutExpo',
                complete: () => {
                    modal.remove();
                }
            });
        }
    }

    setupScrollEffects() {
        // Intersection Observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
    }

    initializeParticles() {
        // Simple particle system for hero background
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

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(124, 132, 113, ${particle.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }

        animate();

        // Resize canvas on window resize
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    handleContactForm(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
        e.target.reset();
    }
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 
        type === 'error' ? 'bg-red-500 text-white' : 
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.portfolioManager = new PortfolioManager();
    
    // Handle contact form if present
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                showNotification('Message sent successfully! I\'ll get back to you within 24 hours.', 'success');
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
});
