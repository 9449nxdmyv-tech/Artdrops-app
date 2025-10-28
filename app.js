// ============================================
// FIREBASE IMPORTS & CONFIGURATION
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc,
    setDoc,
    updateDoc,
    query, 
    where, 
    orderBy, 
    limit,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

// Firebase Config - REPLACE WITH YOURS
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Keep your app working with existing sample data while Firebase is optional
window.useFirebase = true; // Set to true when Firebase is configured

 // ============================================
        // DATA STRUCTURES (In-Memory Storage)
        // ============================================
        
        const appState = {
            currentUser: null,
            currentPage: 'landing',
            userLocation: null,
            artists: [
                {
                    id: 1,
                    name: 'Sarah Martinez',
                    email: 'sarah@example.com',
                    password: 'password',
                    joinDate: '2024-09-15',
                    totalDonations: 142.50,
                    activeDrops: 6,
                    instagram: '@sarahartdrops',
                    tiktok: '@sarah.creates',
                    website: 'https://sarahmartinez.art',
                    bio: 'Finding beauty in nature\'s discarded treasures. Beach walker, sunset painter, coffee shop regular.',
                    profilePhoto: 'https://i.pravatar.cc/200?img=1',
                    city: 'Brooklyn, NY'
                },
                {
                    id: 2,
                    name: 'James River',
                    email: 'james@example.com',
                    password: 'password',
                    joinDate: '2024-10-01',
                    totalDonations: 98.75,
                    activeDrops: 4,
                    instagram: '@jamesriverart',
                    facebook: 'https://facebook.com/jamesriverart',
                    website: 'https://jamesriver.studio',
                    bio: 'Desert wanderer painting stories on stones. Sedona sunsets captured on sandstone.',
                    profilePhoto: 'https://i.pravatar.cc/200?img=12',
                    city: 'Sedona, AZ'
                },
                {
                    id: 3,
                    name: 'Alex Park',
                    email: 'alex@example.com',
                    password: 'password',
                    joinDate: '2024-08-20',
                    totalDonations: 215.00,
                    activeDrops: 9,
                    instagram: '@alexparkart',
                    tiktok: '@alex.drops',
                    website: 'https://alexparkstudio.com',
                    bio: 'Urban explorer hiding art in unexpected places. Driftwood sculptor, quote painter, joy spreader.',
                    profilePhoto: 'https://i.pravatar.cc/200?img=5',
                    city: 'Portland, OR'
                }
            ],
            finders: [
                {
                    id: 3,
                    name: 'Emily Chen',
                    email: 'emily@example.com',
                    password: 'password',
                    userType: 'finder',
                    foundArt: [1, 3],
                    followedArtists: [1],
                    followedLocations: [1, 3],
                    totalFinds: 12,
                    bio: 'Art hunter and coffee shop explorer',
                    profilePhoto: 'https://i.pravatar.cc/200?img=32',
                    city: 'Brooklyn, NY',
                    joinDate: '2024-09-10'
                },
                {
                    id: 4,
                    name: 'Marcus Williams',
                    email: 'marcus@example.com',
                    password: 'password',
                    userType: 'finder',
                    foundArt: [2, 4],
                    followedArtists: [2],
                    followedLocations: [2],
                    totalFinds: 8,
                    bio: 'Trail runner discovering hidden treasures',
                    profilePhoto: 'https://i.pravatar.cc/200?img=14',
                    city: 'Denver, CO',
                    joinDate: '2024-09-25'
                }
            ],
            artDrops: [
                {
                    id: 1,
                    artistId: 1,
                    artistName: 'Sarah Martinez',
                    title: 'Morning Coffee Shell',
                    story: 'Found this perfect scallop shell during sunrise beach walk. Painted it with the colors of that magical morning sky.',
                    photoUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=1600&fit=crop',
                    latitude: 40.7589,
                    longitude: -73.9851,
                    locationType: 'Coffee Shop',
                    locationName: 'Central Perk Cafe, NYC',
                    status: 'active',
                    dateCreated: '2024-10-20',
                    totalDonations: 23.50,
                    foundCount: 0,
                    findEvents: []
                },
                {
                    id: 2,
                    artistId: 2,
                    artistName: 'James River',
                    title: 'Desert Dreams',
                    story: 'This red sandstone called to me from a canyon wall. I painted it with the spirit of the desert sunset.',
                    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop',
                    latitude: 34.8697,
                    longitude: -111.7610,
                    locationType: 'Trail',
                    locationName: 'Sedona Red Rock Trail',
                    status: 'found',
                    dateCreated: '2024-10-18',
                    findDate: '2024-10-24',
                    finderMessage: 'This made my hike so special! Thank you!',
                    totalDonations: 15.00,
                    foundCount: 1,
                    findEvents: [
                        {
                            id: 1,
                            finderName: 'Sarah H.',
                            message: 'This made my hike so special! Thank you!',
                            findDate: '2024-10-24',
                            donated: true
                        }
                    ]
                },
                {
                    id: 3,
                    artistId: 3,
                    artistName: 'Alex Park',
                    title: 'Page Turner',
                    story: 'Driftwood from the Hudson, painted with literary quotes. Perfect for a bookstore hiding spot.',
                    photoUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop',
                    latitude: 40.7282,
                    longitude: -73.9942,
                    locationType: 'Bookstore',
                    locationName: 'Shakespeare &amp; Co Books',
                    status: 'active',
                    dateCreated: '2024-10-19',
                    totalDonations: 8.75,
                    foundCount: 0,
                    findEvents: []
                },
                {
                    id: 4,
                    artistId: 1,
                    artistName: 'Sarah Martinez',
                    title: 'Autumn Feather',
                    story: 'Hawk feather painted with fall colors from Central Park. Left it where nature lovers gather.',
                    photoUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&h=1600&fit=crop',
                    latitude: 40.7829,
                    longitude: -73.9654,
                    locationType: 'Park',
                    locationName: 'Central Park Bow Bridge',
                    status: 'found',
                    dateCreated: '2024-10-16',
                    findDate: '2024-10-22',
                    finderMessage: 'My daughter loved finding this! She\'s inspired to create her own art now.',
                    totalDonations: 25.00,
                    foundCount: 1,
                    findEvents: [
                        {
                            id: 2,
                            finderName: 'Jennifer M.',
                            message: 'My daughter loved finding this! She\'s inspired to create her own art now.',
                            findDate: '2024-10-22',
                            donated: true
                        }
                    ]
                },
                {
                    id: 5,
                    artistId: 2,
                    artistName: 'James River',
                    title: 'Coffee Shop Companion',
                    story: 'Small river rock painted as a tiny succulent. Perfect companion for your morning coffee ritual.',
                    photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=400&fit=crop',
                    latitude: 47.6062,
                    longitude: -122.3321,
                    locationType: 'Coffee Shop',
                    locationName: 'Pike Place Coffee, Seattle',
                    status: 'active',
                    dateCreated: '2024-10-21',
                    totalDonations: 0,
                    foundCount: 0,
                    findEvents: []
                }
            ],
            locations: [
                {
                    id: 1,
                    name: 'Westside Coffee',
                    address: '123 West St',
                    city: 'Brooklyn',
                    state: 'NY',
                    latitude: 40.7589,
                    longitude: -73.9851,
                    followerCount: 234,
                    activeDropCount: 12,
                    totalDropCount: 18,
                    trending: true,
                    distance: '0.3 miles',
                    featuredPhotos: [
                        'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop'
                    ],
                    locationPhoto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
                    recentDrops: [1]
                },
                {
                    id: 2,
                    name: 'Central Park',
                    address: 'Central Park',
                    city: 'New York',
                    state: 'NY',
                    latitude: 40.7829,
                    longitude: -73.9654,
                    followerCount: 456,
                    activeDropCount: 28,
                    totalDropCount: 45,
                    trending: true,
                    distance: '1.2 miles',
                    featuredPhotos: [
                        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop'
                    ],
                    locationPhoto: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&h=600&fit=crop',
                    recentDrops: [4]
                },
                {
                    id: 3,
                    name: 'Pike Place Coffee',
                    address: '1st Ave',
                    city: 'Seattle',
                    state: 'WA',
                    latitude: 47.6062,
                    longitude: -122.3321,
                    followerCount: 189,
                    activeDropCount: 15,
                    totalDropCount: 23,
                    trending: false,
                    distance: '1847 miles',
                    featuredPhotos: [
                        'https://images.unsplash.com/photo-1611688270284-b84259aa2d3c?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop'
                    ],
                    locationPhoto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop',
                    recentDrops: [5]
                },
                {
                    id: 4,
                    name: 'Red Rock Trail',
                    address: 'Trail Head',
                    city: 'Sedona',
                    state: 'AZ',
                    latitude: 34.8697,
                    longitude: -111.7610,
                    followerCount: 312,
                    activeDropCount: 22,
                    totalDropCount: 35,
                    trending: true,
                    distance: '1654 miles',
                    featuredPhotos: [
                        'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1611688270284-b84259aa2d3c?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=400&fit=crop'
                    ],
                    locationPhoto: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop',
                    recentDrops: [2]
                },
                {
                    id: 5,
                    name: 'Riverside Books',
                    address: 'River St',
                    city: 'Portland',
                    state: 'OR',
                    latitude: 45.5152,
                    longitude: -122.6784,
                    followerCount: 167,
                    activeDropCount: 9,
                    totalDropCount: 14,
                    trending: false,
                    distance: '2000 miles',
                    featuredPhotos: [
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=400&h=400&fit=crop',
                        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop'
                    ],
                    locationPhoto: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop',
                    recentDrops: [3]
                }
            ],
            follows: [],
            locationTypes: ['Coffee Shop', 'Bookstore', 'Park', 'Trail', 'Plaza', 'Mall', 'Library', 'Other'],
            donationPresets: [1, 3, 5, 10],
            platformCommission: 0.05
        };

        // ============================================
        // MAIN APP CONTROLLER
        // ============================================
        
        const app = {
            init() {
                this.requestLocationPermission();
                this.showPage('landing');
                this.updateNav();
            },

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
                const R = 3959; // Earth's radius in miles
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                return distance;
            },

            formatDistance(distance) {
                if (distance < 0.1) return 'Less than 0.1 miles away';
                if (distance < 1) return `${distance.toFixed(1)} miles away`;
                return `${Math.round(distance)} miles away`;
            },

            showPage(page, data = {}) {
                appState.currentPage = page;
                const appContainer = document.getElementById('app');
                
                switch(page) {
                    case 'landing':
                        appContainer.innerHTML = this.renderLanding();
                        setTimeout(() => this.initLandingMap(), 200);
                        break;
                    case 'artist-login':
                        appContainer.innerHTML = this.renderArtistLogin();
                        break;
                    case 'artist-signup':
                        appContainer.innerHTML = this.renderArtistSignup();
                        break;
                    case 'home':
                        appContainer.innerHTML = this.renderHome();
                        break;
                    case 'browse-map':
                        appContainer.innerHTML = this.renderBrowseMap();
                        setTimeout(() => this.initBrowseMap(), 300);
                        break;
                    case 'artist-dashboard':
                        appContainer.innerHTML = this.renderArtistDashboard();
                        break;
                    case 'drop-new-art':
                        appContainer.innerHTML = this.renderDropNewArt();
                        setTimeout(() => this.initDropLocationMap(), 300);
                        break;
                    case 'my-drops':
                        appContainer.innerHTML = this.renderMyDrops();
                        break;
                    case 'qr-tag-generator':
                        appContainer.innerHTML = this.renderQRTagGenerator(data.dropId);
                        setTimeout(() => this.generateQRCode(data.dropId), 200);
                        break;
                    case 'art-story':
                        appContainer.innerHTML = this.renderArtStory(data.dropId);
                        setTimeout(() => this.initArtStoryMap(data.dropId), 300);
                        break;
                    case 'found-confirmation':
                        appContainer.innerHTML = this.renderFoundConfirmation(data.dropId);
                        break;
                    case 'donation-flow':
                        appContainer.innerHTML = this.renderDonationFlow(data.dropId);
                        break;
                    case 'thank-you':
                        appContainer.innerHTML = this.renderThankYou(data.dropId, data.amount);
                        break;
                    case 'how-it-works':
                        appContainer.innerHTML = this.renderHowItWorks();
                        break;
                    case 'about':
                        appContainer.innerHTML = this.renderAbout();
                        break;
                    case 'contact':
                        appContainer.innerHTML = this.renderContact();
                        break;
                    case 'edit-profile':
                        appContainer.innerHTML = this.renderEditProfile();
                        break;
                    case 'finder-login':
                        appContainer.innerHTML = this.renderFinderLogin();
                        break;
                    case 'finder-signup':
                        appContainer.innerHTML = this.renderFinderSignup();
                        break;
                    case 'feed':
                        appContainer.innerHTML = this.renderFeed();
                        break;
                    case 'my-collection':
                        appContainer.innerHTML = this.renderMyCollection();
                        break;
                    case 'finder-profile':
                        appContainer.innerHTML = this.renderFinderProfile(data.finderId);
                        break;
                    case 'artist-profile':
                        appContainer.innerHTML = this.renderArtistProfile(data.artistId);
                        setTimeout(() => this.initArtistMapPreview(data.artistId), 300);
                        break;
                    case 'popular-locations':
                        appContainer.innerHTML = this.renderPopularLocations();
                        break;
                    case 'location-detail':
                        appContainer.innerHTML = this.renderLocationDetail(data.locationId);
                        break;
                }
                
                this.updateNav();
                window.scrollTo(0, 0);
            },

            updateNav() {
                const bottomNav = document.getElementById('bottomNav');
                const footer = document.getElementById('mainFooter');
                
                footer.classList.remove('hidden');
                
                if (!appState.currentUser) {
                    // Not logged in - show HOME, MAP, POPULAR, ACCOUNT (login)
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
                        <button onclick="app.showPage('finder-login')">
                            <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>ACCOUNT</span>
                        </button>
                    `;
                } else if (appState.currentUser.userType === 'finder') {
                    // Finder logged in - show FEED, MAP, POPULAR, ACCOUNT
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
                        <button onclick="app.showPage('my-collection')">
                            <svg class="icon icon-nav" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>ACCOUNT</span>
                        </button>
                    `;
                } else {
                    // Artist logged in - show HOME, MAP, POPULAR, ACCOUNT
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

            logout() {
                appState.currentUser = null;
                this.showPage('landing');
                this.showToast('Logged out successfully');
            },

            // ============================================
            // RENDER METHODS
            // ============================================

            renderLanding() {
                const recentDrops = appState.artDrops.slice(0, 6);
                
                // Get nearby art if location available
                let nearbySection = '';
                if (appState.userLocation) {
                    const dropsWithDistance = appState.artDrops
                        .filter(d => d.status === 'active')
                        .map(drop => ({
                            ...drop,
                            distance: this.calculateDistance(
                                appState.userLocation.latitude,
                                appState.userLocation.longitude,
                                drop.latitude,
                                drop.longitude
                            )
                        }))
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 3);
                    
                    if (dropsWithDistance.length > 0) {
                        nearbySection = `
                            <div class="container" style="margin-bottom: 5rem;">
                                <h2 style="text-align: center; margin-bottom: 3rem; color: var(--primary-black); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <svg class="icon icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="6"/>
                                <circle cx="12" cy="12" r="2"/>
                            </svg>
                            Art Near You
                        </h2>
                                <div class="grid grid-3">
                                    ${dropsWithDistance.map(drop => `
                                        <div class="card" style="cursor: pointer;" onclick="app.showPage('art-story', {dropId: ${drop.id}})">
                                            <img src="${drop.photoUrl}" alt="${drop.title}" class="card-image">
                                            <div class="card-content">
                                                <span class="badge badge-active">📍 ${this.formatDistance(drop.distance)}</span>
                                                <h3 class="card-title">${drop.title}</h3>
                                                <p class="card-story">${drop.story.substring(0, 80)}...</p>
                                                <div class="card-meta">
                                                    <div style="font-size: 0.9rem; color: var(--text-gray);">${drop.locationName}</div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }
                }
                
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
                    
                    ${nearbySection}
                    
                    <!-- Trending Locations Section -->
                    <div class="container" style="margin-bottom: 5rem;">
                        <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary-black); font-size: clamp(1.25rem, 4vw, 2rem); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                            <svg class="icon icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            Trending Locations
                        </h2>
                        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                            ${appState.locations.filter(l => l.trending).slice(0, 3).map(location => `
                                <div class="card card-interactive" onclick="app.showPage('location-detail', {locationId: ${location.id}})">
                                    ${location.featuredPhotos && location.featuredPhotos.length > 0 ? `
                                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; height: 200px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; overflow: hidden;">
                                            ${location.featuredPhotos.slice(0, 2).map(photo => `
                                                <img src="${photo}" alt="${location.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                            `).join('')}
                                            ${location.featuredPhotos.length < 2 ? '<div style="background: var(--light-gray);"></div>' : ''}
                                        </div>
                                    ` : `
                                        <div style="height: 200px; background: var(--light-gray); display: flex; align-items: center; justify-content: center; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;">
                                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                        </div>
                                    `}
                                    <div style="padding: 0;">
                                        <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${location.name}</h3>
                                        <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 1rem;">${location.city}, ${location.state}</p>
                                        <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: var(--text-gray); margin-bottom: 1rem;">
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                                    <circle cx="9" cy="7" r="4"/>
                                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                                                </svg>
                                                ${location.followerCount}
                                            </span>
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                                ${location.activeDropCount} drops
                                            </span>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem;">
                                            <button class="btn btn-primary" onclick="app.toggleFollowLocation(${location.id}); event.stopPropagation();" style="flex: 1; min-height: 40px; font-size: 0.85rem; padding: 0.5rem;">Follow</button>
                                            <button class="btn btn-secondary" onclick="window.open('https://maps.google.com/?q=${location.latitude},${location.longitude}', '_blank'); event.stopPropagation();" style="flex: 1; min-height: 40px; font-size: 0.85rem; padding: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                                                    <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                        <circle cx="12" cy="10" r="3"/>
                                                        <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                                                    </svg>
                                                    Map
                                                </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div style="text-align: center;">
                            <button class="btn btn-primary" onclick="app.showPage('popular-locations')" style="min-height: 48px;">View All Popular Locations</button>
                        </div>
                    </div>
                    
                    <div class="container">
                        <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary-black); font-size: clamp(1.5rem, 5vw, 2.5rem);">Recent Finds</h2>
                        <div class="grid grid-3">
                            ${recentDrops.map(drop => this.renderDropCard(drop)).join('')}
                        </div>
                        
                        <div style="text-align: center; margin: 3rem 0; padding: 0 1rem;">
                            <div style="background: var(--light-gray); padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
                                <h3 style="color: var(--primary-black); margin-bottom: 1rem; font-size: clamp(1.25rem, 4vw, 1.5rem);">📍 How It Works</h3>
                                <div style="display: grid; gap: 1rem; text-align: left; max-width: 600px; margin: 0 auto;">
                                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                        <span style="background: var(--primary-black); color: var(--primary-white); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600;">1</span>
                                        <p style="margin: 0; color: var(--text-gray);">Check the map for nearby art</p>
                                    </div>
                                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                        <span style="background: var(--primary-black); color: var(--primary-white); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600;">2</span>
                                        <p style="margin: 0; color: var(--text-gray);">Visit the location and find the art</p>
                                    </div>
                                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                        <span style="background: var(--primary-black); color: var(--primary-white); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600;">3</span>
                                        <p style="margin: 0; color: var(--text-gray);">Scan the QR code to read the story</p>
                                    </div>
                                    <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                        <span style="background: var(--primary-black); color: var(--primary-white); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 600;">4</span>
                                        <p style="margin: 0; color: var(--text-gray);">Thank the artist with a donation</p>
                                    </div>
                                </div>
                            </div>
                            <h3 style="color: var(--primary-black); margin-bottom: 1rem; font-size: clamp(1.25rem, 4vw, 1.5rem);">Turn any walk into a treasure hunt</h3>
                            <p style="color: var(--text-gray); max-width: 600px; margin: 0 auto 2rem; line-height: 1.8;">Artists leave beautiful painted natural objects in coffee shops, parks, bookstores, and trails. Scan the QR code to discover the story and thank the artist.</p>
                            <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 48px;">Explore the Map</button>
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
                        
                        <!-- Real SSO Buttons -->
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
                            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px; font-size: 16px;">Login</button>
                        </form>
                        <p style="text-align: center; margin-top: 3rem; color: var(--text-gray);">
                            New artist? <a href="#" onclick="app.showPage('artist-signup'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Sign Up</a>
                        </p>
                        <div style="margin-top: 3rem; padding: 2rem; background: var(--light-gray); font-size: 0.9rem; line-height: 1.8;">
                            <strong>Demo Accounts:</strong><br>
                            sarah@example.com / password<br>
                            james@example.com / password<br>
                            alex@example.com / password
                        </div>
                    </div>
                `;
            },

            renderArtistSignup() {
                return `
                    <div class="auth-container">
                        <h2>Join ArtDrops</h2>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 4rem;">Start sharing your art with the world</p>
                        <form onsubmit="app.handleArtistSignup(event)">
                            <div class="form-group" style="text-align: center;">
                                <label style="text-align: center; display: block;">Profile Picture</label>
                                <div style="margin: 1rem auto;">
                                    <img id="signupProfilePreview" src="https://via.placeholder.com/150/000000/FFFFFF?text=+" alt="Profile Preview" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-gray); display: block; margin: 0 auto 1rem;">
                                    <input type="file" id="signupProfileInput" accept="image/jpeg,image/png,image/gif" style="display: none;" onchange="app.handleProfilePhotoPreview(event, 'signupProfilePreview')">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('signupProfileInput').click()" style="min-height: 44px; font-size: 0.9rem;">Upload Photo</button>
                                    <p style="font-size: 0.8rem; color: var(--text-gray); margin-top: 0.5rem;">JPG, PNG, or GIF (max 5MB)</p>
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
                            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px; font-size: 16px;">Create Account</button>
                        </form>
                        <p style="text-align: center; margin-top: 1.5rem; color: var(--text-light);">
                            Already have an account? <a href="#" onclick="app.showPage('artist-login'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Login</a>
                        </p>
                    </div>
                `;
            },

            renderHome() {
                if (!appState.currentUser) {
                    this.showPage('landing');
                    return;
                }
                
                return `
                    <div class="container">
                        <div class="hero" style="padding: 3rem 2rem;">
                            <h1 style="font-size: 2.5rem; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
                                Welcome back, ${appState.currentUser.name}!
                                <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                                </svg>
                            </h1>
                            <p style="font-size: 1.1rem;">Ready to drop some art into the world?</p>
                        </div>
                        
                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">${appState.currentUser.activeDrops}</div>
                                <div class="stat-label">Active Drops</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">$${appState.currentUser.totalDonations.toFixed(2)}</div>
                                <div class="stat-label">Total Donations</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${this.getMyFoundCount()}</div>
                                <div class="stat-label">Times Found</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin: 3rem 0; flex-wrap: wrap; justify-content: center;">
                            <button class="btn btn-primary btn-large" onclick="app.showPage('drop-new-art')" style="flex: 1; min-width: 200px; max-width: 300px;">Drop New Art</button>
                            <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 200px; max-width: 300px;">View My Drops</button>
                            <button class="btn btn-secondary" onclick="app.showPage('browse-map')" style="flex: 1; min-width: 200px; max-width: 300px;">Browse Map</button>
                        </div>
                        
                        <h2 style="margin: 2rem 0 1rem;">Recent Activity</h2>
                        ${this.renderRecentActivity()}
                    </div>
                `;
            },

            renderBrowseMap() {
                return `
                    <div id="map-page">
                        <div class="map-container">
                            <div id="browseMap"></div>
                        </div>
                        
                        <!-- Floating Filter Chips -->
                        <div style="position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); z-index: 1000; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; padding: 0 1rem;">
                            <button class="btn btn-secondary" onclick="app.filterMapMarkers('all')" style="min-height: 36px; padding: 0.5rem 1rem; font-size: 0.85rem; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">All</button>
                            <button class="btn btn-secondary" onclick="app.filterMapMarkers('active')" style="min-height: 36px; padding: 0.5rem 1rem; font-size: 0.85rem; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">Active</button>
                            <button class="btn btn-secondary" onclick="app.filterMapMarkers('found')" style="min-height: 36px; padding: 0.5rem 1rem; font-size: 0.85rem; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">Found</button>
                        </div>
                    </div>
                        
                        <div style="margin-top: 3rem; padding: 2rem 1.5rem; background: var(--light-gray);">
                            <h3 style="margin-bottom: 2rem; text-align: center;">How to Find Art</h3>
                            <ol style="color: var(--text-gray); line-height: 2.2;">
                                <li>Check the map for art drops near you (Active or Found status)</li>
                                <li>Visit the location and look for the painted natural object with a QR code tag</li>
                                <li>Scan the QR code to see the art's story</li>
                                <li>Click "I Found This!" and optionally leave a message</li>
                                <li>Consider thanking the artist with a small donation</li>
                            </ol>
                        </div>
                    </div>
                `;
            },

            renderArtistDashboard() {
                if (!appState.currentUser) {
                    this.showPage('artist-login');
                    return;
                }
                
                const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
                const activeDrops = myDrops.filter(d => d.status === 'active');
                const foundDrops = myDrops.filter(d => d.status === 'found');
                
                return `
                    <div class="container">
                        <h1 style="margin-bottom: 0.5rem;">Artist Dashboard</h1>
                        <p style="color: var(--text-gray); margin-bottom: 2rem; font-size: 1rem;">Manage your art drops and view donations</p>
                        
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
                                <div class="stat-value">$${appState.currentUser.totalDonations.toFixed(2)}</div>
                                <div class="stat-label">Total Donations</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin: 3rem 0; flex-wrap: wrap; justify-content: center;">
                            <button class="btn btn-primary" onclick="app.showPage('drop-new-art')" style="flex: 1; min-width: 150px; max-width: 250px;">Drop New Art</button>
                            <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 150px; max-width: 250px;">View All Drops</button>
                            <button class="btn btn-secondary" onclick="app.showPage('edit-profile')" style="flex: 1; min-width: 150px; max-width: 250px;">Edit Profile</button>
                        </div>
                        
                        <h2 style="margin-top: 5rem;">Recent Donations &amp; Messages</h2>
                        ${this.renderRecentDonations()}
                    </div>
                `;
            },

            renderDropNewArt() {
                if (!appState.currentUser) {
                    this.showPage('artist-login');
                    return;
                }
                
                return `
                    <div class="container" style="max-width: 800px;">
                        <h1>Drop New Art</h1>
                        <p style="color: var(--text-gray); margin-bottom: 4rem; font-size: 1.1rem;">Share your painted natural treasure with the world</p>
                        
                        <div class="card" style="margin-bottom: 2rem;">
                            <div class="card-content" style="padding: 2rem;">
                                <form onsubmit="app.handleDropNewArt(event)">
                                    <div class="form-group">
                                        <label>Photo URL *</label>
                                        <input type="url" class="form-control" name="photoUrl" required placeholder="https://example.com/photo.jpg">
                                        <small style="color: var(--text-gray); display: block; margin-top: 0.5rem;">Use an image hosting service or direct link</small>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Title *</label>
                                        <input type="text" class="form-control" name="title" required placeholder="Give your art a memorable name">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Story * (Keep it brief and meaningful)</label>
                                        <textarea class="form-control" name="story" required placeholder="Tell the story: Where did you find this? What inspired you to paint it?"></textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Location Type *</label>
                                        <select class="form-control" name="locationType" required>
                                            <option value="">Select location type</option>
                                            ${appState.locationTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Location Name *</label>
                                        <input type="text" class="form-control" name="locationName" required placeholder="e.g., Central Perk Cafe, NYC">
                                    </div>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                                        <div class="form-group">
                                            <label>Latitude *</label>
                                            <input type="number" class="form-control" name="latitude" id="dropLatitude" required step="any" placeholder="40.7589" style="min-height: 48px;">
                                        </div>
                                    </div>
                                    <div style="display: grid; grid-template-columns: 1fr; gap: 1rem;">
                                        <div class="form-group">
                                            <label>Longitude *</label>
                                            <input type="number" class="form-control" name="longitude" id="dropLongitude" required step="any" placeholder="-73.9851" style="min-height: 48px;">
                                        </div>
                                    </div>
                                    
                                    <button type="button" class="btn btn-secondary" onclick="app.useCurrentLocation()" style="margin-bottom: 2rem; width: 100%; min-height: 48px; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="6"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                        Use My Current Location
                    </button>
                                    
                                    <div class="map-container" style="height: 300px; margin-bottom: 1.5rem;">
                                        <div id="dropLocationMap"></div>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px; font-size: 18px;">Create &amp; Generate QR Tag</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderMyDrops() {
                if (!appState.currentUser) {
                    this.showPage('artist-login');
                    return;
                }
                
                const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
                
                return `
                    <div class="container">
                        <h1>My Drops</h1>
                        <p style="color: var(--text-light); margin-bottom: 2rem;">Your art in the wild</p>
                        
                        ${myDrops.length > 0 ? `
                            <div class="grid grid-3" style="animation: fadeInUp 0.5s ease-out;">
                                ${myDrops.map(drop => `
                                    <div class="card">
                                        <img src="${drop.photoUrl}" alt="${drop.title}" class="card-image">
                                        <div class="card-content">
                                            <span class="badge badge-${drop.status === 'active' ? 'active' : 'found'}">
                                                ${drop.status === 'active' ? '🟢 Active' : '🟠 Found'}
                                            </span>
                                            <span class="badge badge-location" style="margin-left: 0.5rem;">${drop.locationType}</span>
                                            <h3 class="card-title">${drop.title}</h3>
                                            <p class="card-story">${drop.story.substring(0, 100)}...</p>
                                            <div class="card-meta">
                                                <div style="font-size: 0.9rem; color: var(--text-gray);">Location: ${drop.locationName}</div>
                                            </div>
                                            <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-gray); font-size: 0.9rem;">
                                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                                    <span style="color: var(--text-gray);">Donations:</span>
                                                    <span style="color: var(--sage-green); font-weight: 600;">$${drop.totalDonations.toFixed(2)}</span>
                                                </div>
                                                <div style="display: flex; justify-content: space-between;">
                                                    <span style="color: var(--text-gray);">Found:</span>
                                                    <span style="font-weight: 600;">${drop.foundCount} times</span>
                                                </div>
                                            </div>
                                            <div style="display: flex; gap: 1.5rem; margin-top: 3rem;">
                                                <button class="btn btn-primary" onclick="app.showPage('art-story', {dropId: ${drop.id}})" style="flex: 1;">View</button>
                                                <button class="btn btn-secondary" onclick="app.showPage('qr-tag-generator', {dropId: ${drop.id}})" style="flex: 1;">QR Tag</button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="8" r="7"/>
                                        <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
                                    </svg>
                                </div>
                                <div class="empty-state-title">No art drops yet</div>
                                <p class="empty-state-text">Be the first to drop art and spread joy in your community</p>
                                <button class="btn btn-primary" onclick="app.showPage('drop-new-art')" style="min-height: 48px;">Drop Your First Piece</button>
                            </div>
                        `}
                    </div>
                `;
            },

            renderQRTagGenerator(dropId) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                const qrUrl = `https://artdrops.com/art/${drop.id}`;
                
                return `
                    <div class="container" style="max-width: 900px;">
                        <h1 style="text-align: center;">Branded QR Tag Generator</h1>
                        <p style="color: var(--text-gray); margin-bottom: 3rem; font-size: 1.1rem; text-align: center;">Professional QR codes for maximum engagement</p>
                        
                        <div class="card">
                            <div class="card-content" style="padding: 2rem;">
                                <div style="text-align: center; margin-bottom: 2rem; padding: 2rem; border: 2px solid var(--border-gray); background: var(--primary-white);">
                                    <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 2rem; letter-spacing: 0.1em;">ARTDROPS</div>
                                    <div id="qrcode" style="margin: 2rem auto;"></div>
                                    <div style="font-size: 1.2rem; font-weight: 600; margin: 2rem 0 0.5rem; color: var(--primary-black);">${drop.title}</div>
                                    <div style="font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1.5rem;">by ${drop.artistName}</div>
                                    <div style="font-size: 0.85rem; font-style: italic; color: var(--text-gray);">Scan to unlock the story</div>
                                </div>
                                
                                <h3 style="margin: 3rem 0 2rem; text-align: center;">Choose Your Template</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                                    <div style="border: 1px solid var(--border-gray); padding: 1.5rem; text-align: center; cursor: pointer;" onclick="app.downloadQRTemplate('sticker', ${dropId})">
                                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">Sticker</div>
                                        <div style="font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem;">2x2 inches</div>
                                        <div style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.6; margin-bottom: 1.5rem;">Compact weatherproof design for rocks, shells, small items</div>
                                        <button class="btn btn-secondary" style="width: 100%; font-size: 16px; min-height: 44px;">Download PNG</button>
                                    </div>
                                    <div style="border: 1px solid var(--border-gray); padding: 2rem; text-align: center; cursor: pointer;" onclick="app.downloadQRTemplate('card', ${dropId})">
                                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">Card</div>
                                        <div style="font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem;">3x4 inches</div>
                                        <div style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.6; margin-bottom: 1.5rem;">Laminated tag with hole for sticks, driftwood, larger items</div>
                                        <button class="btn btn-secondary" style="width: 100%; font-size: 16px; min-height: 44px;">Download PNG</button>
                                    </div>
                                    <div style="border: 1px solid var(--border-gray); padding: 2rem; text-align: center; cursor: pointer;" onclick="app.downloadQRTemplate('bookmark', ${dropId})">
                                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">Bookmark</div>
                                        <div style="font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem;">2x6 inches</div>
                                        <div style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.6; margin-bottom: 1.5rem;">Slim vertical design for books, libraries, tall items</div>
                                        <button class="btn btn-secondary" style="width: 100%; font-size: 16px; min-height: 44px;">Download PNG</button>
                                    </div>
                                    <div style="border: 1px solid var(--border-gray); padding: 2rem; text-align: center; cursor: pointer;" onclick="app.downloadQRTemplate('poster', ${dropId})">
                                        <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">Poster</div>
                                        <div style="font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem;">8.5x11 inches</div>
                                        <div style="font-size: 0.85rem; color: var(--text-gray); line-height: 1.6; margin-bottom: 1.5rem;">Display format for events, exhibitions</div>
                                        <button class="btn btn-secondary" style="width: 100%; font-size: 16px; min-height: 44px;">Download PNG</button>
                                    </div>
                                </div>
                                
                                <div class="alert alert-info" style="margin-bottom: 2rem;">
                                    <strong>Print Instructions:</strong><br>
                                    • Use high-quality paper or sticker sheets<br>
                                    • For outdoor drops, laminate or use waterproof materials<br>
                                    • Test QR code before attaching to your art<br>
                                    • Attach securely with strong adhesive or string
                                </div>
                                
                                <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap;">
                                    <button class="btn btn-primary" onclick="window.print()" style="flex: 1; min-width: 150px; min-height: 48px;">Print Current View</button>
                                    <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 150px; min-height: 48px;">Back to My Drops</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderArtistProfile(artistId) {
                const artist = appState.artists.find(a => a.id === artistId);
                if (!artist) {
                    return '<div class="container"><p>Artist not found</p></div>';
                }
                
                const artistDrops = appState.artDrops.filter(d => d.artistId === artistId);
                const isFollowing = appState.currentUser && appState.follows.some(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'artist' && f.targetId === artistId
                );
                
                return `
                    <div class="container" style="max-width: 1200px;">
                        <!-- Artist Header -->
                        <div class="card" style="margin-bottom: 3rem;">
                            <div class="card-content" style="padding: 2rem;">
                                <div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
                                    <img src="${artist.profilePhoto}" alt="${artist.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-black);">
                                    <div style="flex: 1; min-width: 250px;">
                                        <h1 style="margin-bottom: 0.5rem;">${artist.name}</h1>
                                        <p style="color: var(--text-gray); margin-bottom: 1rem;">${artist.city || 'Artist'}</p>
                                        <p style="line-height: 1.8; margin-bottom: 1.5rem;">${artist.bio}</p>
                                        
                                        ${artist.instagram || artist.tiktok || artist.website ? `
                                            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
                                                ${artist.instagram ? `<a href="https://instagram.com/${artist.instagram.replace('@', '')}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Instagram</a>` : ''}
                                                ${artist.tiktok ? `<a href="https://tiktok.com/${artist.tiktok}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">TikTok</a>` : ''}
                                                ${artist.website ? `<a href="${artist.website}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Website</a>` : ''}
                                            </div>
                                        ` : ''}
                                        
                                        ${appState.currentUser ? `
                                            <button class="btn btn-${isFollowing ? 'secondary' : 'primary'}" onclick="app.toggleFollowArtist(${artist.id})" style="min-height: 48px; width: 100%; max-width: 300px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                                ${isFollowing ? 'Unfollow' : '<svg class="icon icon-small" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> Follow'}
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Stats -->
                        <div class="stats-grid" style="margin-bottom: 3rem;">
                            <div class="stat-card">
                                <div class="stat-value">${artist.followerCount || 0}</div>
                                <div class="stat-label">Followers</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${artistDrops.length}</div>
                                <div class="stat-label">Total Drops</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">$${artist.totalDonations.toFixed(2)}</div>
                                <div class="stat-label">Total Donations</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${artistDrops.filter(d => d.status === 'active').length}</div>
                                <div class="stat-label">Active Drops</div>
                            </div>
                        </div>
                        
                        <!-- Art Drops -->
                        <h2 style="margin-bottom: 2rem;">Art Drops (${artistDrops.length})</h2>
                        ${artistDrops.length > 0 ? `
                            <div class="grid grid-3">
                                ${artistDrops.map(drop => this.renderDropCard(drop)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">🎨</div>
                                <div class="empty-state-title">No art drops yet</div>
                                <p class="empty-state-text">This artist hasn't dropped any art yet</p>
                            </div>
                        `}
                        
                        <!-- Map Preview -->
                        ${artistDrops.length > 0 ? `
                            <div style="margin-top: 3rem;">
                                <h2 style="margin-bottom: 1rem;">All Drops on Map</h2>
                                <div class="map-container" style="height: 400px;">
                                    <div id="artistMapPreview"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            },
            
            renderArtStory(dropId) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                const artist = appState.artists.find(a => a.id === drop.artistId);
                const location = appState.locations.find(l => l.name === drop.locationName) || {};
                
                // Check if user follows this artist
                const isFollowingArtist = appState.currentUser && appState.follows.some(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'artist' && f.targetId === artist.id
                );
                
                // Check if user follows this location
                const isFollowingLocation = appState.currentUser && location.id && appState.follows.some(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'location' && f.targetId === location.id
                );
                
                // Calculate distance if user location available
                let distanceInfo = '';
                if (appState.userLocation) {
                    const distance = this.calculateDistance(
                        appState.userLocation.latitude,
                        appState.userLocation.longitude,
                        drop.latitude,
                        drop.longitude
                    );
                    distanceInfo = `<p style="font-size: 0.9rem; margin-bottom: 1rem;"><strong>📍 Distance:</strong> ${this.formatDistance(distance)}</p>`;
                }
                
                // Social sharing section
                const shareUrl = `https://artdrops.com/art/${drop.id}`;
                const shareText = `I just found this hidden art by ${drop.artistName} at ${drop.locationName}! Discover more at ArtDrops.`;
                const shareSection = `
                    <div style="margin-top: 3rem; padding: 2rem; background: var(--light-gray);">
                        <h3 style="margin-bottom: 1.5rem; text-align: center;">Share This Discovery</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
                            <button class="btn btn-secondary" onclick="app.shareArt('copy', '${shareUrl}')" style="min-height: 44px; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 4px;">
                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                                </svg>
                                Copy Link
                            </button>
                            <button class="btn btn-secondary" onclick="app.shareArt('instagram', '${shareUrl}', '${encodeURIComponent(shareText)}')" style="min-height: 44px; font-size: 0.85rem;">Instagram</button>
                            <button class="btn btn-secondary" onclick="app.shareArt('facebook', '${shareUrl}', '${encodeURIComponent(shareText)}')" style="min-height: 44px; font-size: 0.85rem;">Facebook</button>
                            <button class="btn btn-secondary" onclick="app.shareArt('twitter', '${shareUrl}', '${encodeURIComponent(shareText)}')" style="min-height: 44px; font-size: 0.85rem;">Twitter</button>
                            <button class="btn btn-secondary" onclick="app.shareArt('email', '${shareUrl}', '${encodeURIComponent(shareText)}')" style="min-height: 44px; font-size: 0.85rem;">Email</button>
                            <button class="btn btn-secondary" onclick="app.shareArt('sms', '${shareUrl}', '${encodeURIComponent(shareText)}')" style="min-height: 44px; font-size: 0.85rem;">SMS</button>
                        </div>
                    </div>
                `;
                
                return `
                    <div class="container" style="max-width: 1200px;">
                        <div class="art-detail-grid" style="align-items: start;">
                            <div style="position: relative;">
                                <img src="${drop.photoUrl}" alt="${drop.title}" class="art-image-large" style="display: block;">
                                
                                <!-- Image Actions for Desktop -->
                                <div style="position: absolute; top: 1rem; right: 1rem; display: none;" class="desktop-only">
                                    <button class="action-btn" onclick="app.openShareOverlay(${drop.id})" title="Share" style="margin-bottom: 0.5rem;">
                                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="18" cy="5" r="3"/>
                                            <circle cx="6" cy="12" r="3"/>
                                            <circle cx="18" cy="19" r="3"/>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="art-info">
                                <span class="badge badge-${drop.status === 'active' ? 'active' : 'found'}">
                                    ${drop.status === 'active' ? 'Active' : 'Found'}
                                </span>
                                <h1 style="margin: 1rem 0; font-size: 2rem;">${drop.title}</h1>
                                
                                <div class="artist-section" style="display: block; cursor: pointer;" onclick="app.showPage('artist-profile', {artistId: ${artist.id}})">
                                    <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem;">
                                        ${artist.profilePhoto ? `<img src="${artist.profilePhoto}" alt="${artist.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-black);">` : ''}
                                        <div>
                                            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">by ${drop.artistName}</div>
                                            ${artist.city ? `<div style="font-size: 0.85rem; color: var(--text-gray); margin-bottom: 0.5rem;">${artist.city}</div>` : ''}
                                            <div style="font-size: 0.9rem; color: var(--text-gray); line-height: 1.6;">${artist.bio}</div>
                                        </div>
                                    </div>
                                    ${artist.instagram || artist.tiktok || artist.facebook || artist.website ? `
                                        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; padding-top: 1.5rem; border-top: 1px solid var(--border-gray);">
                                            ${artist.instagram ? `<a href="https://instagram.com/${artist.instagram.replace('@', '')}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Instagram</a>` : ''}
                                            ${artist.tiktok ? `<a href="https://tiktok.com/${artist.tiktok}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">TikTok</a>` : ''}
                                            ${artist.facebook ? `<a href="${artist.facebook}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Facebook</a>` : ''}
                                            ${artist.website ? `<a href="${artist.website}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Website</a>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <h3 style="margin-top: 3rem; margin-bottom: 1.5rem;">The Story</h3>
                                <p style="color: var(--primary-black); line-height: 1.8; margin-bottom: 3rem;">${drop.story}</p>
                                
                                <div style="background: var(--light-gray); padding: 2rem; margin: 3rem 0;">
                                    <p style="font-size: 0.9rem; margin-bottom: 1rem;"><strong>Location:</strong> ${drop.locationName}</p>
                                    ${location.id ? `
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                            <span style="font-size: 0.85rem; color: var(--text-gray);">${location.followerCount} followers</span>
                                            ${appState.currentUser ? `
                                                <button class="btn btn-${isFollowingLocation ? 'secondary' : 'primary'}" onclick="app.toggleFollowLocation(${location.id})" style="padding: 0.5rem 1rem; font-size: 0.85rem; min-height: 36px;">
                                                    ${isFollowingLocation ? 'Unfollow Location' : '⭐ Follow Location'}
                                                </button>
                                            ` : ''}
                                        </div>
                                    ` : ''}
                                    ${distanceInfo}
                                    <p style="font-size: 0.9rem; margin-bottom: 1rem;"><strong>Type:</strong> ${drop.locationType}</p>
                                    <p style="font-size: 0.9rem; margin: 0;"><strong>Dropped:</strong> ${new Date(drop.dateCreated).toLocaleDateString()}</p>
                                </div>
                                
                                ${appState.currentUser && artist ? `
                                    <button class="btn btn-${isFollowingArtist ? 'secondary' : 'primary'}" onclick="app.toggleFollowArtist(${artist.id})" style="width: 100%; margin-bottom: 1rem; min-height: 48px;">
                                        ${isFollowingArtist ? 'Unfollow Artist' : '⭐ Follow Artist'}
                                    </button>
                                ` : ''}
                                
                                ${drop.status === 'active' ? `
                                    <button class="btn btn-primary btn-large" onclick="app.showPage('found-confirmation', {dropId: ${drop.id}})" style="width: 100%; margin-bottom: 1rem; min-height: 56px; font-size: 18px;">I Found This!</button>
                                ` : `
                                    <div class="alert alert-info" style="margin-bottom: 1rem;">
                                        This art has been found! It might still be at the location.
                                    </div>
                                `}
                                
                                <button class="btn btn-secondary" onclick="app.showPage('donation-flow', {dropId: ${drop.id}})" style="width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                    Thank the Artist
                </button>
                            </div>
                        </div>
                        
                        <!-- Related Art from Same Artist -->
                        ${appState.artDrops.filter(d => d.artistId === drop.artistId && d.id !== drop.id).length > 0 ? `
                            <div style="margin-top: 5rem;">
                                <h2 style="margin-bottom: 2rem; text-align: center;">More from ${drop.artistName}</h2>
                                <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                                    ${appState.artDrops.filter(d => d.artistId === drop.artistId && d.id !== drop.id).slice(0, 3).map(relatedDrop => this.renderDropCard(relatedDrop)).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${shareSection}
                        
                        <div style="margin-top: 5rem;">
                            <h2 style="margin-bottom: 1rem;">Location Map</h2>
                            <div class="map-container" style="height: 400px;">
                                <div id="artStoryMap"></div>
                            </div>
                        </div>
                        
                        ${drop.findEvents.length > 0 ? `
                            <div style="margin-top: 3rem;">
                                <h2 style="margin-bottom: 2rem; text-align: center;">Finder Messages</h2>
                                ${drop.findEvents.map(event => `
                                    <div class="finder-message">
                                        <strong>${event.finderName || 'Anonymous'}</strong> 
                                        ${event.donated ? '<span style="color: var(--sage-green);">💚</span>' : ''}
                                        <p style="margin: 0.5rem 0 0 0; color: var(--text-dark);">${event.message}</p>
                                        <p style="font-size: 0.85rem; color: var(--text-light); margin: 0.5rem 0 0 0;">${new Date(event.findDate).toLocaleDateString()}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            },

            renderFoundConfirmation(dropId) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                
                return `
                    <div class="container" style="max-width: 600px;">
                        <div class="card" style="margin-top: 2rem;">
                            <div class="card-content" style="padding: 2rem; text-align: center;">
                                <div style="font-size: clamp(2rem, 8vw, 3rem); margin-bottom: 2rem; font-weight: 600;">Congratulations!</div>
                                <h1 style="color: var(--primary-black); margin-bottom: 2rem;">You Found It!</h1>
                                <p style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 2rem;">You found <strong>${drop.title}</strong></p>
                                
                                <form onsubmit="app.handleFoundSubmit(event, ${drop.id})">
                                    <div class="form-group" style="text-align: left;">
                                        <label>Your Name (Optional)</label>
                                        <input type="text" class="form-control" name="finderName" placeholder="Anonymous">
                                    </div>
                                    
                                    <div class="form-group" style="text-align: left;">
                                        <label>Leave a Message for ${drop.artistName} (Optional)</label>
                                        <textarea class="form-control" name="message" placeholder="Share how this art made you feel..."></textarea>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-bottom: 1rem; min-height: 56px;">Submit Find</button>
                                </form>
                                
                                <div class="alert alert-success" style="text-align: left;">
                                    <strong>Consider thanking ${drop.artistName}</strong><br>
                                    Artists drop these treasures freely for you to discover. A small donation helps them create more art for everyone to enjoy.
                                </div>
                                
                                <button class="btn btn-secondary" onclick="app.showPage('art-story', {dropId: ${drop.id}})" style="width: 100%; min-height: 48px;">Back to Art Story</button>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderDonationFlow(dropId) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                
                return `
                    <div class="container" style="max-width: 600px;">
                        <div class="card" style="margin-top: 2rem;">
                            <div class="card-content" style="padding: 3rem;">
                                <h1 style="text-align: center; margin-bottom: 1rem;">Thank ${drop.artistName}</h1>
                                <p style="text-align: center; color: var(--text-gray); margin-bottom: 4rem; font-size: 1.1rem;">Your donation helps artists continue sharing their work</p>
                                
                                <div style="text-align: center; margin-bottom: 2rem;">
                                    <img src="${drop.photoUrl}" alt="${drop.title}" style="max-width: 200px; border: 1px solid var(--border-gray);">
                                    <h3 style="margin-top: 2rem; color: var(--primary-black);">${drop.title}</h3>
                                </div>
                                
                                <form onsubmit="app.handleDonation(event, ${drop.id})">
                                    <h3 style="margin-bottom: 2rem;">Choose an Amount</h3>
                                    <div class="donation-amounts">
                                        ${appState.donationPresets.map(amount => `
                                            <button type="button" class="donation-btn" onclick="app.selectDonationAmount(${amount})" data-amount="${amount}" style="min-height: 48px; touch-action: manipulation;">
                                                $${amount}
                                            </button>
                                        `).join('')}
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Or Enter Custom Amount</label>
                                        <input type="number" class="form-control" name="customAmount" id="customAmount" min="1" step="0.01" placeholder="Enter amount">
                                    </div>
                                    
                                    <div class="alert alert-info">
                                        <strong>💚 You keep:</strong> 0% (donation goes to artist)<br>
                                        <strong>🎨 Artist receives:</strong> 95% after platform fee (5%)
                                    </div>
                                    
                                    <div class="alert" style="background: #fff3cd; color: #856404; border: 1px solid #ffeeba;">
                                        Note: This is a demo. No real payment will be processed.
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px;">Complete Donation</button>
                                </form>
                                
                                <button class="btn btn-secondary" onclick="app.showPage('art-story', {dropId: ${drop.id}})" style="width: 100%; margin-top: 1rem; min-height: 48px;">Maybe Later</button>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderThankYou(dropId, amount) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                
                return `
                    <div class="container" style="max-width: 600px;">
                        <div class="card" style="margin-top: 2rem;">
                            <div class="card-content" style="padding: 2rem; text-align: center;">
                                <div style="font-size: clamp(2rem, 8vw, 3rem); margin-bottom: 2rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 1rem;">
                            <svg class="icon" style="width: 3rem; height: 3rem;" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Thank You!
                        </div>
                                <h1 style="color: var(--primary-black); margin-bottom: 2rem;">Donation Complete</h1>
                                <p style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 2rem;">Your $${amount.toFixed(2)} donation has been sent to ${drop.artistName}</p>
                                
                                <div style="background: var(--sandy-beige); padding: 1.5rem; border-radius: 12px; margin: 2rem 0;">
                                    <p style="margin: 0; color: var(--text-dark);">"${drop.story}"</p>
                                    <p style="margin-top: 1rem; color: var(--text-light); font-style: italic;">— ${drop.artistName}</p>
                                </div>
                                
                                <h3 style="margin: 5rem 0 2rem;">Share Your Discovery</h3>
                                <p style="color: var(--text-gray); margin-bottom: 3rem; font-size: 1.1rem;">Help spread the joy of art discovery</p>
                                
                                <div style="display: flex; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap;">
                                    <button class="btn btn-secondary" onclick="alert('Share functionality would open social media here')" style="flex: 1; min-width: 120px; min-height: 44px;">Share on Twitter</button>
                                    <button class="btn btn-secondary" onclick="alert('Share functionality would open social media here')" style="flex: 1; min-width: 120px; min-height: 44px;">Share on Facebook</button>
                                </div>
                                
                                <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="width: 100%; min-height: 48px;">Find More Art</button>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderDropCard(drop) {
                return `
                    <div class="card card-interactive" onclick="app.showPage('art-story', {dropId: ${drop.id}})">
                        <img src="${drop.photoUrl}" alt="${drop.title}" class="card-image">
                        <div class="card-content">
                            <span class="badge badge-${drop.status === 'active' ? 'active' : 'found'}" style="display: inline-flex; align-items: center; gap: 4px;">
                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="${drop.status === 'active' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                </svg>
                                ${drop.status === 'active' ? 'Active' : 'Found'}
                            </span>
                            <span class="badge badge-location" style="margin-left: 0.5rem;">${drop.locationType}</span>
                            <h3 class="card-title">${drop.title}</h3>
                            <p class="card-story">${drop.story.substring(0, 100)}...</p>
                            <div class="card-meta">
                                <div>
                                    <div style="font-size: 0.9rem; color: var(--text-gray);">Location: ${drop.locationName}</div>
                                    <div style="font-size: 0.9rem; color: var(--text-light); margin-top: 0.25rem;">by ${drop.artistName}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderHowItWorks() {
                return `
                    <div class="container" style="max-width: 800px;">
                        <h1 style="text-align: center; margin-bottom: 60px;">How ArtDrops Works</h1>
                        
                        <!-- Visual Timeline -->
                        <div class="how-it-works-timeline">
                            
                            <!-- FOR ARTISTS Section -->
                            <div class="timeline-section">
                                <h2 style="text-align: center; margin-bottom: 40px;">For Artists</h2>
                                
                                <!-- Step 1 -->
                                <div class="timeline-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="8" r="7"/>
                                                <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
                                            </svg>
                                        </div>
                                        <h3>Create Beautiful Art</h3>
                                        <p>Paint rocks, shells, feathers, or leaves found in nature. Each piece tells a story of where it came from.</p>
                                    </div>
                                </div>

                                <!-- Step 2 -->
                                <div class="timeline-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                                                <circle cx="12" cy="13" r="4"/>
                                            </svg>
                                        </div>
                                        <h3>Upload to App</h3>
                                        <p>Take a photo, write your origin story, and pin the location where you found the materials.</p>
                                    </div>
                                </div>

                                <!-- Step 3 -->
                                <div class="timeline-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <div style="width: 80px; height: 80px; background: black; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 4px; padding: 8px;">
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: black; border: 2px solid white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                                <div style="background: white;"></div>
                                            </div>
                                        </div>
                                        <h3>Print QR Tag</h3>
                                        <p>Generate a branded QR code tag to attach to your art piece.</p>
                                    </div>
                                </div>

                                <!-- Step 4 -->
                                <div class="timeline-step">
                                    <div class="step-number">4</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                <circle cx="12" cy="10" r="3"/>
                                            </svg>
                                        </div>
                                        <h3>Drop Anywhere</h3>
                                        <p>Leave your art in coffee shops, parks, bookstores, or trails for others to discover.</p>
                                    </div>
                                </div>

                                <!-- Step 5 -->
                                <div class="timeline-step">
                                    <div class="step-number">5</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                            </svg>
                                        </div>
                                        <h3>Receive Thanks</h3>
                                        <p>Get donations and messages from finders who appreciate your art.</p>
                                    </div>
                                </div>
                            </div>

                            <!-- FOR FINDERS Section -->
                            <div class="timeline-section" style="margin-top: 80px;">
                                <h2 style="text-align: center; margin-bottom: 40px;">For Finders</h2>
                                
                                <!-- Step 1 -->
                                <div class="timeline-step">
                                    <div class="step-number">1</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="11" cy="11" r="8"/>
                                                <path d="M21 21l-4.35-4.35"/>
                                            </svg>
                                        </div>
                                        <h3>Discover Art</h3>
                                        <p>Find painted treasures hidden in your everyday spaces.</p>
                                    </div>
                                </div>

                                <!-- Step 2 -->
                                <div class="timeline-step">
                                    <div class="step-number">2</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <div style="width: 80px; height: 80px; border: 3px solid black; border-radius: 8px; margin: 0 auto; position: relative;">
                                                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; border: 2px solid black;"></div>
                                            </div>
                                        </div>
                                        <h3>Scan QR Code</h3>
                                        <p>Use your phone camera to scan the tag and unlock the story.</p>
                                    </div>
                                </div>

                                <!-- Step 3 -->
                                <div class="timeline-step">
                                    <div class="step-number">3</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                                                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                                            </svg>
                                        </div>
                                        <h3>Read the Story</h3>
                                        <p>Learn where the materials came from and meet the artist.</p>
                                    </div>
                                </div>

                                <!-- Step 4 -->
                                <div class="timeline-step">
                                    <div class="step-number">4</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </div>
                                        <h3>Mark as Found</h3>
                                        <p>Add it to your collection and leave a message for the artist.</p>
                                    </div>
                                </div>

                                <!-- Step 5 -->
                                <div class="timeline-step">
                                    <div class="step-number">5</div>
                                    <div class="step-content">
                                        <div class="step-visual">
                                            <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="12" y1="1" x2="12" y2="23"/>
                                                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                                            </svg>
                                        </div>
                                        <h3>Thank the Artist</h3>
                                        <p>Send a donation to support their creativity and kindness.</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <!-- Call to Action -->
                        <div style="text-align: center; margin-top: 80px; padding: 60px 20px; background: var(--light-gray); border-radius: 16px;">
                            <h2 style="margin-bottom: 20px;">Ready to Start?</h2>
                            <p style="margin-bottom: 40px; font-size: 18px; color: var(--text-gray);">Join our community of artists and discoverers</p>
                            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                                <button class="btn btn-primary btn-large" onclick="app.showPage('artist-signup')" style="min-height: 56px;">Start Dropping Art</button>
                                <button class="btn btn-secondary btn-large" onclick="app.showPage('browse-map')" style="min-height: 56px;">Browse the Map</button>
                            </div>
                        </div>
                    </div>
                    
                    <style>
                        .how-it-works-timeline {
                            max-width: 800px;
                            margin: 0 auto;
                        }

                        .timeline-section {
                            position: relative;
                        }

                        .timeline-step {
                            display: flex;
                            gap: 30px;
                            margin-bottom: 50px;
                            align-items: flex-start;
                        }

                        .step-number {
                            flex-shrink: 0;
                            width: 50px;
                            height: 50px;
                            background: var(--primary-black);
                            color: var(--primary-white);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            font-weight: 700;
                        }

                        .step-content {
                            flex: 1;
                        }

                        .step-visual {
                            width: 100px;
                            height: 100px;
                            background: var(--light-gray);
                            border-radius: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 20px;
                        }

                        .step-content h3 {
                            font-size: 22px;
                            margin-bottom: 12px;
                        }

                        .step-content p {
                            color: var(--text-gray);
                            line-height: 1.7;
                        }

                        @media (max-width: 768px) {
                            .timeline-step {
                                flex-direction: column;
                                text-align: center;
                            }
                            
                            .step-number {
                                margin: 0 auto 20px;
                            }
                            
                            .step-visual {
                                margin: 0 auto 20px;
                            }
                        }
                    </style>
                `;
            },

            renderAbout() {
                return `
                    <div class="container" style="max-width: 800px;">
                        <h1 style="text-align: center; margin-bottom: 2rem;">About ArtDrops</h1>
                        <p style="text-align: center; font-size: 1.3rem; color: var(--primary-black); margin-bottom: 6rem; line-height: 1.6;">
                            ArtDrops connects artists and finders through the joy of discovering painted natural treasures in everyday places.
                        </p>
                        
                        <h2 style="margin-bottom: 2rem;">Our Story</h2>
                        <p style="color: var(--text-gray); line-height: 1.8; margin-bottom: 2rem;">
                            It started with a simple idea: What if art could surprise us in our daily routines? Not in galleries or museums, but in the coffee shop where we grab our morning latte, the park bench where we read, or the trail where we walk our dogs.
                        </p>
                        <p style="color: var(--text-gray); line-height: 1.8; margin-bottom: 4rem;">
                            Inspired by my daughter's painted rock business at a local farmers market, I watched as each small stone she decorated brought joy to strangers. ArtDrops was born from that same spirit—creating a platform where artists can share their work freely, and finders can experience the delight of unexpected discovery.
                        </p>
                        
                        <h2 style="margin-bottom: 2rem;">Our Values</h2>
                        <div style="display: grid; gap: 3rem; margin-bottom: 6rem;">
                            <div style="padding: 2rem; background: var(--light-gray);">
                                <h3 style="margin-bottom: 1rem;">Community</h3>
                                <p style="color: var(--text-gray); line-height: 1.8;">We believe art brings people together. Every drop creates a connection between artist and finder.</p>
                            </div>
                            <div style="padding: 2rem; background: var(--light-gray);">
                                <h3 style="margin-bottom: 1rem;">Creativity</h3>
                                <p style="color: var(--text-gray); line-height: 1.8;">Natural materials become canvases. Everyday spaces transform into galleries.</p>
                            </div>
                            <div style="padding: 2rem; background: var(--light-gray);">
                                <h3 style="margin-bottom: 1rem;">Sustainability</h3>
                                <p style="color: var(--text-gray); line-height: 1.8;">We celebrate art made from natural, found materials—giving new life to nature's discarded treasures.</p>
                            </div>
                            <div style="padding: 2rem; background: var(--light-gray);">
                                <h3 style="margin-bottom: 1rem;">Gratitude</h3>
                                <p style="color: var(--text-gray); line-height: 1.8;">We foster a culture of appreciation where finders can thank artists for spreading joy.</p>
                            </div>
                        </div>
                        
                        <h2 style="text-align: center; margin-bottom: 3rem;">Our Impact</h2>
                        <div class="stats-grid" style="margin-bottom: 6rem;">
                            <div class="stat-card">
                                <div class="stat-value">156</div>
                                <div class="stat-label">Total Drops</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">42</div>
                                <div class="stat-label">Artists</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">$3,847</div>
                                <div class="stat-label">Donated to Artists</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">18</div>
                                <div class="stat-label">Cities Reached</div>
                            </div>
                        </div>
                        
                        <div style="text-align: center; padding: 3rem 1.5rem; background: var(--light-gray);">
                            <h2 style="margin-bottom: 2rem;">Join the Movement</h2>
                            <p style="color: var(--text-gray); margin-bottom: 2rem; font-size: 1rem; line-height: 1.6;">Whether you're an artist or a finder, there's a place for you in our community.</p>
                            <button class="btn btn-primary btn-large" onclick="app.showPage('artist-signup')" style="min-height: 56px; min-width: 200px;">Get Started</button>
                        </div>
                    </div>
                `;
            },

            renderFinderLogin() {
                return `
                    <div class="auth-container">
                        <div class="app-name" style="text-align: center; margin-bottom: 2rem;">ARTDROPS</div>
                        <h2>Drop art anywhere.<br>Find joy everywhere.</h2>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 3rem;">Welcome back, treasure hunter!</p>
                        
                        <!-- Real SSO Buttons -->
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
                        
                        <div style="text-align: center; margin: 2rem 0; color: var(--text-gray); position: relative;">
                            <span style="background: var(--primary-white); padding: 0 1rem; position: relative; z-index: 1;">or</span>
                            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border-gray);"></div>
                        </div>
                        
                        <form onsubmit="app.handleFinderLogin(event)">
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" class="form-control" name="email" required placeholder="your@email.com">
                            </div>
                            <div class="form-group">
                                <label>Password</label>
                                <input type="password" class="form-control" name="password" required placeholder="Enter your password">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px; font-size: 16px;">Login</button>
                        </form>
                        <p style="text-align: center; margin-top: 3rem; color: var(--text-gray);">
                            New finder? <a href="#" onclick="app.showPage('finder-signup'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Sign Up</a>
                        </p>
                        <p style="text-align: center; margin-top: 1rem; color: var(--text-gray);">
                            Are you an artist? <a href="#" onclick="app.showPage('artist-login'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Artist Login</a>
                        </p>
                        <div style="margin-top: 3rem; padding: 2rem; background: var(--light-gray); font-size: 0.9rem; line-height: 1.8;">
                            <strong>Demo Finder Accounts:</strong><br>
                            emily@example.com / password<br>
                            marcus@example.com / password
                        </div>
                    </div>
                `;
            },

            renderFinderSignup() {
                return `
                    <div class="auth-container">
                        <h2>Join as Finder</h2>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 4rem;">Start your art discovery journey</p>
                        <form onsubmit="app.handleFinderSignup(event)">
                            <div class="form-group" style="text-align: center;">
                                <label style="text-align: center; display: block;">Profile Picture</label>
                                <div style="margin: 1rem auto;">
                                    <img id="finderSignupProfilePreview" src="https://via.placeholder.com/150/000000/FFFFFF?text=+" alt="Profile Preview" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-gray); display: block; margin: 0 auto 1rem;">
                                    <input type="file" id="finderSignupProfileInput" accept="image/jpeg,image/png,image/gif" style="display: none;" onchange="app.handleProfilePhotoPreview(event, 'finderSignupProfilePreview')">
                                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('finderSignupProfileInput').click()" style="min-height: 44px; font-size: 0.9rem;">Upload Photo</button>
                                    <p style="font-size: 0.8rem; color: var(--text-gray); margin-top: 0.5rem;">JPG, PNG, or GIF (max 5MB)</p>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" class="form-control" name="name" required placeholder="Your name">
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
                                <label>Bio (Optional)</label>
                                <textarea class="form-control" name="bio" placeholder="Tell us about yourself..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; min-height: 48px; font-size: 16px;">Create Account</button>
                        </form>
                        <p style="text-align: center; margin-top: 1.5rem; color: var(--text-gray);">
                            Already have an account? <a href="#" onclick="app.showPage('finder-login'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Login</a>
                        </p>
                        <p style="text-align: center; margin-top: 1rem; color: var(--text-gray);">
                            Are you an artist? <a href="#" onclick="app.showPage('artist-signup'); return false;" style="color: var(--primary-black); font-weight: 600; text-decoration: underline;">Artist Signup</a>
                        </p>
                    </div>
                `;
            },

            renderContact() {
                return `
                    <div class="container" style="max-width: 700px;">
                        <h1 style="text-align: center; margin-bottom: 2rem;">Contact Us</h1>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 4rem; font-size: 1.1rem;">
                            We'd love to hear from you
                        </p>
                        
                        <div class="card">
                            <div class="card-content" style="padding: 3rem;">
                                <form onsubmit="app.handleContactSubmit(event)">
                                    <div class="form-group">
                                        <label>Name *</label>
                                        <input type="text" class="form-control" name="name" required placeholder="Your name">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Email *</label>
                                        <input type="email" class="form-control" name="email" required placeholder="your@email.com">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Subject *</label>
                                        <select class="form-control" name="subject" required>
                                            <option value="">Select a subject</option>
                                            <option value="general">General Inquiry</option>
                                            <option value="artist">Artist Support</option>
                                            <option value="technical">Technical Issue</option>
                                            <option value="partnership">Partnership</option>
                                            <option value="press">Press</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Message *</label>
                                        <textarea class="form-control" name="message" required placeholder="Tell us how we can help..."></textarea>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px;">Send Message</button>
                                </form>
                            </div>
                        </div>
                        
                        <div style="margin-top: 4rem; text-align: center; padding: 3rem; background: var(--light-gray);">
                            <h3 style="margin-bottom: 2rem;">Other Ways to Reach Us</h3>
                            <p style="color: var(--text-gray); margin-bottom: 2rem;">
                                <strong>Email:</strong> contact@artdrops.com
                            </p>
                            <p style="color: var(--text-gray); margin-bottom: 3rem;">
                                <strong>Response Time:</strong> We respond within 24-48 hours
                            </p>
                            <div style="display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
                                <a href="https://instagram.com/artdrops" target="_blank" style="color: var(--primary-black); text-decoration: underline;">Instagram</a>
                                <a href="https://tiktok.com/@artdrops" target="_blank" style="color: var(--primary-black); text-decoration: underline;">TikTok</a>
                                <a href="https://facebook.com/artdrops" target="_blank" style="color: var(--primary-black); text-decoration: underline;">Facebook</a>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderEditProfile() {
                if (!appState.currentUser) {
                    this.showPage('artist-login');
                    return;
                }
                
                return `
                    <div class="container" style="max-width: 700px;">
                        <h1 style="margin-bottom: 2rem;">Edit Profile</h1>
                        <p style="color: var(--text-gray); margin-bottom: 4rem; font-size: 1.1rem;">Update your artist information</p>
                        
                        <div class="card">
                            <div class="card-content" style="padding: 3rem;">
                                <form onsubmit="app.handleProfileUpdate(event)">
                                    <div class="form-group" style="text-align: center;">
                                        <label style="text-align: center; display: block;">Profile Picture</label>
                                        <div style="margin: 1rem auto;">
                                            <img id="editProfilePreview" src="${appState.currentUser.profilePhoto || 'https://via.placeholder.com/150/000000/FFFFFF?text=' + (appState.currentUser.name ? appState.currentUser.name.charAt(0) : '+')}" alt="Profile Preview" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-gray); display: block; margin: 0 auto 1rem;">
                                            <input type="file" id="editProfileInput" accept="image/jpeg,image/png,image/gif" style="display: none;" onchange="app.handleProfilePhotoPreview(event, 'editProfilePreview')">
                                            <button type="button" class="btn btn-secondary" onclick="document.getElementById('editProfileInput').click()" style="min-height: 44px; font-size: 0.9rem;">Upload New Photo</button>
                                            <p style="font-size: 0.8rem; color: var(--text-gray); margin-top: 0.5rem;">JPG, PNG, or GIF (max 5MB)</p>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Artist Bio (250 characters)</label>
                                        <textarea class="form-control" name="bio" maxlength="250" placeholder="Tell people about your art...">${appState.currentUser.bio || ''}</textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>City/Location</label>
                                        <input type="text" class="form-control" name="city" value="${appState.currentUser.city || ''}" placeholder="Brooklyn, NY">
                                    </div>
                                    
                                    <h3 style="margin: 3rem 0 2rem;">Social Media Handles</h3>
                                    
                                    <div class="form-group">
                                        <label>Instagram Handle</label>
                                        <input type="text" class="form-control" name="instagram" value="${appState.currentUser.instagram || ''}" placeholder="@yourhandle">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>TikTok Handle</label>
                                        <input type="text" class="form-control" name="tiktok" value="${appState.currentUser.tiktok || ''}" placeholder="@yourhandle">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Facebook Page URL</label>
                                        <input type="url" class="form-control" name="facebook" value="${appState.currentUser.facebook || ''}" placeholder="https://facebook.com/yourpage">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>Website URL</label>
                                        <input type="url" class="form-control" name="website" value="${appState.currentUser.website || ''}" placeholder="https://yourwebsite.com">
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; margin-bottom: 1rem; min-height: 56px;">Save Changes</button>
                                    <button type="button" class="btn btn-secondary" onclick="app.showPage('artist-dashboard')" style="width: 100%; min-height: 48px;">Cancel</button>
                                </form>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderRecentActivity() {
                if (!appState.currentUser) return '';
                
                const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
                const allFinds = [];
                
                myDrops.forEach(drop => {
                    drop.findEvents.forEach(event => {
                        allFinds.push({ ...event, dropTitle: drop.title, dropId: drop.id });
                    });
                });
                
                allFinds.sort((a, b) => new Date(b.findDate) - new Date(a.findDate));
                const recentFinds = allFinds.slice(0, 5);
                
                if (recentFinds.length === 0) {
                    return `
                        <div style="background: var(--light-gray); padding: 3rem; text-align: center;">
                            <p style="color: var(--text-gray);">No activity yet. Drop some art to get started!</p>
                        </div>
                    `;
                }
                
                return `
                    <div style="background: var(--cream-white); padding: 1.5rem; border-radius: 12px;">
                        ${recentFinds.map(find => `
                            <div class="finder-message">
                                <strong>${find.finderName || 'Someone'}</strong> found 
                                <span style="color: var(--primary-black); font-weight: 600;">${find.dropTitle}</span>
                                ${find.donated ? '<span style="color: var(--primary-black); display: inline-flex; align-items: center; gap: 4px;"><svg class="icon icon-small" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> and donated</span>' : ''}
                                ${find.message ? `<p style="margin: 1rem 0 0 0; color: var(--primary-black);">${find.message}</p>` : ''}
                                <p style="font-size: 0.85rem; color: var(--text-gray); margin: 1rem 0 0 0;">${new Date(find.findDate).toLocaleDateString()}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            },

            renderRecentDonations() {
                if (!appState.currentUser) return '';
                
                const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
                const donations = [];
                
                myDrops.forEach(drop => {
                    drop.findEvents.filter(e => e.donated).forEach(event => {
                        donations.push({ ...event, dropTitle: drop.title });
                    });
                });
                
                donations.sort((a, b) => new Date(b.findDate) - new Date(a.findDate));
                
                if (donations.length === 0) {
                    return `
                        <div style="background: var(--light-gray); padding: 3rem; text-align: center; margin-top: 3rem;">
                            <p style="color: var(--text-gray);">No donations yet. Keep creating and sharing!</p>
                        </div>
                    `;
                }
                
                return `
                    <div style="background: var(--cream-white); padding: 1.5rem; border-radius: 12px; margin-top: 1rem;">
                        ${donations.slice(0, 10).map(donation => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-light);">
                                <div>
                                    <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                        ${donation.finderName || 'Anonymous'}
                                        <svg class="icon icon-small" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                        </svg>
                                    </div>
                                    <div style="font-size: 0.9rem; color: var(--text-gray);">${donation.dropTitle}</div>
                                    ${donation.message ? `<p style="font-size: 0.9rem; margin: 1rem 0 0 0; color: var(--primary-black);">${donation.message}</p>` : ''}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 0.85rem; color: var(--text-gray);">${new Date(donation.findDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            },

            // ============================================
            // EVENT HANDLERS
            // ============================================

            handleFinderLogin(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');
                
                const finder = appState.finders.find(f => f.email === email && f.password === password);
                
                if (finder) {
                    appState.currentUser = finder;
                    this.showPage('feed');
                    this.showToast('Welcome back, ' + finder.name + '!');
                } else {
                    alert('Invalid email or password');
                }
            },

            handleFinderSignup(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                const newFinder = {
                    id: appState.finders.length + appState.artists.length + 1,
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    bio: formData.get('bio') || '',
                    profilePhoto: appState.tempProfilePhoto || '',
                    userType: 'finder',
                    foundArt: [],
                    followedArtists: [],
                    followedLocations: [],
                    totalFinds: 0,
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                appState.finders.push(newFinder);
                appState.currentUser = newFinder;
                appState.tempProfilePhoto = null;
                this.showPage('feed');
                this.showToast('Welcome to ArtDrops, ' + newFinder.name + '!');
            },

            signInWithApple() {
                // Simulated Apple Sign In (in production: use AppleID.auth.signIn())
                const appleUser = {
                    id: 'apple_' + Date.now(),
                    name: 'Apple User',
                    email: 'user@icloud.com',
                    authProvider: 'apple',
                    userType: 'finder',
                    profilePhoto: 'https://i.pravatar.cc/200?img=50',
                    foundArt: [],
                    followedArtists: [],
                    followedLocations: [],
                    totalFinds: 0,
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                appState.finders.push(appleUser);
                appState.currentUser = appleUser;
                this.showPage('feed');
                this.showToast('Welcome, ' + appleUser.name + '! Signed in with Apple.');
            },

            signInWithGoogle() {
                // Simulated Google Sign In (in production: use google.accounts.id.initialize())
                const googleUser = {
                    id: 'google_' + Date.now(),
                    name: 'Google User',
                    email: 'user@gmail.com',
                    authProvider: 'google',
                    userType: 'finder',
                    profilePhoto: 'https://i.pravatar.cc/200?img=51',
                    foundArt: [],
                    followedArtists: [],
                    followedLocations: [],
                    totalFinds: 0,
                    joinDate: new Date().toISOString().split('T')[0]
                };
                
                appState.finders.push(googleUser);
                appState.currentUser = googleUser;
                this.showPage('feed');
                this.showToast('Welcome, ' + googleUser.name + '! Signed in with Google.');
            },

            handleProfilePhotoPreview(event, previewId) {
                const file = event.target.files[0];
                if (!file) return;
                
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File too large. Maximum size is 5MB.');
                    return;
                }
                
                // Validate file type
                if (!file.type.match('image/(jpeg|png|gif)')) {
                    alert('Please upload a JPG, PNG, or GIF image.');
                    return;
                }
                
                // Preview image
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById(previewId);
                    if (preview) {
                        preview.src = e.target.result;
                        // Store temporarily for signup
                        appState.tempProfilePhoto = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            },

            handleArtistLogin(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const password = formData.get('password');
                
                const artist = appState.artists.find(a => a.email === email && a.password === password);
                
                if (artist) {
                    appState.currentUser = artist;
                    this.showPage('home');
                    this.showToast('Welcome back, ' + artist.name + '!');
                } else {
                    alert('Invalid email or password');
                }
            },

            handleArtistSignup(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                const newArtist = {
                    id: appState.artists.length + 1,
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    bio: formData.get('bio'),
                    profilePhoto: appState.tempProfilePhoto || '',
                    joinDate: new Date().toISOString().split('T')[0],
                    totalDonations: 0,
                    activeDrops: 0
                };
                
                appState.artists.push(newArtist);
                appState.currentUser = newArtist;
                appState.tempProfilePhoto = null;
                this.showPage('home');
                this.showToast('Welcome to ArtDrops, ' + newArtist.name + '!');
            },

            handleDropNewArt(e) {
                e.preventDefault();
                this.showLoadingOverlay('Creating your art drop...');
                const formData = new FormData(e.target);
                
                const newDrop = {
                    id: appState.artDrops.length + 1,
                    artistId: appState.currentUser.id,
                    artistName: appState.currentUser.name,
                    title: formData.get('title'),
                    story: formData.get('story'),
                    photoUrl: formData.get('photoUrl'),
                    latitude: parseFloat(formData.get('latitude')),
                    longitude: parseFloat(formData.get('longitude')),
                    locationType: formData.get('locationType'),
                    locationName: formData.get('locationName'),
                    status: 'active',
                    dateCreated: new Date().toISOString().split('T')[0],
                    totalDonations: 0,
                    foundCount: 0,
                    findEvents: []
                };
                
                appState.artDrops.push(newDrop);
                appState.currentUser.activeDrops++;
                
                setTimeout(() => {
                    this.hideLoadingOverlay();
                    this.showPage('qr-tag-generator', { dropId: newDrop.id });
                }, 1500);
            },

            handleFoundSubmit(e, dropId) {
                e.preventDefault();
                this.showLoadingOverlay('Recording your find...');
                const formData = new FormData(e.target);
                const drop = appState.artDrops.find(d => d.id === dropId);
                
                const findEvent = {
                    id: Date.now(),
                    finderName: formData.get('finderName') || 'Anonymous',
                    message: formData.get('message') || '',
                    findDate: new Date().toISOString().split('T')[0],
                    donated: false
                };
                
                drop.findEvents.push(findEvent);
                drop.foundCount++;
                drop.status = 'found';
                drop.findDate = findEvent.findDate;
                
                // Simulate processing
                setTimeout(() => {
                    this.hideLoadingOverlay();
                    this.showPage('donation-flow', { dropId });
                }, 1000);
                return;
                
                // Add to finder's collection if logged in as finder
                if (appState.currentUser && appState.currentUser.userType === 'finder') {
                    if (!appState.currentUser.foundArt.includes(dropId)) {
                        appState.currentUser.foundArt.push(dropId);
                        appState.currentUser.totalFinds++;
                    }
                }
            },

            showLoadingOverlay(message = 'Loading...') {
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.id = 'loadingOverlay';
                overlay.innerHTML = `
                    <div class="spinner"></div>
                    <div class="loading-text">${message}</div>
                `;
                document.body.appendChild(overlay);
            },
            
            hideLoadingOverlay() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) overlay.remove();
            },
            
            handleDonation(e, dropId) {
                e.preventDefault();
                this.showLoadingOverlay('Processing donation...');
                const formData = new FormData(e.target);
                const customAmount = parseFloat(formData.get('customAmount'));
                const selectedBtn = document.querySelector('.donation-btn.selected');
                const presetAmount = selectedBtn ? parseFloat(selectedBtn.dataset.amount) : 0;
                
                const amount = customAmount || presetAmount;
                
                if (!amount || amount < 1) {
                    alert('Please select or enter a donation amount');
                    return;
                }
                
                const drop = appState.artDrops.find(d => d.id === dropId);
                const artist = appState.artists.find(a => a.id === drop.artistId);
                
                // Calculate platform fee
                const platformFee = amount * appState.platformCommission;
                const artistPayout = amount - platformFee;
                
                // Update totals
                drop.totalDonations += artistPayout;
                artist.totalDonations += artistPayout;
                
                // Mark last find event as donated
                if (drop.findEvents.length > 0) {
                    drop.findEvents[drop.findEvents.length - 1].donated = true;
                }
                
                // Simulate payment processing
                setTimeout(() => {
                    this.hideLoadingOverlay();
                    this.showPage('thank-you', { dropId, amount });
                }, 1500);
            },

            selectDonationAmount(amount) {
                document.querySelectorAll('.donation-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                event.target.classList.add('selected');
                document.getElementById('customAmount').value = '';
            },

            useCurrentLocation() {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            document.getElementById('dropLatitude').value = position.coords.latitude.toFixed(6);
                            document.getElementById('dropLongitude').value = position.coords.longitude.toFixed(6);
                            this.showToast('Location captured!');
                            this.updateDropLocationMap(position.coords.latitude, position.coords.longitude);
                        },
                        error => {
                            alert('Unable to get location. Please enter manually.');
                        }
                    );
                } else {
                    alert('Geolocation not supported. Please enter manually.');
                }
            },

            // ============================================
            // HELPER METHODS
            // ============================================

            getMyFoundCount() {
                if (!appState.currentUser) return 0;
                const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
                return myDrops.reduce((sum, d) => sum + d.foundCount, 0);
            },

            showToast(message) {
                const toast = document.createElement('div');
                toast.className = 'toast';
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            },

            handleContactSubmit(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                const contactData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    subject: formData.get('subject'),
                    message: formData.get('message'),
                    timestamp: new Date().toISOString()
                };
                
                console.log('Contact form submitted:', contactData);
                this.showToast('Message sent! We\'ll respond within 24-48 hours.');
                e.target.reset();
                
                setTimeout(() => {
                    this.showPage('landing');
                }, 2000);
            },

            toggleFollowArtist(artistId) {
                if (!appState.currentUser) {
                    alert('Please log in to follow artists');
                    this.showPage('finder-login');
                    return;
                }
                
                const followIndex = appState.follows.findIndex(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'artist' && f.targetId === artistId
                );
                
                if (followIndex >= 0) {
                    // Unfollow
                    appState.follows.splice(followIndex, 1);
                    const index = appState.currentUser.followedArtists.indexOf(artistId);
                    if (index >= 0) appState.currentUser.followedArtists.splice(index, 1);
                    this.showToast('Unfollowed artist');
                } else {
                    // Follow
                    appState.follows.push({
                        followerId: appState.currentUser.id,
                        targetType: 'artist',
                        targetId: artistId,
                        dateFollowed: new Date().toISOString().split('T')[0]
                    });
                    if (!appState.currentUser.followedArtists.includes(artistId)) {
                        appState.currentUser.followedArtists.push(artistId);
                    }
                    this.showToast('Following artist!');
                }
                
                // Refresh current page
                this.showPage(appState.currentPage, { dropId: parseInt(window.location.hash.split('/').pop()) || null });
            },

            toggleFollowLocation(locationId) {
                if (!appState.currentUser) {
                    alert('Please log in to follow locations');
                    this.showPage('finder-login');
                    return;
                }
                
                const followIndex = appState.follows.findIndex(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'location' && f.targetId === locationId
                );
                
                if (followIndex >= 0) {
                    // Unfollow
                    appState.follows.splice(followIndex, 1);
                    const index = appState.currentUser.followedLocations.indexOf(locationId);
                    if (index >= 0) appState.currentUser.followedLocations.splice(index, 1);
                    this.showToast('Unfollowed location');
                } else {
                    // Follow
                    appState.follows.push({
                        followerId: appState.currentUser.id,
                        targetType: 'location',
                        targetId: locationId,
                        dateFollowed: new Date().toISOString().split('T')[0]
                    });
                    if (!appState.currentUser.followedLocations.includes(locationId)) {
                        appState.currentUser.followedLocations.push(locationId);
                    }
                    this.showToast('Following location!');
                }
                
                // Refresh current page
                this.showPage(appState.currentPage, { dropId: parseInt(window.location.hash.split('/').pop()) || null });
            },

            shareArt(platform, url, text) {
                text = decodeURIComponent(text);
                
                // Try Web Share API first (mobile)
                if (platform === 'copy' || !navigator.share) {
                    if (platform === 'copy') {
                        // Copy to clipboard
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(url).then(() => {
                                this.showToast('Link copied to clipboard!');
                            }).catch(err => {
                                // Fallback for clipboard
                                const textArea = document.createElement('textarea');
                                textArea.value = url;
                                document.body.appendChild(textArea);
                                textArea.select();
                                try {
                                    document.execCommand('copy');
                                    this.showToast('Link copied!');
                                } catch (err) {
                                    alert('Please copy manually: ' + url);
                                }
                                document.body.removeChild(textArea);
                            });
                        }
                    } else if (platform === 'instagram') {
                        window.open('https://www.instagram.com/', '_blank');
                        this.showToast('Instagram opened! Share the link in your story or post.');
                    } else if (platform === 'facebook') {
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                    } else if (platform === 'twitter') {
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                    } else if (platform === 'email') {
                        window.location.href = `mailto:?subject=${encodeURIComponent('Check out this hidden art!')}&body=${encodeURIComponent(text + ' ' + url)}`;
                    } else if (platform === 'sms') {
                        window.location.href = `sms:?body=${encodeURIComponent(text + ' ' + url)}`;
                    }
                } else {
                    // Use Web Share API
                    navigator.share({
                        title: 'ArtDrops Discovery',
                        text: text,
                        url: url
                    }).then(() => {
                        this.showToast('Shared successfully!');
                    }).catch(err => {
                        console.log('Share cancelled or failed', err);
                    });
                }
            },

            handleProfileUpdate(e) {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // Use temp photo if uploaded, otherwise keep existing
                if (appState.tempProfilePhoto) {
                    appState.currentUser.profilePhoto = appState.tempProfilePhoto;
                    appState.tempProfilePhoto = null;
                }
                appState.currentUser.bio = formData.get('bio') || '';
                appState.currentUser.city = formData.get('city') || '';
                appState.currentUser.instagram = formData.get('instagram') || '';
                appState.currentUser.tiktok = formData.get('tiktok') || '';
                appState.currentUser.facebook = formData.get('facebook') || '';
                appState.currentUser.website = formData.get('website') || '';
                
                this.showToast('Profile updated successfully!');
                this.showPage('artist-dashboard');
            },

            renderFeed() {
                // Use sample data from instructions
                const sampleArtDrops = [
                    {
                        id: 1,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Morning Shell',
                        story: 'Found this perfect scallop shell during a sunrise walk at the beach. I painted it with watercolors inspired by the dawn sky - soft pinks, oranges, and blues blending together. Left it at my favorite coffee spot for someone who needs a reminder that beauty is everywhere, even in the smallest moments.',
                        photoUrl: 'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=1200&h=1600&fit=crop',
                        latitude: 40.7589,
                        longitude: -73.9851,
                        locationType: 'Coffee Shop',
                        locationName: 'Westside Coffee, Brooklyn',
                        materials: 'Scallop Shell, Watercolor',
                        dateCreated: '2024-10-20',
                        findCount: 3,
                        distance: '0.3 miles'
                    },
                    {
                        id: 2,
                        artistId: 2,
                        artistName: 'James River',
                        artistPhoto: 'https://i.pravatar.cc/200?img=12',
                        title: 'Desert Stone',
                        story: 'This red sandstone caught my eye during a canyon hike in Sedona. I painted geometric patterns inspired by indigenous art of the Southwest. The stone still carries the warmth of the desert sun.',
                        photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=1600&fit=crop',
                        latitude: 34.8697,
                        longitude: -111.7610,
                        locationType: 'Trail',
                        locationName: 'Red Rock Trail, Sedona',
                        materials: 'Red Sandstone, Acrylic',
                        dateCreated: '2024-10-18',
                        findCount: 5,
                        distance: '1.2 miles'
                    },
                    {
                        id: 3,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Autumn Feather',
                        story: 'A hawk feather found during my morning walk in Central Park. I painted it with the colors of fall - deep burgundy, gold, and burnt orange. Nature\'s canvas painted by nature\'s palette.',
                        photoUrl: 'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1200&h=1600&fit=crop',
                        latitude: 40.7829,
                        longitude: -73.9654,
                        locationType: 'Park',
                        locationName: 'Central Park, New York',
                        materials: 'Hawk Feather, Watercolor',
                        dateCreated: '2024-10-21',
                        findCount: 2,
                        distance: '0.8 miles'
                    }
                ];
                
                return `
                    <div class="immersive-feed" id="immersiveFeed">
                        ${sampleArtDrops.map(drop => `
                            <div class="art-card-fullscreen" style="background-image: url('${drop.photoUrl}');" data-drop-id="${drop.id}">
                                <!-- Top Overlay -->
                                <div class="top-overlay">
                                    <div class="artist-name-overlay" onclick="app.showPage('artist-profile', {artistId: ${drop.artistId}}); event.stopPropagation();" style="cursor: pointer;">
                                        <img src="${drop.artistPhoto}" alt="${drop.artistName}" class="artist-avatar-small">
                                        <div>
                                            <div class="artist-name-text">${drop.artistName}</div>
                                            <div class="location-indicator" style="display: flex; align-items: center; gap: 4px;">
                                    <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    ${drop.locationName}
                                </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Bottom Overlay -->
                                <div class="bottom-overlay" onclick="app.openDetailsOverlay(${drop.id})">
                                    <h2 class="art-title-overlay">${drop.title}</h2>
                                    <p class="art-story-preview">${drop.story.substring(0, 80)}...</p>
                                    <p class="tap-hint">Tap for full story</p>
                                </div>
                                
                                <!-- Quick Actions -->
                                <div class="quick-actions">
                                    <button class="action-btn" onclick="app.toggleFollowArtist(${drop.artistId}); event.stopPropagation();" title="Follow">
                                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                        </svg>
                                    </button>
                                    <button class="action-btn" onclick="app.openShareOverlay(${drop.id}); event.stopPropagation();" title="Share">
                                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="18" cy="5" r="3"/>
                                            <circle cx="6" cy="12" r="3"/>
                                            <circle cx="18" cy="19" r="3"/>
                                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                        </svg>
                                    </button>
                                    <button class="action-btn" onclick="app.openLocationOverlay(${drop.id}); event.stopPropagation();" title="Location">
                                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                    </button>
                                    <button class="action-btn" onclick="app.openDetailsOverlay(${drop.id}); event.stopPropagation();" title="Info">
                                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="16" x2="12" y2="12"/>
                                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Details Overlay -->
                    <div class="overlay-modal" id="detailsOverlay" onclick="app.closeOverlay('detailsOverlay')">
                        <div class="overlay-content" onclick="event.stopPropagation()" id="detailsOverlayContent">
                            <!-- Content populated dynamically -->
                        </div>
                    </div>
                    
                    <!-- Share Overlay -->
                    <div class="overlay-modal" id="shareOverlay" onclick="app.closeOverlay('shareOverlay')">
                        <div class="overlay-content" onclick="event.stopPropagation()">
                            <div class="overlay-header">
                                <h3 style="margin: 0;">Share This Art</h3>
                                <button class="close-overlay" onclick="app.closeOverlay('shareOverlay')">✕</button>
                            </div>
                            <div class="share-grid" id="shareGrid">
                                <!-- Populated dynamically -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location Overlay -->
                    <div class="overlay-modal" id="locationOverlay" onclick="app.closeOverlay('locationOverlay')">
                        <div class="overlay-content" onclick="event.stopPropagation()" id="locationOverlayContent">
                            <!-- Content populated dynamically -->
                        </div>
                    </div>
                `;
            },
            
            openDetailsOverlay(dropId) {
                const sampleArtDrops = [
                    {
                        id: 1,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Morning Shell',
                        story: 'Found this perfect scallop shell during a sunrise walk at the beach. I painted it with watercolors inspired by the dawn sky - soft pinks, oranges, and blues blending together. Left it at my favorite coffee spot for someone who needs a reminder that beauty is everywhere, even in the smallest moments.',
                        photoUrl: 'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=1200&h=1600&fit=crop',
                        latitude: 40.7589,
                        longitude: -73.9851,
                        locationType: 'Coffee Shop',
                        locationName: 'Westside Coffee, Brooklyn',
                        materials: 'Scallop Shell, Watercolor',
                        dateCreated: '2024-10-20',
                        findCount: 3,
                        distance: '0.3 miles'
                    },
                    {
                        id: 2,
                        artistId: 2,
                        artistName: 'James River',
                        artistPhoto: 'https://i.pravatar.cc/200?img=12',
                        title: 'Desert Stone',
                        story: 'This red sandstone caught my eye during a canyon hike in Sedona. I painted geometric patterns inspired by indigenous art of the Southwest. The stone still carries the warmth of the desert sun.',
                        photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=1600&fit=crop',
                        latitude: 34.8697,
                        longitude: -111.7610,
                        locationType: 'Trail',
                        locationName: 'Red Rock Trail, Sedona',
                        materials: 'Red Sandstone, Acrylic',
                        dateCreated: '2024-10-18',
                        findCount: 5,
                        distance: '1.2 miles'
                    },
                    {
                        id: 3,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Autumn Feather',
                        story: 'A hawk feather found during my morning walk in Central Park. I painted it with the colors of fall - deep burgundy, gold, and burnt orange. Nature\'s canvas painted by nature\'s palette.',
                        photoUrl: 'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1200&h=1600&fit=crop',
                        latitude: 40.7829,
                        longitude: -73.9654,
                        locationType: 'Park',
                        locationName: 'Central Park, New York',
                        materials: 'Hawk Feather, Watercolor',
                        dateCreated: '2024-10-21',
                        findCount: 2,
                        distance: '0.8 miles'
                    }
                ];
                
                const drop = sampleArtDrops.find(d => d.id === dropId);
                if (!drop) return;
                
                const content = `
                    <div class="overlay-header">
                        <h3 style="margin: 0;">Art Details</h3>
                        <button class="close-overlay" onclick="app.closeOverlay('detailsOverlay')">✕</button>
                    </div>
                    
                    <h2 class="overlay-title">${drop.title}</h2>
                    
                    <div class="artist-info-section" onclick="app.showPage('artist-profile', {artistId: ${drop.artistId}}); app.closeOverlay('detailsOverlay');" style="cursor: pointer;">
                        <img src="${drop.artistPhoto}" alt="${drop.artistName}" class="artist-profile-pic">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.25rem;">${drop.artistName}</div>
                            <div style="font-size: 0.85rem; color: var(--text-gray);">View Full Profile →</div>
                        </div>
                    </div>
                    
                    <div style="margin: 2rem 0;">
                        <h3 style="margin-bottom: 1rem;">Origin Story</h3>
                        <p style="color: var(--primary-black); line-height: 1.8;">${drop.story}</p>
                    </div>
                    
                    <div style="background: var(--light-gray); padding: 1.5rem; border-radius: 12px; margin: 2rem 0;">
                        <div class="info-row">
                            <span class="info-label">Location</span>
                            <span class="info-value">${drop.locationName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Distance</span>
                            <span class="info-value">${drop.distance} away</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Materials</span>
                            <span class="info-value">${drop.materials}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Dropped</span>
                            <span class="info-value">${new Date(drop.dateCreated).toLocaleDateString()}</span>
                        </div>
                        <div class="info-row" style="border-bottom: none;">
                            <span class="info-label">Found By</span>
                            <span class="info-value">${drop.findCount} people</span>
                        </div>
                    </div>
                    
                    <div class="overlay-action-grid">
                        <button class="overlay-action-btn primary" onclick="app.showToast('Following ${drop.artistName}!')" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Follow Artist
                        </button>
                        <button class="overlay-action-btn" onclick="app.showToast('Following location!')" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            Follow Location
                        </button>
                        <button class="overlay-action-btn" onclick="app.openShareOverlay(${drop.id}); app.closeOverlay('detailsOverlay');" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            Share
                        </button>
                        <button class="overlay-action-btn" onclick="app.showToast('Opening directions...'); window.open('https://maps.google.com/?q=${drop.latitude},${drop.longitude}', '_blank');" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                            </svg>
                            Get Directions
                        </button>
                    </div>
                    
                    <button class="btn btn-primary" onclick="app.showToast('Thank you for your support!')" style="width: 100%; margin-top: 1rem; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        Donate to Artist
                    </button>
                    
                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-gray);">
                        <h3 style="margin-bottom: 1rem;">Recent Finds</h3>
                        <div style="background: var(--light-gray); padding: 1rem; border-radius: 8px; font-size: 0.9rem;">
                            <p style="margin: 0;">💬 "Love this!" - Emily</p>
                        </div>
                    </div>
                `;
                
                document.getElementById('detailsOverlayContent').innerHTML = content;
                document.getElementById('detailsOverlay').classList.add('active');
            },
            
            openShareOverlay(dropId) {
                const shareOptions = [
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>', 
                        label: 'Copy Link', 
                        action: () => app.showToast('Link copied!') 
                    },
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>', 
                        label: 'Instagram', 
                        action: () => window.open('https://instagram.com', '_blank') 
                    },
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>', 
                        label: 'Facebook', 
                        action: () => window.open('https://facebook.com', '_blank') 
                    },
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>', 
                        label: 'Twitter', 
                        action: () => window.open('https://twitter.com', '_blank') 
                    },
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>', 
                        label: 'Email', 
                        action: () => app.showToast('Opening email...') 
                    },
                    { 
                        icon: '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>', 
                        label: 'SMS', 
                        action: () => app.showToast('Opening messages...') 
                    }
                ];
                
                const shareHtml = shareOptions.map((option, idx) => `
                    <div class="share-option" onclick="(${option.action.toString()})(); app.closeOverlay('shareOverlay');">
                        <div class="share-icon" style="display: flex; justify-content: center; align-items: center;">${option.icon}</div>
                        <div class="share-label">${option.label}</div>
                    </div>
                `).join('');
                
                document.getElementById('shareGrid').innerHTML = shareHtml;
                document.getElementById('shareOverlay').classList.add('active');
            },
            
            openLocationOverlay(dropId) {
                const sampleArtDrops = [
                    {
                        id: 1,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Morning Shell',
                        story: 'Found this perfect scallop shell during a sunrise walk at the beach. I painted it with watercolors inspired by the dawn sky - soft pinks, oranges, and blues blending together. Left it at my favorite coffee spot for someone who needs a reminder that beauty is everywhere, even in the smallest moments.',
                        photoUrl: 'https://images.unsplash.com/photo-1582662104865-0a8b0c8f9832?w=1200&h=1600&fit=crop',
                        latitude: 40.7589,
                        longitude: -73.9851,
                        locationType: 'Coffee Shop',
                        locationName: 'Westside Coffee, Brooklyn',
                        materials: 'Scallop Shell, Watercolor',
                        dateCreated: '2024-10-20',
                        findCount: 3,
                        distance: '0.3 miles'
                    },
                    {
                        id: 2,
                        artistId: 2,
                        artistName: 'James River',
                        artistPhoto: 'https://i.pravatar.cc/200?img=12',
                        title: 'Desert Stone',
                        story: 'This red sandstone caught my eye during a canyon hike in Sedona. I painted geometric patterns inspired by indigenous art of the Southwest. The stone still carries the warmth of the desert sun.',
                        photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=1600&fit=crop',
                        latitude: 34.8697,
                        longitude: -111.7610,
                        locationType: 'Trail',
                        locationName: 'Red Rock Trail, Sedona',
                        materials: 'Red Sandstone, Acrylic',
                        dateCreated: '2024-10-18',
                        findCount: 5,
                        distance: '1.2 miles'
                    },
                    {
                        id: 3,
                        artistId: 1,
                        artistName: 'Sarah Martinez',
                        artistPhoto: 'https://i.pravatar.cc/200?img=1',
                        title: 'Autumn Feather',
                        story: 'A hawk feather found during my morning walk in Central Park. I painted it with the colors of fall - deep burgundy, gold, and burnt orange. Nature\'s canvas painted by nature\'s palette.',
                        photoUrl: 'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=1200&h=1600&fit=crop',
                        latitude: 40.7829,
                        longitude: -73.9654,
                        locationType: 'Park',
                        locationName: 'Central Park, New York',
                        materials: 'Hawk Feather, Watercolor',
                        dateCreated: '2024-10-21',
                        findCount: 2,
                        distance: '0.8 miles'
                    }
                ];
                
                const drop = sampleArtDrops.find(d => d.id === dropId);
                if (!drop) return;
                
                const content = `
                    <div class="overlay-header">
                        <h3 style="margin: 0;">Location</h3>
                        <button class="close-overlay" onclick="app.closeOverlay('locationOverlay')">✕</button>
                    </div>
                    
                    <h2 style="margin-bottom: 0.5rem;">${drop.locationName}</h2>
                    <p style="color: var(--text-gray); margin-bottom: 2rem;">${drop.distance} away</p>
                    
                    <div class="mini-map-preview">
                        📍 Map Preview<br>
                        <small style="font-size: 0.8rem;">${drop.latitude.toFixed(4)}, ${drop.longitude.toFixed(4)}</small>
                    </div>
                    
                    <div style="background: var(--light-gray); padding: 1.5rem; border-radius: 12px; margin: 2rem 0;">
                        <div class="info-row">
                            <span class="info-label">Type</span>
                            <span class="info-value">${drop.locationType}</span>
                        </div>
                        <div class="info-row" style="border-bottom: none;">
                            <span class="info-label">Other Art Here</span>
                            <span class="info-value">View All →</span>
                        </div>
                    </div>
                    
                    <div class="overlay-action-grid">
                        <button class="overlay-action-btn primary" onclick="app.showToast('Opening directions...'); window.open('https://maps.google.com/?q=${drop.latitude},${drop.longitude}', '_blank');" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                            </svg>
                            Get Directions
                        </button>
                        <button class="overlay-action-btn" onclick="app.showToast('Following location!')" style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                            <svg class="icon icon-small" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            Follow Location
                        </button>
                    </div>
                `;
                
                document.getElementById('locationOverlayContent').innerHTML = content;
                document.getElementById('locationOverlay').classList.add('active');
            },
            
            closeOverlay(overlayId) {
                document.getElementById(overlayId).classList.remove('active');
            },

            renderPopularLocations() {
                // Sort locations by followers
                const sortedLocations = [...appState.locations].sort((a, b) => b.followerCount - a.followerCount);
                
                return `
                    <div class="container">
                        <h1 style="text-align: center; margin-bottom: 0.5rem; font-size: clamp(1.75rem, 5vw, 2.5rem);">Popular Locations</h1>
                        <p style="text-align: center; color: var(--text-gray); margin-bottom: 2rem; font-size: clamp(0.9rem, 2.5vw, 1.1rem);">Discover trending spots where art comes alive</p>
                        
                        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
                            <button class="btn btn-primary" onclick="app.sortLocations('followers')" style="min-height: 40px; padding: 0.5rem 1rem; font-size: 0.9rem;">Most Followers</button>
                            <button class="btn btn-secondary" onclick="app.sortLocations('drops')" style="min-height: 40px; padding: 0.5rem 1rem; font-size: 0.9rem;">Most Art</button>
                            <button class="btn btn-secondary" onclick="app.sortLocations('trending')" style="min-height: 40px; padding: 0.5rem 1rem; font-size: 0.9rem;">Trending</button>
                        </div>
                        
                        <div class="grid grid-3" id="locationsGrid">
                            ${sortedLocations.map(location => `
                                <div class="card card-interactive" onclick="app.showPage('location-detail', {locationId: ${location.id}})">
                                    ${location.featuredPhotos && location.featuredPhotos.length > 0 ? `
                                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2px; height: 200px; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0; overflow: hidden;">
                                            ${location.featuredPhotos.slice(0, 4).map(photo => `
                                                <img src="${photo}" alt="Art at ${location.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                            `).join('')}
                                            ${location.featuredPhotos.length < 4 ? '<div style="background: var(--light-gray);"></div>'.repeat(4 - location.featuredPhotos.length) : ''}
                                        </div>
                                    ` : `
                                        <div style="height: 200px; background: var(--light-gray); display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: -20px -20px 20px -20px; border-radius: 8px 8px 0 0;">📍</div>
                                    `}
                                    <div style="padding: 0;">
                                        <h3 style="font-size: 1.15rem; font-weight: 600; margin-bottom: 0.5rem;">${location.name}</h3>
                                        <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 1rem;">${location.city}, ${location.state}</p>
                                        <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--text-gray); flex-wrap: wrap;">
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                                    <circle cx="9" cy="7" r="4"/>
                                                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                                                </svg>
                                                ${location.followerCount}
                                            </span>
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
                                                </svg>
                                                ${location.activeDropCount} drops
                                            </span>
                                            <span style="display: flex; align-items: center; gap: 4px;">
                                                <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <circle cx="12" cy="10" r="3"/>
                                                    <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
                                                </svg>
                                                ${location.distance}
                                            </span>
                                        </div>
                                        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                                            <button class="btn btn-primary" onclick="app.toggleFollowLocation(${location.id}); event.stopPropagation();" style="flex: 1; min-height: 40px; font-size: 0.85rem; padding: 0.5rem;">Follow</button>
                                            <button class="btn btn-secondary" onclick="window.open('https://maps.google.com/?q=${location.latitude},${location.longitude}', '_blank'); event.stopPropagation();" style="flex: 1; min-height: 40px; font-size: 0.85rem; padding: 0.5rem;">Map</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            },

            renderLocationDetail(locationId) {
                const location = appState.locations.find(l => l.id === locationId);
                if (!location) {
                    return '<div class="container"><p>Location not found</p></div>';
                }
                
                const artAtLocation = appState.artDrops.filter(d => 
                    d.latitude === location.latitude && d.longitude === location.longitude
                );
                
                const isFollowing = appState.currentUser && appState.follows.some(
                    f => f.followerId === appState.currentUser.id && f.targetType === 'location' && f.targetId === location.id
                );
                
                return `
                    <div class="container" style="max-width: 1200px;">
                        <div style="margin-bottom: 3rem;">
                            ${location.featuredPhotos && location.featuredPhotos.length > 0 ? `
                                <div style="width: 100%; height: 400px; background: var(--light-gray); overflow: hidden; margin-bottom: 2rem;">
                                    <img src="${location.featuredPhotos[0]}" alt="${location.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                </div>
                            ` : `
                                <div style="width: 100%; height: 400px; background: var(--light-gray); display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;">
                                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                            `}
                            
                            <h1 style="margin-bottom: 0.5rem;">${location.name}</h1>
                            <p style="color: var(--text-gray); font-size: 1.1rem; margin-bottom: 2rem;">${location.address}, ${location.city}, ${location.state}</p>
                            
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap; align-items: center; margin-bottom: 3rem;">
                                <div style="display: flex; gap: 2rem;">
                                    <div>
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary-black);">${location.followerCount}</div>
                                        <div style="color: var(--text-gray); font-size: 0.9rem;">Followers</div>
                                    </div>
                                    <div>
                                        <div style="font-size: 2rem; font-weight: 600; color: var(--primary-black);">${location.activeDropCount}</div>
                                        <div style="color: var(--text-gray); font-size: 0.9rem;">Active Drops</div>
                                    </div>
                                </div>
                                ${appState.currentUser ? `
                                    <button class="btn btn-${isFollowing ? 'secondary' : 'primary'}" onclick="app.toggleFollowLocation(${location.id})" style="min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        ${isFollowing ? 'Unfollow' : '<svg class="icon icon-small" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Follow Location'}
                                    </button>
                                ` : ''}
                                <button class="btn btn-secondary" onclick="window.open('https://maps.google.com/?q=${location.latitude},${location.longitude}', '_blank')" style="min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <svg class="icon icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                                    </svg>
                                    Get Directions
                                </button>
                            </div>
                        </div>
                        
                        <h2 style="margin-bottom: 2rem;">Art at This Location (${artAtLocation.length})</h2>
                        ${artAtLocation.length > 0 ? `
                            <div class="grid grid-3">
                                ${artAtLocation.map(drop => this.renderDropCard(drop)).join('')}
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 3rem; background: var(--light-gray);">
                                <p style="color: var(--text-gray);">No art drops at this location yet</p>
                            </div>
                        `}
                    </div>
                `;
            },

            sortLocations(sortBy) {
                let sorted = [...appState.locations];
                if (sortBy === 'followers') {
                    sorted.sort((a, b) => b.followerCount - a.followerCount);
                } else if (sortBy === 'drops') {
                    sorted.sort((a, b) => b.activeDropCount - a.activeDropCount);
                } else if (sortBy === 'trending') {
                    sorted.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
                }
                this.showToast('Sorted by ' + sortBy);
            },

            showMapForLocation(locationId) {
                const location = appState.locations.find(l => l.id === locationId);
                if (location) {
                    window.open(`https://maps.google.com/?q=${location.latitude},${location.longitude}`, '_blank');
                }
            },

            renderMyCollection() {
                if (!appState.currentUser || appState.currentUser.userType !== 'finder') {
                    this.showPage('finder-login');
                    return;
                }
                
                const foundArtItems = appState.artDrops.filter(d => 
                    appState.currentUser.foundArt.includes(d.id)
                );
                
                const followedArtists = appState.artists.filter(a => 
                    appState.currentUser.followedArtists.includes(a.id)
                );
                
                const followedLocations = appState.locations.filter(l => 
                    appState.currentUser.followedLocations.includes(l.id)
                );
                
                return `
                    <div class="container">
                        <h1 style="margin-bottom: 0.5rem;">My Collection</h1>
                        <p style="color: var(--text-gray); margin-bottom: 2rem; font-size: 1rem;">Your discovered treasures and followed artists</p>
                        
                        <div class="stats-grid" style="margin-bottom: 3rem;">
                            <div class="stat-card">
                                <div class="stat-value">${appState.currentUser.totalFinds}</div>
                                <div class="stat-label">Art Pieces Found</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${followedArtists.length}</div>
                                <div class="stat-label">Artists Followed</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">${followedLocations.length}</div>
                                <div class="stat-label">Locations Followed</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap; justify-content: center;">
                            <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 48px;">Find More Art</button>
                            <button class="btn btn-secondary" onclick="app.showPage('edit-profile')" style="min-height: 48px;">Edit Profile</button>
                            <button class="btn btn-secondary" onclick="app.logout()" style="min-height: 48px;">Logout</button>
                        </div>
                        
                        <h2 style="margin-bottom: 2rem;">Found Art (${foundArtItems.length})</h2>
                        ${foundArtItems.length > 0 ? `
                            <div class="grid grid-3">
                                ${foundArtItems.map(drop => this.renderDropCard(drop)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="M21 21l-4.35-4.35"/>
                                    </svg>
                                </div>
                                <div class="empty-state-title">No art found yet</div>
                                <p class="empty-state-text">Start discovering art to build your collection</p>
                                <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 48px;">Start Exploring</button>
                            </div>
                        `}
                        
                        <h2 style="margin: 5rem 0 2rem;">Following</h2>
                        <div style="display: grid; gap: 2rem;">
                            ${followedArtists.length > 0 ? `
                                <div>
                                    <h3 style="margin-bottom: 1.5rem;">Artists (${followedArtists.length})</h3>
                                    <div style="display: grid; gap: 1.5rem;">
                                        ${followedArtists.map(artist => `
                                            <div style="display: flex; gap: 2rem; align-items: center; padding: 1.5rem; background: var(--light-gray);">
                                                <img src="${artist.profilePhoto}" alt="${artist.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-black);">
                                                <div style="flex: 1;">
                                                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">${artist.name}</div>
                                                    <div style="font-size: 0.9rem; color: var(--text-gray);">${artist.bio}</div>
                                                </div>
                                                <button class="btn btn-secondary" onclick="app.toggleFollowArtist(${artist.id})" style="min-height: 40px; padding: 0.5rem 1.5rem;">Unfollow</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${followedLocations.length > 0 ? `
                                <div>
                                    <h3 style="margin-bottom: 1.5rem;">Locations (${followedLocations.length})</h3>
                                    <div style="display: grid; gap: 1.5rem;">
                                        ${followedLocations.map(location => `
                                            <div style="display: flex; gap: 2rem; align-items: center; padding: 1.5rem; background: var(--light-gray);">
                                                <div style="display: flex; align-items: center; justify-content: center;">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                </div>
                                                <div style="flex: 1;">
                                                    <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">${location.name}</div>
                                                    <div style="font-size: 0.9rem; color: var(--text-gray);">${location.followerCount} followers</div>
                                                </div>
                                                <button class="btn btn-secondary" onclick="app.toggleFollowLocation(${location.id})" style="min-height: 40px; padding: 0.5rem 1.5rem;">Unfollow</button>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            },

            downloadQRTemplate(templateType, dropId) {
                const drop = appState.artDrops.find(d => d.id === dropId);
                const dimensions = {
                    sticker: '2x2 inches',
                    card: '3x4 inches',
                    bookmark: '2x6 inches',
                    poster: '8.5x11 inches'
                };
                
                this.showToast(`Downloading ${templateType} template (${dimensions[templateType]})`);
                console.log('Download QR template:', { templateType, dropId, drop });
                
                alert(`In production, this would download a ${dimensions[templateType]} branded QR template for "${drop.title}".\n\nThe template would include:\n- ArtDrops branding\n- QR code linking to: https://artdrops.com/art/${dropId}\n- Art title and artist name\n- "Scan to unlock the story" tagline`);
            },

            generateQRCode(dropId) {
                const container = document.getElementById('qrcode');
                if (container && typeof QRCode !== 'undefined') {
                    container.innerHTML = '';
                    // Adjust QR code size based on screen width
                    const isMobile = window.innerWidth < 768;
                    const qrSize = isMobile ? 200 : 256;
                    new QRCode(container, {
                        text: `https://artdrops.app/drop/${dropId}`,
                        width: qrSize,
                        height: qrSize,
                        colorDark: '#000000',
                        colorLight: '#FFFFFF'
                    });
                }
            },

            // ============================================
            // MAP INITIALIZATION
            // ============================================

            initLandingMap() {
                // Not using map on landing for minimalist approach
            },

            initBrowseMap() {
                if (typeof L === 'undefined') {
                    console.error('Leaflet library not loaded');
                    return;
                }
                const mapEl = document.getElementById('browseMap');
                if (!mapEl) {
                    console.error('Map element not found');
                    return;
                }
                
                try {
                    // Center on user location if available, otherwise default
                    const centerLat = appState.userLocation ? appState.userLocation.latitude : 39.8283;
                    const centerLon = appState.userLocation ? appState.userLocation.longitude : -98.5795;
                    const zoomLevel = appState.userLocation ? 10 : 4;
                    
                    const map = L.map('browseMap').setView([centerLat, centerLon], zoomLevel);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(map);
                    
                    // Force map to refresh size
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                    
                    // Add user location marker if available
                    let userMarker = null;
                    if (appState.userLocation) {
                        userMarker = L.marker([appState.userLocation.latitude, appState.userLocation.longitude], {
                            icon: L.divIcon({
                                className: 'user-location-marker',
                                html: '<div style="background: #000; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>',
                                iconSize: [24, 24]
                            })
                        }).addTo(map);
                        userMarker.bindPopup('You are here');
                    }
                    
                    // Add Locate Me button
                    const locateControl = L.control({ position: 'bottomright' });
                    locateControl.onAdd = function(map) {
                        const div = L.DomUtil.create('div', 'locate-me-btn');
                        div.innerHTML = '<button style="background: var(--primary-black); color: var(--primary-white); border: none; padding: 12px; border-radius: 50%; width: 48px; height: 48px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></button>';
                        div.onclick = function() {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        appState.userLocation = {
                                            latitude: position.coords.latitude,
                                            longitude: position.coords.longitude
                                        };
                                        map.setView([position.coords.latitude, position.coords.longitude], 13);
                                        if (userMarker) {
                                            map.removeLayer(userMarker);
                                        }
                                        userMarker = L.marker([position.coords.latitude, position.coords.longitude], {
                                            icon: L.divIcon({
                                                className: 'user-location-marker',
                                                html: '<div style="background: #000; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>',
                                                iconSize: [24, 24]
                                            })
                                        }).addTo(map);
                                        userMarker.bindPopup('You are here').openPopup();
                                    },
                                    (error) => {
                                        alert('Unable to get your location. Please enable location services.');
                                    }
                                );
                            } else {
                                alert('Geolocation is not supported by your browser.');
                            }
                        };
                        return div;
                    };
                    locateControl.addTo(map);
                
                appState.artDrops.forEach(drop => {
                    const iconColor = drop.status === 'active' ? '#000000' : '#666666';
                    
                    // Calculate distance if user location available
                    let distanceText = '';
                    if (appState.userLocation) {
                        const distance = this.calculateDistance(
                            appState.userLocation.latitude,
                            appState.userLocation.longitude,
                            drop.latitude,
                            drop.longitude
                        );
                        distanceText = `<p style="font-size: 0.85rem; color: #666666; margin: 0.5rem 0; display: flex; align-items: center; gap: 4px; justify-content: center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> ${this.formatDistance(distance)}</p>`;
                    }
                    
                    const marker = L.marker([drop.latitude, drop.longitude]).addTo(map);
                    marker.bindPopup(`
                        <div style="text-align: center; min-width: 180px;">
                            <img src="${drop.photoUrl}" style="width: 150px; height: 100px; object-fit: cover; margin-bottom: 1rem; border: 1px solid #E0E0E0;">
                            <h4 style="margin: 0.5rem 0; color: #000000;">${drop.title}</h4>
                            <p style="font-size: 0.85rem; color: #666666; margin: 0.5rem 0;">by ${drop.artistName}</p>
                            ${distanceText}
                            <span style="background: ${drop.status === 'active' ? '#FFFFFF' : '#000000'}; color: ${drop.status === 'active' ? '#000000' : '#FFFFFF'}; padding: 0.5rem 1rem; border: 1px solid #000000; font-size: 0.75rem; display: inline-block; margin: 1rem 0;">${drop.status === 'active' ? 'Active' : 'Found'}</span>
                            <button onclick="app.showPage('art-story', {dropId: ${drop.id}})" style="margin-top: 1rem; padding: 1rem; background: #000000; color: #FFFFFF; border: none; cursor: pointer; width: 100%; font-weight: 600;">View Story</button>
                        </div>
                    `);
                });
                    // Add click handler for markers
                    map.on('popupopen', function() {
                        // Ensure buttons in popups work
                        const popupButtons = document.querySelectorAll('.leaflet-popup button');
                        popupButtons.forEach(btn => {
                            btn.style.cursor = 'pointer';
                        });
                    });
                } catch (error) {
                    console.error('Error initializing browse map:', error);
                }
            },

            initDropLocationMap() {
                if (typeof L === 'undefined') {
                    console.error('Leaflet library not loaded');
                    return;
                }
                const mapEl = document.getElementById('dropLocationMap');
                if (!mapEl) {
                    console.error('Drop location map element not found');
                    return;
                }
                
                try {
                    const map = L.map('dropLocationMap').setView([40.7589, -73.9851], 10);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(map);
                    
                    // Force map to refresh size
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                
                let marker = L.marker([40.7589, -73.9851]).addTo(map);
                
                    map.on('click', (e) => {
                        map.removeLayer(marker);
                        marker = L.marker(e.latlng).addTo(map);
                        document.getElementById('dropLatitude').value = e.latlng.lat.toFixed(6);
                        document.getElementById('dropLongitude').value = e.latlng.lng.toFixed(6);
                    });
                    
                    this.dropLocationMapInstance = map;
                } catch (error) {
                    console.error('Error initializing drop location map:', error);
                }
            },

            updateDropLocationMap(lat, lng) {
                if (this.dropLocationMapInstance) {
                    try {
                        this.dropLocationMapInstance.setView([lat, lng], 13);
                        L.marker([lat, lng]).addTo(this.dropLocationMapInstance);
                        this.dropLocationMapInstance.invalidateSize();
                    } catch (error) {
                        console.error('Error updating drop location map:', error);
                    }
                }
            },

            initArtStoryMap(dropId) {
                if (typeof L === 'undefined') {
                    console.error('Leaflet library not loaded');
                    return;
                }
                const mapEl = document.getElementById('artStoryMap');
                if (!mapEl) {
                    console.error('Art story map element not found');
                    return;
                }
                
                try {
                    const drop = appState.artDrops.find(d => d.id === dropId);
                    if (!drop) {
                        console.error('Drop not found:', dropId);
                        return;
                    }
                    
                    const map = L.map('artStoryMap').setView([drop.latitude, drop.longitude], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors',
                        maxZoom: 19
                    }).addTo(map);
                    
                    // Force map to refresh size
                    setTimeout(() => {
                        map.invalidateSize();
                    }, 100);
                    
                    L.marker([drop.latitude, drop.longitude]).addTo(map)
                        .bindPopup(`<strong>${drop.locationName}</strong><br>${drop.title}`);
                } catch (error) {
                    console.error('Error initializing art story map:', error);
                }
            }
        };

        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => app.init());
        } else {
            app.init();
        }
