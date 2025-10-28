// ============================================
// FIREBASE IMPORTS & INITIALIZATION
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc,
    setDoc,
    updateDoc,
    query, 
    where, 
    orderBy, 
    limit,
    increment,
    serverTimestamp,
    onSnapshot,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// ============================================
// FIREBASE CONFIGURATION
// REPLACE WITH YOUR ACTUAL FIREBASE CONFIG
// ============================================

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("Firebase initialized successfully!");

// ============================================
// APP STATE (Modified for Firebase)
// ============================================

const appState = {
    currentUser: null,
    currentPage: 'landing',
    userLocation: null,
    locationTypes: ['Coffee Shop', 'Bookstore', 'Park', 'Trail', 'Plaza', 'Mall', 'Library', 'Beach', 'Other'],
    donationPresets: [1, 3, 5, 10],
    platformCommission: 0.05,
    tempProfilePhoto: null,
    cachedArtDrops: [],
    cachedLocations: [],
    mapInstance: null
};

// ============================================
// FIREBASE AUTH STATE LISTENER
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User signed in:", user.email);
        // Load user profile from Firestore
        const userProfile = await loadUserProfile(user.uid);
        appState.currentUser = {
            id: user.uid,
            email: user.email,
            name: user.displayName || userProfile?.name || 'User',
            profilePhoto: user.photoURL || userProfile?.profilePhoto || '',
            ...userProfile
        };
        app.updateNav();
    } else {
        console.log("User signed out");
        appState.currentUser = null;
        app.updateNav();
    }
});

// ============================================
// FIREBASE HELPER FUNCTIONS
// ============================================

// Create or update user document
async function ensureUserDocument(user, additionalData = {}) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            // Create new user document
            await setDoc(userRef, {
                userId: user.uid,
                name: user.displayName || additionalData.name || 'User',
                email: user.email,
                profilePhoto: user.photoURL || '',
                userType: additionalData.userType || 'artist',
                bio: additionalData.bio || '',
                city: additionalData.city || '',
                instagram: '',
                tiktok: '',
                facebook: '',
                website: '',
                followerCount: 0,
                totalDonations: 0,
                activeDrops: 0,
                joinDate: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });
            console.log("New user document created");
        } else {
            // Update last login
            await updateDoc(userRef, {
                lastLogin: serverTimestamp()
            });
        }
        
        return await getDoc(userRef);
    } catch (error) {
        console.error("Error ensuring user document:", error);
        throw error;
    }
}

// Load user profile
async function loadUserProfile(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error loading user profile:", error);
        return null;
    }
}

// Load all art drops
async function loadArtDrops(filters = {}) {
    try {
        let q = collection(db, 'artDrops');
        
        // Apply filters
        const constraints = [];
        if (filters.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters.artistId) {
            constraints.push(where('artistId', '==', filters.artistId));
        }
        
        // Always order by date
        constraints.push(orderBy('dateCreated', 'desc'));
        
        // Limit results
        constraints.push(limit(filters.limit || 50));
        
        q = query(q, ...constraints);
        const snapshot = await getDocs(q);
        
        const artDrops = [];
        snapshot.forEach(doc => {
            artDrops.push({ id: doc.id, ...doc.data() });
        });
        
        appState.cachedArtDrops = artDrops;
        return artDrops;
    } catch (error) {
        console.error("Error loading art drops:", error);
        return appState.cachedArtDrops;
    }
}

