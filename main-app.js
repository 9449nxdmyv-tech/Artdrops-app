// ============================================
// MAIN APP - Entry Point
// ============================================

// Import all services and modules
import { auth, db, storage } from './firebase-config.js';
import { authService } from './auth-service.js';
import { dropsService } from './drops-service.js';
import { locationsService } from './locations-service.js';
import { storageService } from './storage-service.js';
import { donationsService } from './donations-service.js';
import { state } from './state-manager.js';
import { uiModule } from './ui-module.js';
import { utils } from './utils.js';

// ============================================
// MAIN APP OBJECT
// ============================================

const app = {
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing ArtDrops app...');
        
        // Initialize UI listeners
        uiModule.initCommonListeners();
        
        // Initialize authentication listener
        authService.initAuthListener(this.onAuthChange.bind(this));
        
        // Request location permission
        this.requestLocationPermission();
        
        // Load Firebase data in background
        this.loadInitialData();
        
        // Setup navigation event listeners
        this.setupNavigationListeners();
        
        console.log('✅ App initialized');
    },

    /**
     * Handle authentication state changes
     */
    onAuthChange(user) {
        if (user) {
            console.log('User logged in:', user.email);
            
            // Navigate to appropriate page based on user type
            if (user.isArtist) {
                uiModule.showPage('artistDashboard');
            } else {
                uiModule.showPage('home');
            }
        } else {
            console.log('User logged out');
            uiModule.showPage('landing');
        }
    },

    /**
     * Load initial data from Firebase
     */
    async loadInitialData() {
        try {
            console.log('🔄 Loading Firebase data...');
            uiModule.showLoadingOverlay('Loading...');
            
            // Load all data in parallel
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
     * Setup navigation event listeners
     */
    setupNavigationListeners() {
        // Main navigation
        document.querySelectorAll('[data-page]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const page = button.dataset.page;
                uiModule.showPage(page);
            });
        });

        // Sign out buttons
        document.querySelectorAll('[data-action="signout"]').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleSignOut();
            });
        });
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
            console.log('⚠️ Location permission denied or unavailable');
        }
    },

    /**
     * Handle sign out
     */
    async handleSignOut() {
        const confirmed = await uiModule.showConfirmDialog(
            'Sign Out',
            'Are you sure you want to sign out?'
        );
        
        if (confirmed) {
            const result = await authService.signOut();
            if (result.success) {
                state.reset();
                uiModule.showPage('landing');
                uiModule.showToast('✅ Signed out successfully');
            }
        }
    },

    /**
     * Handle art drop creation
     */
    async handleCreateDrop(formData) {
        try {
            uiModule.showLoadingOverlay('Creating art drop...');
            
            // Upload photo
            const photoResult = await storageService.uploadArtDropPhoto(formData.photo);
            if (!photoResult.success) {
                throw new Error('Photo upload failed');
            }
            
            // Create drop
            const currentUser = state.getState().currentUser;
            const userLocation = state.getState().userLocation;
            
            const dropData = {
                artistId: currentUser.id,
                artistName: currentUser.displayName,
                title: formData.title,
                story: formData.story,
                photoUrl: photoResult.url,
                latitude: formData.latitude || userLocation.latitude,
                longitude: formData.longitude || userLocation.longitude,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode,
                venueName: formData.venueName
            };
            
            const result = await dropsService.createDrop(dropData);
            
            uiModule.hideLoadingOverlay();
            
            if (result.success) {
                uiModule.showToast('✅ Art drop created!');
                uiModule.showPage('artistDashboard');
                await this.loadInitialData();
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Error creating drop:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Failed to create art drop');
        }
    },

    /**
     * Handle finding an art drop
     */
    async handleFindDrop(dropId) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in to find art drops');
                return;
            }
            
            uiModule.showLoadingOverlay('Recording find...');
            
            const result = await dropsService.updateDropStatus(dropId, 'found', {
                userId: currentUser.id,
                userName: currentUser.displayName
            });
            
            uiModule.hideLoadingOverlay();
            
            if (result.success) {
                uiModule.showToast('🎉 Art drop found!');
                uiModule.showPage('thankYou', { dropId });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Error finding drop:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Failed to record find');
        }
    },

    /**
     * Handle donation
     */
    async handleDonation(dropId, amount, message) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in to donate');
                return;
            }
            
            // Validate amount
            const validation = donationsService.validateAmount(amount);
            if (!validation.valid) {
                uiModule.showToast(validation.error);
                return;
            }
            
            uiModule.showLoadingOverlay('Processing donation...');
            
            // Get drop details to find artist
            const drop = await dropsService.getDrop(dropId);
            
            const donationData = {
                dropId,
                artistId: drop.artistId,
                donorId: currentUser.id,
                donorName: currentUser.displayName,
                amount: validation.amount,
                message
            };
            
            const result = await donationsService.recordDonation(donationData);
            
            uiModule.hideLoadingOverlay();
            
            if (result.success) {
                uiModule.showToast('❤️ Thank you for your donation!');
                uiModule.showPage('thankYou', { dropId, donated: true });
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Error processing donation:', error);
            uiModule.hideLoadingOverlay();
            uiModule.showToast('❌ Donation failed');
        }
    },

    /**
     * Handle toggling follow on artist or location
     */
    async handleToggleFollow(targetId, targetType) {
        try {
            const currentUser = state.getState().currentUser;
            if (!currentUser) {
                uiModule.showToast('Please sign in to follow');
                return;
            }
            
            let result;
            if (targetType === 'artist') {
                // Would need to implement artist follow in authService
                uiModule.showToast('Follow artist feature coming soon');
                return;
            } else if (targetType === 'location') {
                result = await locationsService.toggleFollow(targetId, currentUser.id);
            }
            
            if (result.success) {
                const action = result.following ? 'Following' : 'Unfollowed';
                uiModule.showToast(`✅ ${action} ${targetType}`);
                
                // Refresh current page
                const currentPage = state.getState().currentPage;
                uiModule.showPage(currentPage);
            }
            
        } catch (error) {
            console.error('Error toggling follow:', error);
            uiModule.showToast('❌ Failed to update follow status');
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

// Export app for global access (if needed)
window.app = app;

export default app;
