// ============================================
// PAGE RENDERERS - ARTIST PAGES
// ============================================

import { state } from './state-manager.js';
import { dropsService } from './services/drops-service.js';
import { storageService } from './services/storage-service.js';
import { uiModule } from './ui-module.js';
import { utils } from './utils.js';

export const artistPages = {
    /**
     * Render artist dashboard
     */
    renderArtistDashboard() {
        const { currentUser, artDrops } = state.getState();
        const content = document.getElementById('artistDashboardContent');
        if (!content) return;

        // Get this artist's drops
        const myDrops = artDrops?.filter(drop => drop.artistId === currentUser?.id) || [];
        const foundDrops = myDrops.filter(drop => drop.status === 'found');
        const totalLikes = myDrops.reduce((sum, drop) => sum + (drop.likeCount || 0), 0);

        content.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h2>Welcome, ${currentUser?.displayName || 'Artist'}</h2>
                    <button class="btn-primary" onclick="app.showPage('dropNewArt')">
                        ✨ Create New Drop
                    </button>
                </div>

                <div class="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-number">${myDrops.length}</div>
                        <div class="stat-label">Art Drops Created</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${foundDrops.length}</div>
                        <div class="stat-label">Drops Found</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${totalLikes}</div>
                        <div class="stat-label">Total Likes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${currentUser?.followerCount || 0}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                </div>

                <div class="dashboard-sections">
                    <div class="section">
                        <h3>Your Recent Drops</h3>
                        ${myDrops.length === 0 
                            ? '<p>No drops yet. Create your first one!</p>'
                            : `
                                <div class="drops-list">
                                    ${myDrops.slice(0, 5).map(drop => `
                                        <div class="drop-item">
                                            <img src="${drop.photoUrl}" alt="${drop.title}" class="drop-thumbnail">
                                            <div class="drop-info">
                                                <h4>${drop.title}</h4>
                                                <p>${drop.status === 'found' ? '✅ Found' : '🔍 Active'}</p>
                                                <p class="meta">${drop.likeCount || 0} likes</p>
                                            </div>
                                            <div class="drop-actions">
                                                <button class="btn-sm btn-secondary" onclick="app.editDrop('${drop.id}')">Edit</button>
                                                <button class="btn-sm btn-danger" onclick="app.deleteDrop('${drop.id}')">Delete</button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `
                        }
                    </div>

                    <div class="section">
                        <h3>Quick Actions</h3>
                        <div class="quick-actions">
                            <button class="action-btn" onclick="app.showPage('myDrops')">
                                📊 All My Drops
                            </button>
                            <button class="action-btn" onclick="app.showPage('qRTagGenerator')">
                                📲 QR Code Generator
                            </button>
                            <button class="action-btn" onclick="app.showPage('artistProfile')">
                                👤 View Profile
                            </button>
                            <button class="action-btn" onclick="app.showPage('editProfile')">
                                ✏️ Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render create new art drop page
     */
    renderDropNewArt() {
        const content = document.getElementById('dropNewArtContent');
        if (!content) return;

        content.innerHTML = `
            <div class="form-container">
                <button class="btn-back" onclick="app.showPage('artistDashboard')">← Back</button>
                
                <h2>Create New Art Drop</h2>
                <p class="subtitle">Share your art with the ArtDrops community</p>

                <form id="dropForm" class="drop-form">
                    <div class="form-group">
                        <label>Art Title</label>
                        <input type="text" id="dropTitle" placeholder="Give your art a title" class="form-input" required>
                    </div>

                    <div class="form-group">
                        <label>Art Story</label>
                        <textarea id="dropStory" placeholder="Tell the story behind your art..." class="form-textarea" rows="6" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Photo</label>
                        <div class="photo-upload">
                            <input type="file" id="dropPhoto" accept="image/*" class="photo-input" required>
                            <div id="photoPreview" class="photo-preview"></div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Venue Name</label>
                            <input type="text" id="venueName" placeholder="Where is the drop?" class="form-input">
                        </div>
                        <div class="form-group">
                            <label>City</label>
                            <input type="text" id="dropCity" placeholder="City" class="form-input">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>State</label>
                            <input type="text" id="dropState" placeholder="TX" class="form-input" maxlength="2">
                        </div>
                        <div class="form-group">
                            <label>Zip Code</label>
                            <input type="text" id="dropZip" placeholder="78520" class="form-input">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Use Current Location</label>
                        <button type="button" class="btn-secondary" id="useLocationBtn" onclick="app.useCurrentLocation()">
                            📍 Use My Current Location
                        </button>
                    </div>

                    <button type="submit" class="btn-primary btn-block" onclick="app.handleDropNewArt(event)">
                        Create Art Drop
                    </button>
                </form>
            </div>
        `;

        this.setupPhotoUploadPreview();
    },

    /**
     * Setup photo upload preview
     */
    setupPhotoUploadPreview() {
        const photoInput = document.getElementById('dropPhoto');
        const photoPreview = document.getElementById('photoPreview');

        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate image
                const validation = storageService.validateImage(file);
                if (!validation.valid) {
                    uiModule.showToast(validation.error);
                    photoInput.value = '';
                    return;
                }

                // Show preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    photoPreview.innerHTML = `
                        <img src="${event.target.result}" alt="Preview" class="preview-img">
                        <p class="preview-info">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    `;
                };
                reader.readAsDataURL(file);
            });
        }
    },

    /**
     * Render my drops page (artist)
     */
    renderMyDrops() {
        const { currentUser, artDrops } = state.getState();
        const content = document.getElementById('myDropsContent');
        if (!content) return;

        const myDrops = artDrops?.filter(drop => drop.artistId === currentUser?.id) || [];

        if (myDrops.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h2>No Art Drops Yet</h2>
                    <p>Create your first art drop to get started</p>
                    <button class="btn-primary" onclick="app.showPage('dropNewArt')">
                        ✨ Create Art Drop
                    </button>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="my-drops-container">
                <h2>My Art Drops</h2>
                <button class="btn-primary" onclick="app.showPage('dropNewArt')">
                    ✨ Create New Drop
                </button>

                <div class="drops-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Likes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${myDrops.map(drop => `
                                <tr>
                                    <td>
                                        <strong>${drop.title}</strong>
                                    </td>
                                    <td>
                                        <span class="status-badge status-${drop.status}">
                                            ${drop.status === 'found' ? '✅ Found' : '🔍 Active'}
                                        </span>
                                    </td>
                                    <td>${utils.formatDate(drop.dateCreated)}</td>
                                    <td>${drop.likeCount || 0}</td>
                                    <td>
                                        <button class="btn-sm btn-secondary" onclick="app.showPage('artStory', {dropId: '${drop.id}'})">View</button>
                                        <button class="btn-sm btn-secondary" onclick="app.editDrop('${drop.id}')">Edit</button>
                                        <button class="btn-sm btn-danger" onclick="app.deleteDrop('${drop.id}')">Delete</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    /**
     * Render QR code tag generator
     */
    renderQRTagGenerator() {
        const content = document.getElementById('qRTagGeneratorContent');
        if (!content) return;

        content.innerHTML = `
            <div class="qr-container">
                <h2>📲 QR Code Generator</h2>
                <p class="subtitle">Create QR codes to link to your art drops</p>

                <div class="qr-form">
                    <div class="form-group">
                        <label>Select Art Drop</label>
                        <select id="qrDropSelect" class="form-select">
                            <option value="">Choose a drop...</option>
                            ${state.getState().artDrops?.map(drop => `
                                <option value="${drop.id}">${drop.title}</option>
                            `).join('') || ''}
                        </select>
                    </div>

                    <button class="btn-primary" onclick="app.generateQRCode()">
                        Generate QR Code
                    </button>
                </div>

                <div id="qrResult" class="qr-result"></div>
            </div>
        `;
    },

    /**
     * Render artist profile page
     */
    renderArtistProfile() {
        const { currentUser } = state.getState();
        const content = document.getElementById('artistProfileContent');
        if (!content) return;

        content.innerHTML = `
            <div class="profile-container">
                <button class="btn-back" onclick="app.showPage('artistDashboard')">← Back</button>
                
                <div class="profile-header">
                    <img src="${currentUser?.photoURL || '👤'}" alt="${currentUser?.displayName}" class="profile-photo">
                    <div class="profile-info">
                        <h1>${currentUser?.displayName}</h1>
                        <p class="bio">${currentUser?.bio || 'No bio yet'}</p>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="stat">
                        <div class="stat-value">${currentUser?.dropCount || 0}</div>
                        <div class="stat-label">Drops Created</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${currentUser?.followerCount || 0}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">$${currentUser?.totalDonations || 0}</div>
                        <div class="stat-label">Donations Received</div>
                    </div>
                </div>

                <div class="profile-actions">
                    <button class="btn-secondary" onclick="app.showPage('editProfile')">
                        ✏️ Edit Profile
                    </button>
                    <button class="btn-outline" onclick="app.shareArtist()">
                        📤 Share Profile
                    </button>
                </div>

                <div class="profile-section">
                    <h3>Contact Information</h3>
                    <p>Email: ${currentUser?.email}</p>
                    ${currentUser?.instagram ? `<p>Instagram: <a href="https://instagram.com/${currentUser.instagram}" target="_blank">@${currentUser.instagram}</a></p>` : ''}
                    ${currentUser?.website ? `<p>Website: <a href="${currentUser.website}" target="_blank">${currentUser.website}</a></p>` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Render edit profile page
     */
    renderEditProfile() {
        const { currentUser } = state.getState();
        const content = document.getElementById('editProfileContent');
        if (!content) return;

        content.innerHTML = `
            <div class="form-container">
                <button class="btn-back" onclick="app.showPage('artistProfile')">← Back</button>
                
                <h2>Edit Profile</h2>

                <form id="profileForm" class="profile-form">
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" id="profileName" value="${currentUser?.displayName || ''}" class="form-input" required>
                    </div>

                    <div class="form-group">
                        <label>Bio</label>
                        <textarea id="profileBio" class="form-textarea" rows="4">${currentUser?.bio || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Profile Photo</label>
                        <input type="file" id="profilePhoto" accept="image/*" class="form-input">
                        ${currentUser?.photoURL ? `<img src="${currentUser.photoURL}" alt="Current photo" class="profile-preview">` : ''}
                    </div>

                    <div class="form-group">
                        <label>Website</label>
                        <input type="url" id="profileWebsite" value="${currentUser?.website || ''}" placeholder="https://yourwebsite.com" class="form-input">
                    </div>

                    <div class="form-group">
                        <label>Instagram</label>
                        <input type="text" id="profileInstagram" value="${currentUser?.instagram || ''}" placeholder="your_username" class="form-input">
                    </div>

                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" id="profileLocation" value="${currentUser?.location || ''}" placeholder="City, State" class="form-input">
                    </div>

                    <button type="submit" class="btn-primary btn-block" onclick="app.handleProfileUpdate(event)">
                        Save Changes
                    </button>
                </form>
            </div>
        `;
    }
};
