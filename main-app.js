// ============================================
// MAIN APP - EXPANDED WITH ALL HANDLERS
// ============================================

import { auth, db, storage } from './services/firebase-config.js';
import { authService } from './services/auth-service.js';
import { dropsService } from './services/drops-service.js';
import { locationsService } from './services/locations-service.js';
import { storageService } from './services/storage-service.js';
import { donationsService } from './services/donations-service.js';
import { state } from './modules/state-manager.js';
import { uiModule } from './modules/ui-module.js';
import { utils } from './modules/utils.js';    

// Import all page modules
import { authPages } from './pages/pages-auth.js';
import { finderPages } from './pages/pages-finder.js';
import { artistPages } from './pages/pages-artist.js';
import { infoPages } from './pages/pages-info.js';


// ============================================
// MAIN APP OBJECT
// ============================================

const app = {
    // Merge all page renderers into app
    ...authPages,
    ...finderPages,
    ...artistPages,
    ...infoPages,

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing ArtDrops app...');
        
        uiModule.initCommonListeners();
        authService.initAuthListener(this.onAuthChange.bind(this));
        this.requestLocationPermission();
        await this.loadInitialData();
        this.setupNavigationListeners();
        this.setupPageRouting();
        
        console.log('✅ App initialized');
    },

    /**
     * Handle authentication state changes
     */
    onAuthChange(user) {
        if (user) {
            console.log('User logged in:', user.email);
            if (user.isArtist) {
                this.showPage('artistDashboard');
            } else {
                this.showPage('home');
            }
        } else {
            console.log('User logged out');
            this.showPage('landing');
        }
    },

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            console.log('🔄 Loading Firebase data...');
            uiModule.showLoadingOverlay('Loading...');
            
            const [artDrops, locations] = await Promise.all([
                dropsService.getDrops({ status: 'active' }),
                locationsService.getLocations()
            ]);
            
            console.log(`✅ Loaded ${artDrops.length} drops, ${locations.length} locations`);
            uiModule.hideLoadingOverlay();
        } catch (error) {
            console.error('❌ Error loading data:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Error loading data');
        }
    },

    /**
     * Setup navigation listeners
     */
    setupNavigationListeners() {
        document.querySelectorAll('[data-page]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = button.dataset.page;
                this.showPage(page);
            });
        });

        document.querySelectorAll('[data-action="signout"]').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleSignOut();
            });
        });
    },

    /**
     * Setup page routing
     */
    setupPageRouting() {
        // Handle URL parameters
        const params = utils.getUrlParams();
        if (params.page) {
            this.showPage(params.page, params);
        }
    },

    /**
     * Show page - override from uiModule
     */
    showPage(pageName, data = {}) {
        console.log(`📄 Showing page: ${pageName}`);
        
        state.setState({ currentPage: pageName });
        
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        const pageElement = document.getElementById(pageName + 'Page') || 
                          document.getElementById(pageName + 'Content')?.parentElement;
        
        if (pageElement) {
            pageElement.style.display = 'block';
        }
        
        // Call appropriate render function
        const renderFunc = this[`render${this.capitalize(pageName)}`];
        if (renderFunc) {
            renderFunc.call(this, data);
        }
        
        uiModule.updateNav();
        window.scrollTo(0, 0);
    },

    /**
     * Request location permission
     */
    async requestLocationPermission() {
        try {
            const position = await utils.getCurrentPosition();
            state.setState({ 
                userLocation: {
                    latitude: position.latitude,
                    longitude: position.longitude
                }
            });
            console.log('✅ Location permission granted');
        } catch (error) {
            console.log('⚠️ Location unavailable');
        }
    },

    /**
     * Get current location for drop
     */
    async useCurrentLocation() {
        try {
            uiModule.showLoadingOverlay('Getting location...');
            
            const position = await utils.getCurrentPosition();
            const geocoded = await utils.reverseGeocode(
                position.latitude,
                position.longitude
            );
            
            document.getElementById('dropCity').value = geocoded?.city || '';
            document.getElementById('dropState').value = geocoded?.state || '';
            document.getElementById('dropZip').value = geocoded?.zipCode || '';
            
            uiModule.hideLoadingOverlay();
            uiModule.showToast('✅ Location set');
        } catch (error) {
            console.error('Error getting location:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Could not get location');
        }
    },

    /**
     * Handle finder signup
     */
    async handleFinderSignup() {
        try {
            const email = document.getElementById('finderEmail')?.value;
            const password = document.getElementById('finderPassword')?.value;
            const displayName = document.getElementById('finderName')?.value;

            if (!email || !password || !displayName) {
                uiModule.showToast('Please fill in all fields');
                return;
            }

            if (!utils.isValidEmail(email)) {
                uiModule.showToast('Please enter a valid email');
                return;
            }

            uiModule.showLoadingOverlay('Creating account...');
            
            const result = await authService.createAccountWithEmail(
                email, password, displayName
            );
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Account created!');
                this.showPage('home');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error in signup:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle finder login
     */
    async handleFinderLogin() {
        try {
            const email = document.getElementById('loginEmail')?.value;
            const password = document.getElementById('loginPassword')?.value;

            if (!email || !password) {
                uiModule.showToast('Please enter email and password');
                return;
            }

            uiModule.showLoadingOverlay('Signing in...');
            
            const result = await authService.signInWithEmail(email, password);
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Signed in!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error in login:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle artist signup
     */
    async handleArtistSignup() {
        try {
            const email = document.getElementById('artistEmail')?.value;
            const password = document.getElementById('artistPassword')?.value;
            const displayName = document.getElementById('artistName')?.value;
            const bio = document.getElementById('artistBio')?.value || '';

            if (!email || !password || !displayName) {
                uiModule.showToast('Please fill in required fields');
                return;
            }

            uiModule.showLoadingOverlay('Creating artist account...');
            
            const result = await authService.createAccountWithEmail(email, password, displayName);
            
            if (result.success) {
                // Mark as artist
                await authService.updateUserProfile(result.user.uid, {
                    isArtist: true,
                    bio: bio
                });
                
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Welcome, artist!');
                this.showPage('artistDashboard');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error in artist signup:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle artist login
     */
    async handleArtistLogin() {
        try {
            const email = document.getElementById('artistLoginEmail')?.value;
            const password = document.getElementById('artistLoginPassword')?.value;

            if (!email || !password) {
                uiModule.showToast('Please enter email and password');
                return;
            }

            uiModule.showLoadingOverlay('Signing in...');
            
            const result = await authService.signInWithEmail(email, password);
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Welcome back, artist!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error in artist login:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle Google sign in
     */
    async signInWithGoogle() {
        try {
            uiModule.showLoadingOverlay('Signing in with Google...');
            
            const result = await authService.signInWithGoogle();
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Signed in!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle Apple sign in
     */
    async signInWithApple() {
        try {
            uiModule.showLoadingOverlay('Signing in with Apple...');
            
            const result = await authService.signInWithApple();
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Signed in!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle sign out
     */
    async handleSignOut() {
        const confirmed = await uiModule.showConfirmDialog(
            'Sign Out',
            'Are you sure?'
        );
        
        if (confirmed) {
            const result = await authService.signOut();
            if (result.success) {
                state.reset();
                this.showPage('landing');
                uiModule.showToast('✅ Signed out');
            }
        }
    },

    /**
     * Handle creating art drop
     */
    async handleDropNewArt(event) {
        event.preventDefault();
        
        try {
            const photo = document.getElementById('dropPhoto')?.files[0];
            const title = document.getElementById('dropTitle')?.value;
            const story = document.getElementById('dropStory')?.value;
            const venueName = document.getElementById('venueName')?.value || '';
            const city = document.getElementById('dropCity')?.value || '';
            const dropState = document.getElementById('dropState')?.value || '';
            const zipCode = document.getElementById('dropZip')?.value || '';

            if (!photo || !title || !story) {
                uiModule.showToast('Please fill in all required fields');
                return;
            }

            uiModule.showLoadingOverlay('Creating art drop...');
            
            const photoResult = await storageService.uploadArtDropPhoto(photo);
            if (!photoResult.success) throw new Error('Photo upload failed');
            
            const currentUser = state.getState().currentUser;
            const userLocation = state.getState().userLocation;
            
            const dropData = {
                artistId: currentUser.id,
                artistName: currentUser.displayName,
                title,
                story,
                photoUrl: photoResult.url,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                city,
                state: dropState,
                zipCode,
                venueName
            };
            
            const result = await dropsService.createDrop(dropData);
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Art drop created!');
                await this.loadInitialData();
                this.showPage('artistDashboard');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error creating drop:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle finding a drop
     */
    async handleFindDrop(dropId) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in');
                return;
            }
            
            uiModule.showLoadingOverlay('Recording find...');
            
            const result = await dropsService.updateDropStatus(dropId, 'found', {
                userId: currentUser.id,
                userName: currentUser.displayName
            });
            
            if (result.success) {
                await this.loadInitialData();
                uiModule.hideLoadingOverlay();
                this.showPage('thankYou', { dropId });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast(`❌ ${error.message}`);
        }
    },

    /**
     * Handle toggling like on drop
     */
    async toggleLikeDrop(dropId) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in to like drops');
                return;
            }
            
            const result = await dropsService.toggleLike(dropId, currentUser.id);
            
            if (result.success) {
                await this.loadInitialData();
                const action = result.liked ? '❤️ Liked' : '💔 Unliked';
                uiModule.showToast(`✅ ${action}`);
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.showToast('❌ Failed to like drop');
        }
    },

    /**
     * Handle viewing a drop
     */
    viewDrop(dropId) {
        this.showPage('artStory', { dropId });
    },

    /**
     * Handle donation amount selection
     */
    selectDonationAmount(amount) {
        document.getElementById('customAmount').value = '';
        document.getElementById('selectedAmount').textContent = `$${amount}`;
        state.setState({ selectedDonationAmount: amount });
    },

    /**
     * Handle processing donation
     */
    async processDonation(dropId, artistId) {
        try {
            const selectedAmount = state.getState().selectedDonationAmount;
            const customAmount = document.getElementById('customAmount')?.value;
            const message = document.getElementById('donationMessage')?.value || '';

            const amount = customAmount ? parseFloat(customAmount) : selectedAmount;
            
            if (!amount) {
                uiModule.showToast('Please select or enter an amount');
                return;
            }

            const validation = donationsService.validateAmount(amount);
            if (!validation.valid) {
                uiModule.showToast(validation.error);
                return;
            }

            uiModule.showLoadingOverlay('Processing donation...');
            
            const currentUser = state.getState().currentUser;
            const donation = {
                dropId,
                artistId,
                donorId: currentUser.id,
                donorName: currentUser.displayName,
                amount: validation.amount,
                message
            };
            
            const result = await donationsService.recordDonation(donation);
            
            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('❤️ Thank you for your support!');
                this.showPage('thankYou', { dropId, donated: true });
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Donation failed');
        }
    },

    /**
     * Handle sharing
     */
    async shareDrop(dropId) {
        try {
            const { artDrops } = state.getState();
            const drop = artDrops?.find(d => d.id === dropId);
            
            if (!drop) return;

            const shareData = {
                title: drop.title,
                text: `Check out "${drop.title}" by ${drop.artistName} on ArtDrops!`,
                url: `${window.location.origin}?page=artStory&dropId=${dropId}`
            };

            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback
                await utils.copyToClipboard(shareData.url);
                uiModule.showToast('📋 Link copied to clipboard');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
    },

    /**
     * Generate QR code
     */
    async generateQRCode() {
        try {
            const dropId = document.getElementById('qrDropSelect')?.value;
            if (!dropId) {
                uiModule.showToast('Please select a drop');
                return;
            }

            const dropUrl = `${window.location.origin}?page=artStory&dropId=${dropId}`;
            
            // Simple QR code generation using API
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dropUrl)}`;
            
            const result = document.getElementById('qrResult');
            result.innerHTML = `
                <div class="qr-result-content">
                    <img src="${qrCodeUrl}" alt="QR Code">
                    <button class="btn-secondary" onclick="app.downloadQRCode('${qrCodeUrl}')">
                        📥 Download QR Code
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Error:', error);
            uiModule.showToast('❌ Failed to generate QR code');
        }
    },

    /**
     * Handle profile update
     */
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        try {
            const currentUser = state.getState().currentUser;
            const displayName = document.getElementById('profileName')?.value;
            const bio = document.getElementById('profileBio')?.value;
            const website = document.getElementById('profileWebsite')?.value;
            const instagram = document.getElementById('profileInstagram')?.value;
            const location = document.getElementById('profileLocation')?.value;
            const profilePhoto = document.getElementById('profilePhoto')?.files[0];

            uiModule.showLoadingOverlay('Updating profile...');
            
            let profilePhotoUrl = currentUser.photoURL;
            if (profilePhoto) {
                const uploadResult = await storageService.uploadProfilePhoto(profilePhoto, currentUser.id);
                if (uploadResult.success) {
                    profilePhotoUrl = uploadResult.url;
                }
            }

            const result = await authService.updateUserProfile(currentUser.id, {
                displayName,
                bio,
                website,
                instagram,
                location,
                photoURL: profilePhotoUrl
            });

            if (result.success) {
                uiModule.hideLoadingOverlay();
                uiModule.showToast('✅ Profile updated!');
                this.showPage('artistProfile');
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Update failed');
        }
    },

    /**
     * Handle contact form submission
     */
    async handleContactSubmit(event) {
        event.preventDefault();
        
        try {
            const name = document.getElementById('contactName')?.value;
            const email = document.getElementById('contactEmail')?.value;
            const subject = document.getElementById('contactSubject')?.value;
            const message = document.getElementById('contactMessage')?.value;

            if (!name || !email || !subject || !message) {
                uiModule.showToast('Please fill in all fields');
                return;
            }

            uiModule.showLoadingOverlay('Sending message...');
            
            // In production, this would send to your backend
            console.log('Contact form:', { name, email, subject, message });
            
            uiModule.hideLoadingOverlay();
            uiModule.showToast('✅ Message sent!');
            document.getElementById('contactForm').reset();
            this.showPage('landing');
        } catch (error) {
            console.error('Error:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Failed to send message');
        }
    },

    /**
     * Helper: capitalize string
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * Toggle follow location
     */
    async toggleFollowLocation(locationId) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in');
                return;
            }

            const result = await locationsService.toggleFollow(locationId, currentUser.id);
            if (result.success) {
                await this.loadInitialData();
                const action = result.following ? 'Following' : 'Unfollowed';
                uiModule.showToast(`✅ ${action} location`);
            }
        } catch (error) {
            console.error('Error:', error);
            uiModule.showToast('❌ Failed to update follow status');
        }
    },

    /**
     * Delete drop (artist only)
     */
    async deleteDrop(dropId) {
        const confirmed = await uiModule.showConfirmDialog(
            'Delete Drop',
            'Are you sure you want to delete this art drop?'
        );

        if (confirmed) {
            try {
                uiModule.showLoadingOverlay('Deleting...');
                const result = await dropsService.deleteDrop(dropId);
                
                if (result.success) {
                    await this.loadInitialData();
                    uiModule.hideLoadingOverlay();
                    uiModule.showToast('✅ Drop deleted');
                    this.showPage('myDrops');
                }
            } catch (error) {
                console.error('Error:', error);
                uiModule.hideLoadingOverlay();
                uiModule.showToast('❌ Failed to delete drop');
            }
        }
    }
};

// ============================================
// INITIALIZE APP WHEN DOM IS READY
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

window.app = app;

export default app;
