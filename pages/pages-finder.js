
// ============================================
// PAGE RENDERERS - FINDER PAGES (Browse, Find, Donate)
// ============================================

import { state } from './state-manager.js';
import { dropsService } from './services/drops-service.js';
import { locationsService } from './services/locations-service.js';
import { uiModule } from './ui-module.js';
import { utils } from './utils.js';

export const finderPages = {
    /**
     * Render home/browse page
     */
    renderHome() {
        const content = document.getElementById('homeContent');
        if (!content) return;

        const { artDrops, filters } = state.getState();
        const userLocation = state.getState().userLocation;

        // Filter drops based on current filters
        let filteredDrops = artDrops || [];
        
        if (filters.searchQuery) {
            filteredDrops = filteredDrops.filter(drop =>
                drop.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                drop.story.toLowerCase().includes(filters.searchQuery.toLowerCase())
            );
        }

        if (filters.statusFilter !== 'all') {
            filteredDrops = filteredDrops.filter(drop => drop.status === filters.statusFilter);
        }

        // Sort drops
        if (filters.sortBy === 'recent') {
            filteredDrops.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
        } else if (filters.sortBy === 'nearest') {
            if (userLocation) {
                filteredDrops.forEach(drop => {
                    drop.distance = dropsService.calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        drop.latitude,
                        drop.longitude
                    );
                });
                filteredDrops.sort((a, b) => a.distance - b.distance);
            }
        } else if (filters.sortBy === 'popular') {
            filteredDrops.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        }

        if (filteredDrops.length === 0) {
            content.innerHTML = uiModule.renderEmptyState('No art drops found. Try different filters!');
            return;
        }

        content.innerHTML = `
            <div class="home-header">
                <h2>Discover Art Drops</h2>
                <div class="filter-bar">
                    <input type="text" id="searchInput" placeholder="Search art drops..." 
                        value="${filters.searchQuery}" class="form-input" style="flex: 1;">
                    <select id="sortSelect" class="form-select">
                        <option value="recent" ${filters.sortBy === 'recent' ? 'selected' : ''}>Recent</option>
                        <option value="nearest" ${filters.sortBy === 'nearest' ? 'selected' : ''}>Nearest</option>
                        <option value="popular" ${filters.sortBy === 'popular' ? 'selected' : ''}>Popular</option>
                    </select>
                    <select id="statusSelect" class="form-select">
                        <option value="all">All Status</option>
                        <option value="active" ${filters.statusFilter === 'active' ? 'selected' : ''}>Active</option>
                        <option value="found" ${filters.statusFilter === 'found' ? 'selected' : ''}>Found</option>
                    </select>
                </div>
            </div>

            <div class="drops-grid">
                ${filteredDrops.map(drop => `
                    <div class="drop-card" onclick="app.viewDrop('${drop.id}')">
                        <img src="${drop.photoUrl}" alt="${drop.title}" class="drop-image" loading="lazy">
                        <div class="drop-content">
                            <h3>${drop.title}</h3>
                            <p class="artist-name">By ${drop.artistName}</p>
                            ${drop.distance ? `<p class="distance">${utils.formatDistance(drop.distance)}</p>` : ''}
                            <p class="story">${utils.truncate(drop.story, 80)}</p>
                            <div class="drop-meta">
                                <span>❤️ ${drop.likeCount || 0}</span>
                                <span>${drop.status === 'found' ? '✅ Found' : '🔍 Active'}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.setupHomeListeners();
    },

    /**
     * Setup home page listeners
     */
    setupHomeListeners() {
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        const statusSelect = document.getElementById('statusSelect');

        if (searchInput) {
            const debouncedSearch = utils.debounce((value) => {
                state.setState({
                    filters: {
                        ...state.getState().filters,
                        searchQuery: value
                    }
                });
                this.renderHome();
            }, 300);

            searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                state.setState({
                    filters: {
                        ...state.getState().filters,
                        sortBy: e.target.value
                    }
                });
                this.renderHome();
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener('change', (e) => {
                state.setState({
                    filters: {
                        ...state.getState().filters,
                        statusFilter: e.target.value
                    }
                });
                this.renderHome();
            });
        }
    },

    /**
     * Render browse map page
     */
    async renderBrowseMap() {
        const content = document.getElementById('browseMapContent');
        if (!content) return;

        const { artDrops, userLocation } = state.getState();

        content.innerHTML = `
            <div class="map-container">
                <div id="mapElement" style="width: 100%; height: 500px; border-radius: 8px;"></div>
                <div class="map-info">
                    <h3>Art Drops Near You</h3>
                    <button class="btn-secondary" id="filterMapBtn">Filter Map</button>
                </div>
            </div>
        `;

        // Initialize map (would require Google Maps or similar)
        this.initBrowseMap(artDrops, userLocation);
    },

    /**
     * Initialize browse map
     */
    initBrowseMap(drops, userLocation) {
        // Placeholder for map initialization
        // In real implementation, use Google Maps API
        console.log('📍 Initializing browse map with', drops?.length || 0, 'drops');
    },

    /**
     * Render art story/detail page
     */
    renderArtStory(data) {
        const { dropId } = data;
        const { artDrops } = state.getState();
        const drop = artDrops?.find(d => d.id === dropId);

        if (!drop) {
            const content = document.getElementById('artStoryContent');
            if (content) {
                content.innerHTML = uiModule.renderErrorState('Art drop not found');
            }
            return;
        }

        const content = document.getElementById('artStoryContent');
        if (!content) return;

        const currentUser = state.getState().currentUser;
        const isFound = drop.status === 'found';

        content.innerHTML = `
            <div class="story-container">
                <button class="btn-back" onclick="app.showPage('home')">← Back</button>
                
                <div class="story-image-section">
                    <img src="${drop.photoUrl}" alt="${drop.title}" class="story-image">
                    ${isFound ? '<div class="found-badge">✅ Already Found</div>' : ''}
                </div>

                <div class="story-content">
                    <h1>${drop.title}</h1>
                    <p class="artist-credit">By <strong>${drop.artistName}</strong></p>
                    
                    ${drop.venueName ? `<p class="venue">📍 ${drop.venueName}, ${drop.city}, ${drop.state}</p>` : ''}
                    
                    <p class="created-date">${utils.formatDate(drop.dateCreated)}</p>
                    
                    <div class="story-text">
                        <h2>The Story</h2>
                        <p>${drop.story}</p>
                    </div>

                    <div class="story-actions">
                        <button class="btn-primary" id="findDropBtn" onclick="app.handleFindDrop('${drop.id}')">
                            ${isFound ? '✅ Already Found' : '🎉 I Found It!'}
                        </button>
                        <button class="btn-secondary" id="shareBtn" onclick="app.shareDrop('${drop.id}')">
                            📤 Share
                        </button>
                        <button class="btn-secondary" id="likeBtn" onclick="app.toggleLikeDrop('${drop.id}')">
                            ❤️ Like
                        </button>
                    </div>

                    ${!isFound ? `
                        <div class="donation-section">
                            <h3>💝 Support This Artist</h3>
                            <p>Help support ${drop.artistName} by making a donation</p>
                            <button class="btn-outline" onclick="app.showPage('donationFlow', {dropId: '${drop.id}', artistId: '${drop.artistId}'})">
                                Make a Donation
                            </button>
                        </div>
                    ` : ''}

                    <div class="story-metadata">
                        <div class="meta-item">
                            <span class="label">Likes:</span>
                            <span class="value">${drop.likeCount || 0}</span>
                        </div>
                        <div class="meta-item">
                            <span class="label">Found:</span>
                            <span class="value">${isFound ? '✅ Yes' : '🔍 No'}</span>
                        </div>
                        ${drop.foundByName ? `
                            <div class="meta-item">
                                <span class="label">Found by:</span>
                                <span class="value">${drop.foundByName}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        if (!isFound) {
            const findBtn = document.getElementById('findDropBtn');
            if (findBtn) findBtn.disabled = false;
        } else {
            const findBtn = document.getElementById('findDropBtn');
            if (findBtn) findBtn.disabled = true;
        }
    },

    /**
     * Render donation flow page
     */
    renderDonationFlow(data) {
        const { dropId, artistId } = data;
        const content = document.getElementById('donationFlowContent');
        if (!content) return;

        content.innerHTML = `
            <div class="donation-container">
                <button class="btn-back" onclick="app.showPage('artStory', {dropId: '${dropId}'})">← Back</button>
                
                <h2>💝 Support This Artist</h2>
                <p class="subtitle">Your donation helps artists continue creating amazing work</p>

                <div class="donation-form">
                    <div class="form-group">
                        <label>Select Amount</label>
                        <div class="amount-buttons">
                            ${[1, 3, 5, 10, 20].map(amount => `
                                <button class="amount-btn" onclick="app.selectDonationAmount(${amount})">
                                    $${amount}
                                </button>
                            `).join('')}
                        </div>
                        <div class="custom-amount">
                            <input type="number" id="customAmount" placeholder="Or enter custom amount" min="1" max="1000" class="form-input">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Message (Optional)</label>
                        <textarea id="donationMessage" placeholder="Share why you love this art..." class="form-textarea" rows="4"></textarea>
                    </div>

                    <div class="donation-summary" id="donationSummary">
                        <p>Amount: <strong id="selectedAmount">Select amount</strong></p>
                    </div>

                    <button class="btn-primary btn-block" onclick="app.processDonation('${dropId}', '${artistId}')">
                        Donate Now
                    </button>

                    <p class="payment-note">
                        💳 Secure payment processing with Stripe
                    </p>
                </div>
            </div>
        `;
    },

    /**
     * Render thank you page after finding/donating
     */
    renderThankYou(data) {
        const { dropId, donated } = data;
        const content = document.getElementById('thankYouContent');
        if (!content) return;

        content.innerHTML = `
            <div class="thank-you-container">
                <div class="thank-you-icon">
                    ${donated ? '💝' : '🎉'}
                </div>
                <h1>
                    ${donated ? 'Thank You for Your Support!' : 'Congratulations!'}
                </h1>
                <p class="thank-you-message">
                    ${donated 
                        ? 'Your donation will help this artist create more amazing work.' 
                        : 'You found an art drop! You\'re part of the ArtDrops community.'}
                </p>

                <div class="thank-you-actions">
                    <button class="btn-primary" onclick="app.showPage('home')">
                        Find More Art
                    </button>
                    <button class="btn-secondary" onclick="app.showPage('myCollection')">
                        View My Collection
                    </button>
                    <button class="btn-outline" onclick="app.shareDrop('${dropId}')">
                        📤 Share With Friends
                    </button>
                </div>

                <div class="share-section">
                    <p>Spread the word about ArtDrops!</p>
                    <div id="shareButtons"></div>
                </div>
            </div>
        `;
    },

    /**
     * Render my collection page (art found)
     */
    renderMyCollection() {
        const { currentUser, artDrops } = state.getState();
        const content = document.getElementById('myCollectionContent');
        if (!content) return;

        // Get drops the user has found
        const foundDrops = artDrops?.filter(drop => drop.foundBy === currentUser?.id) || [];

        if (foundDrops.length === 0) {
            content.innerHTML = `
                <div class="collection-empty">
                    <h2>Your Collection</h2>
                    <p>You haven't found any art drops yet!</p>
                    <button class="btn-primary" onclick="app.showPage('home')">
                        Start Hunting
                    </button>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="collection-container">
                <h2>Your Collection</h2>
                <p class="collection-count">You've found <strong>${foundDrops.length}</strong> art drops</p>

                <div class="collection-grid">
                    ${foundDrops.map(drop => `
                        <div class="collection-card" onclick="app.showPage('artStory', {dropId: '${drop.id}'})">
                            <img src="${drop.photoUrl}" alt="${drop.title}">
                            <div class="collection-card-content">
                                <h3>${drop.title}</h3>
                                <p class="artist">${drop.artistName}</p>
                                <p class="found-date">Found ${utils.formatDate(drop.dateFound)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};
