// ============================================
// UI MODULE - PAGE RENDERING & NAVIGATION
// ============================================


import { state } from './state-manager.js';
import { utils } from './utils.js';

export const uiModule = {
    /**
     * Show a specific page
     */
    showPage(pageName, data = {}) {
        console.log(`📄 Showing page: ${pageName}`);
        
        state.setState({ currentPage: pageName });
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show requested page
        const pageElement = document.getElementById(pageName);
        if (pageElement) {
            pageElement.style.display = 'block';
            
            // Call page-specific render function
            const renderFunction = this[`render${this.capitalize(pageName)}`];
            if (renderFunction) {
                renderFunction.call(this, data);
            }
        }
        
        // Update navigation
        this.updateNav();
        
        // Scroll to top
        window.scrollTo(0, 0);
    },

    /**
     * Update navigation visibility based on auth state
     */
    updateNav() {
        const { isAuthenticated, currentPage } = state.getState();
        const mainNav = document.getElementById('mainNav');
        const artistNav = document.getElementById('artistNav');
        
        if (currentPage === 'landing' || currentPage === 'artistLogin' || currentPage === 'artistSignup') {
            if (mainNav) mainNav.style.display = 'none';
            if (artistNav) artistNav.style.display = 'none';
        } else if (isAuthenticated) {
            const currentUser = state.getState().currentUser;
            if (currentUser?.isArtist) {
                if (mainNav) mainNav.style.display = 'none';
                if (artistNav) artistNav.style.display = 'flex';
            } else {
                if (mainNav) mainNav.style.display = 'flex';
                if (artistNav) artistNav.style.display = 'none';
            }
        }
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeItem = document.querySelector(`[data-page="${state.getState().currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    },

    /**
     * Show toast notification
     */
    showToast(message, duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show loading overlay
     */
    showLoadingOverlay(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.innerHTML = `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            const messageEl = overlay.querySelector('.loading-message');
            if (messageEl) messageEl.textContent = message;
            overlay.style.display = 'flex';
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    /**
     * Show confirmation dialog
     */
    async showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'modal-overlay';
            dialog.innerHTML = `
                <div class="modal">
                    <h2>${title}</h2>
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove(); window.dialogResolve(false)">Cancel</button>
                        <button class="btn-primary" onclick="this.closest('.modal-overlay').remove(); window.dialogResolve(true)">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(dialog);
            
            // Store resolve function globally (simple approach)
            window.dialogResolve = resolve;
        });
    },

    /**
     * Create dropdown/select element
     */
    createSelect(options, selectedValue, onChange) {
        const select = document.createElement('select');
        select.className = 'form-select';
        
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        if (onChange) {
            select.addEventListener('change', (e) => onChange(e.target.value));
        }
        
        return select;
    },

    /**
     * Render empty state
     */
    renderEmptyState(message, iconEmoji = '🔍') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${iconEmoji}</div>
                <p>${message}</p>
            </div>
        `;
    },

    /**
     * Render error state
     */
    renderErrorState(message) {
        return `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    },

    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Create card component
     */
    createCard(config) {
        const {
            imageUrl,
            title,
            subtitle,
            description,
            metadata = [],
            actions = [],
            onClick
        } = config;

        const metaHtml = metadata.length > 0 
            ? `<div class="card-meta">${metadata.map(m => `<span>${m}</span>`).join(' • ')}</div>`
            : '';

        const actionsHtml = actions.length > 0
            ? `<div class="card-actions">${actions.map(a => 
                `<button class="btn-${a.style || 'secondary'}" onclick="${a.onClick}">${a.label}</button>`
              ).join('')}</div>`
            : '';

        return `
            <div class="card" ${onClick ? `onclick="${onClick}"` : ''}>
                ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="card-image" loading="lazy">` : ''}
                <div class="card-content">
                    <h3 class="card-title">${title}</h3>
                    ${subtitle ? `<p class="card-subtitle">${subtitle}</p>` : ''}
                    ${description ? `<p class="card-description">${description}</p>` : ''}
                    ${metaHtml}
                </div>
                ${actionsHtml}
            </div>
        `;
    },

    /**
     * Create grid layout
     */
    createGrid(items, renderItem) {
        if (!items || items.length === 0) {
            return this.renderEmptyState('No items to display');
        }

        return `
            <div class="grid">
                ${items.map(item => renderItem(item)).join('')}
            </div>
        `;
    },

    /**
     * Initialize event listeners for common UI elements
     */
    initCommonListeners() {
        // Close modal on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });

        // Handle ESC key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) modal.remove();
            }
        });
    }
};