// Create new art drop
async function createArtDrop(formData) {
    try {
        if (!appState.currentUser) {
            throw new Error("Must be signed in to create art drop");
        }
        
        // Upload photo if file provided
        let photoUrl = formData.photoUrl;
        if (formData.photoFile) {
            photoUrl = await uploadArtPhoto(formData.photoFile);
        }
        
        const artData = {
            artistId: appState.currentUser.id,
            artistName: appState.currentUser.name,
            artistPhoto: appState.currentUser.profilePhoto || '',
            title: formData.title,
            story: formData.story,
            photoUrl: photoUrl,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            locationType: formData.locationType,
            locationName: formData.locationName,
            materials: formData.materials || '',
            dateCreated: serverTimestamp(),
            status: 'active',
            foundCount: 0,
            totalDonations: 0,
            findEvents: []
        };
        
        const docRef = await addDoc(collection(db, 'artDrops'), artData);
        console.log("Art drop created with ID:", docRef.id);
        
        // Update user's activeDrops count
        const userRef = doc(db, 'users', appState.currentUser.id);
        await updateDoc(userRef, {
            activeDrops: increment(1)
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error creating art drop:", error);
        throw error;
    }
}

// Upload art photo to Storage
async function uploadArtPhoto(file) {
    try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `art/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        console.log("Photo uploaded successfully:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading photo:", error);
        throw error;
    }
}

// Upload profile photo
async function uploadProfilePhoto(file, userId) {
    try {
        const storageRef = ref(storage, `profiles/${userId}/avatar.jpg`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            profilePhoto: downloadURL
        });
        
        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile photo:", error);
        throw error;
    }
}

// Follow/unfollow artist
async function toggleFollowArtist(artistId) {
    try {
        if (!appState.currentUser) {
            throw new Error("Must be signed in to follow");
        }
        
        const followId = `${appState.currentUser.id}_${artistId}`;
        const followRef = doc(db, 'follows', followId);
        const followSnap = await getDoc(followRef);
        
        if (followSnap.exists()) {
            // Unfollow
            await deleteDoc(followRef);
            const artistRef = doc(db, 'users', artistId);
            await updateDoc(artistRef, {
                followerCount: increment(-1)
            });
            console.log("Unfollowed artist");
            return false;
        } else {
            // Follow
            await setDoc(followRef, {
                followerId: appState.currentUser.id,
                targetType: 'artist',
                targetId: artistId,
                dateFollowed: serverTimestamp()
            });
            const artistRef = doc(db, 'users', artistId);
            await updateDoc(artistRef, {
                followerCount: increment(1)
            });
            console.log("Followed artist");
            return true;
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw error;
    }
}

// Follow/unfollow location
async function toggleFollowLocation(locationId) {
    try {
        if (!appState.currentUser) {
            throw new Error("Must be signed in to follow");
        }
        
        const followId = `${appState.currentUser.id}_loc_${locationId}`;
        const followRef = doc(db, 'follows', followId);
        const followSnap = await getDoc(followRef);
        
        if (followSnap.exists()) {
            // Unfollow
            await deleteDoc(followRef);
            const locationRef = doc(db, 'locations', locationId.toString());
            await updateDoc(locationRef, {
                followerCount: increment(-1)
            });
            return false;
        } else {
            // Follow
            await setDoc(followRef, {
                followerId: appState.currentUser.id,
                targetType: 'location',
                targetId: locationId.toString(),
                dateFollowed: serverTimestamp()
            });
            const locationRef = doc(db, 'locations', locationId.toString());
            await updateDoc(locationRef, {
                followerCount: increment(1)
            });
            return true;
        }
    } catch (error) {
        console.error("Error toggling follow location:", error);
        throw error;
    }
}

// Load locations
async function loadLocations() {
    try {
        const q = query(collection(db, 'locations'), orderBy('followerCount', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        const locations = [];
        snapshot.forEach(doc => {
            locations.push({ id: doc.id, ...doc.data() });
        });
        
        appState.cachedLocations = locations;
        return locations;
    } catch (error) {
        console.error("Error loading locations:", error);
        return appState.cachedLocations;
    }
}

// ============================================
// MAIN APP CONTROLLER
// ============================================

const app = {
    init() {
        console.log("Initializing ArtDrops app...");
        this.requestLocationPermission();
        this.showPage('landing');
        this.updateNav();
    },

    // ============================================
    // AUTHENTICATION METHODS (Firebase)
    // ============================================
    
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            await ensureUserDocument(result.user, { userType: 'artist' });
            this.showToast('Welcome, ' + result.user.displayName + '!');
            this.showPage('home');
        } catch (error) {
            console.error('Google sign in error:', error);
            this.showToast('Sign in failed: ' + error.message);
        }
    },
    
    async signInWithApple() {
        try {
            const provider = new OAuthProvider('apple.com');
            const result = await signInWithPopup(auth, provider);
            await ensureUserDocument(result.user, { userType: 'artist' });
            this.showToast('Welcome!');
            this.showPage('home');
        } catch (error) {
            console.error('Apple sign in error:', error);
            this.showToast('Sign in failed: ' + error.message);
        }
    },
    
    async handleArtistLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(result.user, { userType: 'artist' });
            this.showToast('Welcome back!');
            this.showPage('home');
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed: ' + error.message);
        }
    },
    
    async handleArtistSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        const bio = formData.get('bio');
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(result.user, { 
                name: name,
                bio: bio,
                userType: 'artist'
            });
            
            // Upload profile photo if provided
            const photoInput = document.getElementById('signupProfileInput');
            if (photoInput && photoInput.files.length > 0) {
                await uploadProfilePhoto(photoInput.files[0], result.user.uid);
            }
            
            this.showToast('Account created successfully!');
            this.showPage('home');
        } catch (error) {
            console.error('Signup error:', error);
            this.showToast('Signup failed: ' + error.message);
        }
    },
    
    async handleFinderLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(result.user, { userType: 'finder' });
            this.showToast('Welcome back!');
            this.showPage('feed');
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed: ' + error.message);
        }
    },
    
    async handleFinderSignup(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await ensureUserDocument(result.user, { 
                name: name,
                userType: 'finder'
            });
            this.showToast('Account created successfully!');
            this.showPage('feed');
        } catch (error) {
            console.error('Signup error:', error);
            this.showToast('Signup failed: ' + error.message);
        }
    },
    
    async logout() {
        try {
            await firebaseSignOut(auth);
            appState.currentUser = null;
            this.showToast('Logged out successfully');
            this.showPage('landing');
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Logout failed');
        }
    },

    // ============================================
    // ART DROP METHODS (Firebase)
    // ============================================
    
    async handleDropNewArt(e) {
        e.preventDefault();
        
        if (!appState.currentUser) {
            this.showToast('Please sign in first');
            return;
        }
        
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        try {
            const dropData = {
                photoUrl: formData.get('photoUrl'),
                title: formData.get('title'),
                story: formData.get('story'),
                locationType: formData.get('locationType'),
                locationName: formData.get('locationName'),
                latitude: formData.get('latitude'),
                longitude: formData.get('longitude'),
                materials: formData.get('materials') || 'Natural materials'
            };
            
            const dropId = await createArtDrop(dropData);
            
            this.showToast('Art drop created successfully!');
            this.showPage('qr-tag-generator', { dropId: dropId });
        } catch (error) {
            console.error('Error creating drop:', error);
            this.showToast('Failed to create art drop: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create & Generate QR Tag';
        }
    },
    
    async toggleFollowArtist(artistId) {
        if (!appState.currentUser) {
            this.showToast('Please sign in to follow artists');
            return;
        }
        
        try {
            const isFollowing = await toggleFollowArtist(artistId);
            this.showToast(isFollowing ? 'Following artist!' : 'Unfollowed');
            // Reload current page to update UI
            this.showPage(appState.currentPage, { artistId: artistId });
        } catch (error) {
            this.showToast('Error: ' + error.message);
        }
    },
    
    async toggleFollowLocation(locationId) {
        if (!appState.currentUser) {
            this.showToast('Please sign in to follow locations');
            return;
        }
        
        try {
            const isFollowing = await toggleFollowLocation(locationId);
            this.showToast(isFollowing ? 'Following location!' : 'Unfollowed');
        } catch (error) {
            this.showToast('Error: ' + error.message);
        }
    },

    // ============================================
    // LOCATION & UTILITY METHODS
    // ============================================
    
    requestLocationPermission() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    appState.userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('User location obtained:', appState.userLocation);
                },
                (error) => {
                    console.log('Location permission denied or unavailable');
                    appState.userLocation = null;
                }
            );
        }
    },
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },
    
    formatDistance(distance) {
        if (distance < 0.1) return 'Less than 0.1 miles away';
        if (distance < 1) return `${distance.toFixed(1)} miles away`;
        return `${Math.round(distance)} miles away`;
    },
    
    useCurrentLocation() {
        if (appState.userLocation) {
            document.getElementById('dropLatitude').value = appState.userLocation.latitude;
            document.getElementById('dropLongitude').value = appState.userLocation.longitude;
            this.showToast('Current location set!');
        } else {
            this.showToast('Location not available. Please enable location services.');
        }
    },
    
    showToast(message) {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary-black);
            color: var(--primary-white);
            padding: 16px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideUp 0.3s ease-out;
            min-width: 200px;
            text-align: center;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 2700);
    },

    // ============================================
    // NAVIGATION & PAGE RENDERING
    // ============================================
    
    showPage(page, data = {}) {
        appState.currentPage = page;
        const appContainer = document.getElementById('app');
        
        // Show loading
        appContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; min-height: 50vh;"><div class="spinner"></div></div>';
        
        // Render page content
        setTimeout(async () => {
            switch(page) {
                case 'landing':
                    appContainer.innerHTML = await this.renderLanding();
                    break;
                case 'artist-login':
                    appContainer.innerHTML = this.renderArtistLogin();
                    break;
                case 'artist-signup':
                    appContainer.innerHTML = this.renderArtistSignup();
                    break;
                case 'home':
                    appContainer.innerHTML = await this.renderHome();
                    break;
                case 'browse-map':
                    appContainer.innerHTML = this.renderBrowseMap();
                    setTimeout(() => this.initBrowseMap(), 300);
                    break;
                case 'artist-dashboard':
                    appContainer.innerHTML = await this.renderArtistDashboard();
                    break;
                case 'drop-new-art':
                    appContainer.innerHTML = this.renderDropNewArt();
                    setTimeout(() => this.initDropLocationMap(), 300);
                    break;
                case 'my-drops':
                    appContainer.innerHTML = await this.renderMyDrops();
                    break;
                case 'qr-tag-generator':
                    appContainer.innerHTML = this.renderQRTagGenerator(data.dropId);
                    setTimeout(() => this.generateQRCode(data.dropId), 200);
                    break;
                case 'feed':
                    appContainer.innerHTML = await this.renderFeed();
                    break;
                case 'popular-locations':
                    appContainer.innerHTML = await this.renderPopularLocations();
                    break;
                case 'artist-profile':
                    appContainer.innerHTML = await this.renderArtistProfile(data.artistId);
                    break;
                case 'edit-profile':
                    appContainer.innerHTML = this.renderEditProfile();
                    break;
                default:
                    appContainer.innerHTML = '<div class="container"><h1>Page not found</h1></div>';
            }
            
            this.updateNav();
            window.scrollTo(0, 0);
        }, 100);
    },
    
    updateNav() {
        const bottomNav = document.getElementById('bottomNav');
        const footer = document.getElementById('mainFooter');
        
        if (!bottomNav || !footer) return;
        
        footer.classList.remove('hidden');
        
        if (!appState.currentUser) {
            bottomNav.innerHTML = `
                <button onclick="app.showPage('landing')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <path d="M9 22V12h6v10"/>
                    </svg>
                    <span>HOME</span>
                </button>
                <button onclick="app.showPage('browse-map')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                    </svg>
                    <span>MAP</span>
                </button>
                <button onclick="app.showPage('popular-locations')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span>POPULAR</span>
                </button>
                <button onclick="app.showPage('artist-login')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>ACCOUNT</span>
                </button>
            `;
        } else if (appState.currentUser.userType === 'finder') {
            bottomNav.innerHTML = `
                <button onclick="app.showPage('feed')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    <span>FEED</span>
                </button>
                <button onclick="app.showPage('browse-map')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                    </svg>
                    <span>MAP</span>
                </button>
                <button onclick="app.showPage('popular-locations')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span>POPULAR</span>
                </button>
                <button onclick="app.logout()">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>LOGOUT</span>
                </button>
            `;
        } else {
            bottomNav.innerHTML = `
                <button onclick="app.showPage('home')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <path d="M9 22V12h6v10"/>
                    </svg>
                    <span>HOME</span>
                </button>
                <button onclick="app.showPage('browse-map')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="10" r="3"/>
                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                    </svg>
                    <span>MAP</span>
                </button>
                <button onclick="app.showPage('popular-locations')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                    <span>POPULAR</span>
                </button>
                <button onclick="app.showPage('artist-dashboard')">
                    <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>ACCOUNT</span>
                </button>
            `;
        }
    },

    // ============================================
    // RENDER METHODS (Using Firebase data)
    // ============================================
    
    async renderLanding() {
        const artDrops = await loadArtDrops({ status: 'active', limit: 6 });
        
        return `
            <div class="hero">
                <div class="app-name">ARTDROPS</div>
                <h1>Drop art anywhere.<br>Find joy everywhere.</h1>
                <p>Discover painted natural treasures hidden in public spaces. Every piece tells a story of where it came from.</p>
                <div class="hero-buttons">
                    <button class="btn-apple" onclick="app.signInWithApple()" style="margin-bottom: 1rem;">
                        <svg width="16" height="20" viewBox="0 0 16 20" fill="white">
                            <path d="M12.5 0c-.4.1-.9.3-1.3.6-.4.3-.8.8-1 1.4-.2.5-.3 1.1-.2 1.7.5 0 1-.2 1.5-.5.4-.3.8-.8 1-1.4.2-.5.2-1.1.1-1.6l-.1-.2zM15.8 7.1c-.5-.6-1.2-1-2-1-.9 0-1.3.4-1.9.4-.7 0-1.1-.4-2-.4-1 0-2 .6-2.7 1.5-1 1.3-1 3.6 0 5.6.5.9 1.1 1.9 2 1.9.8 0 1-.5 2-.5s1.2.5 2 .5c.9 0 1.5-1 2-1.9.3-.5.5-1 .6-1.5.1-.2 0-.4-.2-.5-.9-.4-1.5-1.4-1.5-2.4 0-1.1.6-2 1.5-2.4.2-.1.3-.3.2-.5z"/>
                        </svg>
                        Sign in with Apple
                    </button>
                    <button class="btn-google" onclick="app.signInWithGoogle()" style="margin-bottom: 1rem;">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                        </svg>
                        Sign in with Google
                    </button>
                    <button class="btn-guest" onclick="app.showPage('browse-map')">
                        Browse as Guest
                    </button>
                </div>
            </div>
            
            <div class="container">
                <h2 style="text-align: center; margin-bottom: 2rem;">Recent Finds</h2>
                <div class="grid grid-3">
                    ${artDrops.map(drop => this.renderDropCard(drop)).join('')}
                </div>
            </div>
        `;
    },
    
    renderArtistLogin() {
        return `
            <div class="auth-container">
                <div class="app-name" style="text-align: center; margin-bottom: 2rem;">ARTDROPS</div>
                <h2>Drop art anywhere.<br>Find joy everywhere.</h2>
                <p style="text-align: center; color: var(--text-gray); margin-bottom: 3rem;">Welcome back, creator!</p>
                
                <button type="button" onclick="app.signInWithApple()" class="btn-apple" style="margin-bottom: 1rem;">
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="white">
                        <path d="M12.5 0c-.4.1-.9.3-1.3.6-.4.3-.8.8-1 1.4-.2.5-.3 1.1-.2 1.7.5 0 1-.2 1.5-.5.4-.3.8-.8 1-1.4.2-.5.2-1.1.1-1.6l-.1-.2zM15.8 7.1c-.5-.6-1.2-1-2-1-.9 0-1.3.4-1.9.4-.7 0-1.1-.4-2-.4-1 0-2 .6-2.7 1.5-1 1.3-1 3.6 0 5.6.5.9 1.1 1.9 2 1.9.8 0 1-.5 2-.5s1.2.5 2 .5c.9 0 1.5-1 2-1.9.3-.5.5-1 .6-1.5.1-.2 0-.4-.2-.5-.9-.4-1.5-1.4-1.5-2.4 0-1.1.6-2 1.5-2.4.2-.1.3-.3.2-.5z"/>
                    </svg>
                    Sign in with Apple
                </button>
                
                <button type="button" onclick="app.signInWithGoogle()" class="btn-google" style="margin-bottom: 1rem;">
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </svg>
                    Sign in with Google
                </button>
                
                <div style="text-align: center; margin: 1.5rem 0; color: var(--text-gray); position: relative;">
                    <span style="background: var(--primary-white); padding: 0 1rem; position: relative; z-index: 1; font-size: 0.9rem;">or</span>
                    <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-gray);"></div>
                </div>
                
                <form onsubmit="app.handleArtistLogin(event)">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-control" name="password" required placeholder="Enter your password">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px;">Login</button>
                </form>
                <p style="text-align: center; margin-top: 3rem; color: var(--text-gray);">
                    New artist? <a href="#" onclick="app.showPage('artist-signup'); return false;" style="color: var(--primary-black); font-weight: 600;">Sign Up</a>
                </p>
            </div>
        `;
    },
    
    renderArtistSignup() {
        return `
            <div class="auth-container">
                <h2>Join ArtDrops</h2>
                <p style="text-align: center; color: var(--text-gray); margin-bottom: 3rem;">Start sharing your art with the world</p>
                <form onsubmit="app.handleArtistSignup(event)">
                    <div class="form-group" style="text-align: center;">
                        <label>Profile Picture</label>
                        <div>
                            <img id="signupProfilePreview" src="https://via.placeholder.com/150/000000/FFFFFF?text=+" style="width: 120px; height: 120px; border-radius: 50%; margin: 1rem auto; display: block;">
                            <input type="file" id="signupProfileInput" accept="image/*" style="display: none;">
                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('signupProfileInput').click()">Upload Photo</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" name="name" required placeholder="Your artist name">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" class="form-control" name="email" required placeholder="your@email.com">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" class="form-control" name="password" required placeholder="Create a password">
                    </div>
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea class="form-control" name="bio" placeholder="Tell us about your art..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px;">Create Account</button>
                </form>
                <p style="text-align: center; margin-top: 1.5rem;">
                    Already have an account? <a href="#" onclick="app.showPage('artist-login'); return false;" style="color: var(--primary-black); font-weight: 600;">Login</a>
                </p>
            </div>
        `;
    },
    
    async renderHome() {
        if (!appState.currentUser) {
            this.showPage('landing');
            return '';
        }
        
        const userDrops = await loadArtDrops({ artistId: appState.currentUser.id, limit: 10 });
        
        return `
            <div class="container">
                <div class="hero" style="padding: 3rem 2rem;">
                    <h1>Welcome back, ${appState.currentUser.name}!</h1>
                    <p>Ready to drop some art into the world?</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${appState.currentUser.activeDrops || 0}</div>
                        <div class="stat-label">Active Drops</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${(appState.currentUser.totalDonations || 0).toFixed(2)}</div>
                        <div class="stat-label">Total Donations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${userDrops.length}</div>
                        <div class="stat-label">Total Drops</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin: 3rem 0; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-primary" onclick="app.showPage('drop-new-art')" style="flex: 1; min-width: 200px; max-width: 300px;">Drop New Art</button>
                    <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 200px; max-width: 300px;">View My Drops</button>
                    <button class="btn btn-secondary" onclick="app.showPage('browse-map')" style="flex: 1; min-width: 200px; max-width: 300px;">Browse Map</button>
                </div>
            </div>
        `;
    },
    
    renderBrowseMap() {
        return `
            <div id="map-page">
                <div class="map-container">
                    <div id="browseMap"></div>
                </div>
            </div>
        `;
    },
    
    async renderArtistDashboard() {
        if (!appState.currentUser) {
            this.showPage('artist-login');
            return '';
        }
        
        const myDrops = await loadArtDrops({ artistId: appState.currentUser.id });
        const activeDrops = myDrops.filter(d => d.status === 'active');
        const foundDrops = myDrops.filter(d => d.status === 'found');
        
        return `
            <div class="container">
                <h1>Artist Dashboard</h1>
                <p style="color: var(--text-gray); margin-bottom: 2rem;">Manage your art drops and view donations</p>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${myDrops.length}</div>
                        <div class="stat-label">Total Drops</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${activeDrops.length}</div>
                        <div class="stat-label">Active</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${foundDrops.length}</div>
                        <div class="stat-label">Found</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${(appState.currentUser.totalDonations || 0).toFixed(2)}</div>
                        <div class="stat-label">Donations</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin: 3rem 0;">
                    <button class="btn btn-primary" onclick="app.showPage('drop-new-art')">Drop New Art</button>
                    <button class="btn btn-secondary" onclick="app.showPage('my-drops')">View All Drops</button>
                    <button class="btn btn-secondary" onclick="app.showPage('edit-profile')">Edit Profile</button>
                    <button class="btn btn-secondary" onclick="app.logout()">Logout</button>
                </div>
            </div>
        `;
    },
    
    renderDropNewArt() {
        if (!appState.currentUser) {
            this.showPage('artist-login');
            return '';
        }
        
        return `
            <div class="container" style="max-width: 800px;">
                <h1>Drop New Art</h1>
                <p style="color: var(--text-gray); margin-bottom: 3rem;">Share your painted natural treasure with the world</p>
                
                <div class="card">
                    <div class="card-content" style="padding: 2rem;">
                        <form onsubmit="app.handleDropNewArt(event)">
                            <div class="form-group">
                                <label>Photo URL *</label>
                                <input type="url" class="form-control" name="photoUrl" required placeholder="https://example.com/photo.jpg">
                                <small style="color: var(--text-gray);">Use an image hosting service or direct link</small>
                            </div>
                            
                            <div class="form-group">
                                <label>Title *</label>
                                <input type="text" class="form-control" name="title" required placeholder="Give your art a memorable name">
                            </div>
                            
                            <div class="form-group">
                                <label>Story *</label>
                                <textarea class="form-control" name="story" required placeholder="Tell the story: Where did you find this? What inspired you?"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Location Type *</label>
                                <select class="form-control" name="locationType" required>
                                    <option value="">Select type</option>
                                    ${appState.locationTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Location Name *</label>
                                <input type="text" class="form-control" name="locationName" required placeholder="e.g., Central Perk Cafe">
                            </div>
                            
                            <div class="form-group">
                                <label>Latitude *</label>
                                <input type="number" class="form-control" name="latitude" id="dropLatitude" required step="any" placeholder="40.7589">
                            </div>
                            
                            <div class="form-group">
                                <label>Longitude *</label>
                                <input type="number" class="form-control" name="longitude" id="dropLongitude" required step="any" placeholder="-73.9851">
                            </div>
                            
                            <button type="button" class="btn btn-secondary" onclick="app.useCurrentLocation()" style="width: 100%; margin-bottom: 1rem;">Use My Current Location</button>
                            
                            <div class="form-group">
                                <label>Materials (optional)</label>
                                <input type="text" class="form-control" name="materials" placeholder="Shell, Watercolor">
                            </div>
                            
                            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px;">Create & Generate QR Tag</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },
    
    async renderMyDrops() {
        if (!appState.currentUser) {
            this.showPage('artist-login');
            return '';
        }
        
        const myDrops = await loadArtDrops({ artistId: appState.currentUser.id });
        
        return `
            <div class="container">
                <h1>My Drops</h1>
                <p style="color: var(--text-gray); margin-bottom: 2rem;">Your art in the wild</p>
                
                ${myDrops.length > 0 ? `
                    <div class="grid grid-3">
                        ${myDrops.map(drop => this.renderDropCard(drop)).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <h3>No art drops yet</h3>
                        <p>Be the first to drop art and spread joy!</p>
                        <button class="btn btn-primary" onclick="app.showPage('drop-new-art')">Drop Your First Piece</button>
                    </div>
                `}
            </div>
        `;
    },
    
    renderQRTagGenerator(dropId) {
        return `
            <div class="container" style="max-width: 900px;">
                <h1 style="text-align: center;">QR Tag Generator</h1>
                <p style="color: var(--text-gray); margin-bottom: 3rem; text-align: center;">Download and print your QR code</p>
                
                <div class="card">
                    <div class="card-content" style="padding: 2rem; text-align: center;">
                        <div id="qrcode" style="margin: 2rem auto;"></div>
                        <p style="margin-top: 2rem;">Scan this code to view your art drop</p>
                        <button class="btn btn-primary" onclick="app.showPage('my-drops')" style="margin-top: 2rem;">Back to My Drops</button>
                    </div>
                </div>
            </div>
        `;
    },
    
    async renderFeed() {
        const artDrops = await loadArtDrops({ limit: 20 });
        
        return `
            <div class="container">
                <h2 style="padding: 20px 0;">Discover Art</h2>
                <div class="grid grid-3">
                    ${artDrops.map(drop => this.renderDropCard(drop)).join('')}
                </div>
            </div>
        `;
    },
    
    async renderPopularLocations() {
        const locations = await loadLocations();
        
        return `
            <div class="container">
                <h1>Popular Locations</h1>
                <p style="color: var(--text-gray); margin-bottom: 2rem;">Discover hotspots for art drops</p>
                
                <div class="grid grid-3">
                    ${locations.map(location => `
                        <div class="card">
                            <div class="card-content">
                                <h3>${location.name}</h3>
                                <p>${location.city}, ${location.state}</p>
                                <p>${location.followerCount} followers • ${location.activeDropCount} drops</p>
                                <button class="btn btn-primary" onclick="app.toggleFollowLocation(${location.id})" style="margin-top: 1rem;">Follow</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    async renderArtistProfile(artistId) {
        const artist = await loadUserProfile(artistId);
        if (!artist) {
            return '<div class="container"><p>Artist not found</p></div>';
        }
        
        const artistDrops = await loadArtDrops({ artistId: artistId });
        
        return `
            <div class="container">
                <div class="card" style="margin-bottom: 3rem;">
                    <div class="card-content" style="padding: 2rem;">
                        <div style="display: flex; gap: 2rem; align-items: center;">
                            <img src="${artist.profilePhoto || 'https://via.placeholder.com/150'}" style="width: 120px; height: 120px; border-radius: 50%;">
                            <div>
                                <h1>${artist.name}</h1>
                                <p>${artist.city || ''}</p>
                                <p>${artist.bio || ''}</p>
                                ${appState.currentUser && appState.currentUser.id !== artistId ? `
                                    <button class="btn btn-primary" onclick="app.toggleFollowArtist('${artistId}')" style="margin-top: 1rem;">Follow</button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <h2>Art Drops (${artistDrops.length})</h2>
                <div class="grid grid-3">
                    ${artistDrops.map(drop => this.renderDropCard(drop)).join('')}
                </div>
            </div>
        `;
    },
    
    renderEditProfile() {
        if (!appState.currentUser) {
            return '';
        }
        
        return `
            <div class="container" style="max-width: 600px;">
                <h1>Edit Profile</h1>
                <form onsubmit="app.handleProfileUpdate(event)">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="form-control" name="name" value="${appState.currentUser.name || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea class="form-control" name="bio">${appState.currentUser.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>City</label>
                        <input type="text" class="form-control" name="city" value="${appState.currentUser.city || ''}">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Save Changes</button>
                </form>
                <button class="btn btn-secondary" onclick="app.showPage('artist-dashboard')" style="width: 100%; margin-top: 1rem;">Cancel</button>
            </div>
        `;
    },
    
    async handleProfileUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const userRef = doc(db, 'users', appState.currentUser.id);
            await updateDoc(userRef, {
                name: formData.get('name'),
                bio: formData.get('bio'),
                city: formData.get('city')
            });
            
            appState.currentUser.name = formData.get('name');
            appState.currentUser.bio = formData.get('bio');
            appState.currentUser.city = formData.get('city');
            
            this.showToast('Profile updated successfully!');
            this.showPage('artist-dashboard');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showToast('Failed to update profile');
        }
    },
    
    renderDropCard(drop) {
        return `
            <div class="card">
                <img src="${drop.photoUrl}" alt="${drop.title}" class="card-image">
                <div class="card-content">
                    <span class="badge badge-${drop.status === 'active' ? 'active' : 'found'}">${drop.status === 'active' ? 'Active' : 'Found'}</span>
                    <h3 class="card-title">${drop.title}</h3>
                    <p class="card-story">${drop.story.substring(0, 100)}...</p>
                    <p style="color: var(--text-gray); font-size: 0.9rem;">by ${drop.artistName}</p>
                </div>
            </div>
        `;
    },

    // ============================================
    // MAP INITIALIZATION
    // ============================================
    
    async initBrowseMap() {
        if (appState.mapInstance) {
            appState.mapInstance.remove();
        }
        
        const mapContainer = document.getElementById('browseMap');
        if (!mapContainer) return;
        
        appState.mapInstance = L.map('browseMap').setView([39.8283, -98.5795], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(appState.mapInstance);
        
        // Load and display art drops
        const artDrops = await loadArtDrops({ status: 'active' });
        artDrops.forEach(drop => {
            const marker = L.marker([drop.latitude, drop.longitude]).addTo(appState.mapInstance);
            marker.bindPopup(`
                <div style="text-align: center;">
                    <img src="${drop.photoUrl}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px;">
                    <h3>${drop.title}</h3>
                    <p>by ${drop.artistName}</p>
                </div>
            `);
        });
        
        // Center on user location if available
        if (appState.userLocation) {
            appState.mapInstance.setView([appState.userLocation.latitude, appState.userLocation.longitude], 13);
        }
    },
    
    initDropLocationMap() {
        // Initialize map for drop new art location picker
        if (appState.mapInstance) {
            appState.mapInstance.remove();
        }
        
        const mapContainer = document.getElementById('dropLocationMap');
        if (!mapContainer) return;
        
        appState.mapInstance = L.map('dropLocationMap').setView([39.8283, -98.5795], 4);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(appState.mapInstance);
        
        if (appState.userLocation) {
            appState.mapInstance.setView([appState.userLocation.latitude, appState.userLocation.longitude], 13);
        }
    },
    
    generateQRCode(dropId) {
        const container = document.getElementById('qrcode');
        if (container && typeof QRCode !== 'undefined') {
            container.innerHTML = '';
            new QRCode(container, {
                text: `https://artdrops.app/drop/${dropId}`,
                width: 256,
                height: 256
            });
        }
    }
};

// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    app.init();
});

// Make app globally accessible
window.app = app;
