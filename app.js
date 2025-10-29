// ============================================
// FIREBASE SETUP - ADD AT VERY TOP OF FILE
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
    deleteDoc,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    query, 
    where, 
    orderBy, 
    limit,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';


// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2dBIb4rNczPQAxsyh-UkKSJrp0gLrnKA",
  authDomain: "art-drops-production.firebaseapp.com",
  projectId: "art-drops-production",
  storageBucket: "art-drops-production.firebasestorage.app",
  messagingSenderId: "738166123505",
  appId: "1:738166123505:web:2e938dc32c436bcd693250",
  measurementId: "G-FKDW0NSDQY"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

console.log("✅ Firebase initialized successfully!");

// ============================================
// FIREBASE AUTH LISTENER
// ============================================

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User signed in:", user.email);
        // Will update appState when user loads a page
    } else {
        console.log("✅ User signed out");
    }
});

// ============================================
// FIREBASE HELPER FUNCTIONS
// ============================================

async function ensureUserDocument(user) {
    try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            // Create COMPLETE user profile with ALL required fields
            const completeProfile = {
                // Core identity
                userId: user.uid,
                id: user.uid,
                name: user.displayName || 'Artist',
                email: user.email,
                profilePhoto: user.photoURL || 'https://i.pravatar.cc/200?img=1',
                
                // User type
                userType: 'artist',
                
                // Bio & location
                bio: '',
                city: '',
                
                // Social media
                instagram: '',
                tiktok: '',
                facebook: '',
                website: '',
                
                // Stats
                followerCount: 0,
                totalDonations: 0,
                activeDrops: 0,
                
                // Art collection (for finders)
                foundArt: [],
                followedArtists: [],
                followedLocations: [],
                totalFinds: 0,
                
                // Timestamps
                joinDate: new Date().toISOString().split('T'),
                createdAt: serverTimestamp()
            };
            
            await setDoc(userRef, completeProfile);
            console.log('✅ Complete user profile created for:', user.email);
            
            return completeProfile;
        } else {
            console.log('✅ User profile already exists');
            return { id: user.uid, ...userSnap.data() };
        }
    } catch (error) {
        console.error('❌ Error ensuring user document:', error);
        throw error;
    }
}

async function getFirebaseArtDrops(filters = {}) {
    try {
        const constraints = [];
        
        if (filters.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters.artistId) {
            constraints.push(where('artistId', '==', filters.artistId));
        }
        
        constraints.push(orderBy('dateCreated', 'desc'));
        constraints.push(limit(filters.limit || 50));
        
        const q = query(collection(db, 'artDrops'), ...constraints);
        const snapshot = await getDocs(q);
        
        const artDrops = [];
        snapshot.forEach(docSnap => {
            artDrops.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        console.log("✅ Loaded", artDrops.length, "art drops from Firebase");
        return artDrops;
    } catch (error) {
        console.error("❌ Error loading art drops:", error);
        return [];
    }
}

async function getFirebaseLocations() {
    try {
        const q = query(collection(db, 'locations'), orderBy('followerCount', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        const locations = [];
        snapshot.forEach(docSnap => {
            locations.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        return locations;
    } catch (error) {
        console.error("❌ Error loading locations:", error);
        return [];
    }
}
async function getFirebaseArtists() {
    try {
        const q = query(collection(db, 'users'), where('userType', '==', 'artist'));
        const snapshot = await getDocs(q);
        const artists = [];
        snapshot.forEach((docSnap) => {
            artists.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        console.log("✅ Loaded", artists.length, "artists from Firebase");
        return artists;
    } catch (error) {
        console.error("❌ Error loading artists:", error);
        return [];
    }
}

async function uploadPhotoToStorage(file) {
    try {
        console.log('🚀 uploadPhotoToStorage called');
        console.log('   File name:', file?.name);
        console.log('   File size:', file?.size);
        console.log('   File type:', file?.type);
        
        if (!file) {
            throw new Error('No file provided');
        }

        if (!file.size) {
            throw new Error('File is empty');
        }

        console.log('✅ File is valid, uploading...');

        const userId = auth.currentUser.uid;
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `artDrops/${userId}/${fileName}`;
        
        console.log('   Storage path:', storagePath);

        // Create reference
        const storageRef = ref(storage, storagePath);

        // Upload file
        const uploadResult = await uploadBytes(storageRef, file);
        console.log('✅ Upload successful:', uploadResult.metadata.fullPath);

        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        console.log('✅ Got download URL');
        
        return downloadURL;

    } catch (error) {
        console.error('❌ Upload error:', error);
        console.error('   Error message:', error.message);
        console.error('   Error code:', error.code);
        throw error;
    }
}

async function createArtDropInFirebase(dropData) {
    try {
       
        if (!auth.currentUser) {
            throw new Error('User must be logged in');
        }

        console.log('💾 Creating art drop in Firestore...');

        const artDropData = {
            // Artist
            artistId: auth.currentUser.uid,
            artistName: dropData.artistName || appState.currentUser?.name || 'Anonymous',
            
            // Art
            title: dropData.title,
            story: dropData.story,
            photoUrl: dropData.photoUrl,
            materials: dropData.materials || '',
            
            // Location
            locationName: dropData.locationName,
            latitude: dropData.latitude,
            longitude: dropData.longitude,
            locationType: dropData.locationType,
            
            // Geocoded data
            city: dropData.city,
            state: dropData.state,
            zipCode: dropData.zipCode,
            country: dropData.country,
            
            // Status
            status: 'active',
            foundCount: 0,
            totalDonations: 0,
            findEvents: [],
            
            // Timestamp
            dateCreated: serverTimestamp()
        };

        const artDropRef = await addDoc(collection(db, 'artDrops'), artDropData);
        console.log('✅ Art drop created:', artDropRef.id);

        return artDropRef;

    } catch (error) {
        console.error('❌ Error creating art drop:', error);
        throw error;
    }
}


// ============================================
// FIREBASE DATA LOADERS - Update appState Cache
// ============================================

async function loadArtDropsFromFirebase() {
    try {
        console.log("Loading art drops from Firebase...");
        const artDrops = await getFirebaseArtDrops({ status: 'active' });
        
        if (artDrops && artDrops.length > 0) {
            appState.artDrops = artDrops;
            console.log("✅ Loaded", artDrops.length, "art drops from Firebase");
        } else {
            console.log("⚠️ No art drops found in Firebase, using demo data");
        }
    } catch (error) {
        console.error("❌ Error loading art drops:", error);
        console.log("Using demo data from appState");
    }
}
async function loadArtistsFromFirebase() {
    try {
        console.log("🔄 Loading artists from Firebase...");
        const artists = await getFirebaseArtists();
        
        if (artists && artists.length > 0) {
            // Merge with demo artists (keep both)
            const demoArtists = appState.artists.filter(a => typeof a.id === 'number');
            appState.artists = [...demoArtists, ...artists];
            console.log("✅ Loaded", artists.length, "artists from Firebase");
            return artists;
        } else {
            console.log("⚠️ No artists found in Firebase, using demo data");
            return appState.artists;
        }
    } catch (error) {
        console.error("❌ Error loading artists:", error);
        console.log("Using demo data from appState");
        return appState.artists;
    }
}
async function loadLocationsFromFirebase() {
    try {
        console.log("Loading locations from Firebase...");
        const locations = await getFirebaseLocations();
        
        if (locations && locations.length > 0) {
            appState.locations = locations;
            console.log("✅ Loaded", locations.length, "locations from Firebase");
        } else {
            console.log("⚠️ No locations found in Firebase, using demo data");
        }
    } catch (error) {
        console.error("❌ Error loading locations:", error);
        console.log("Using demo data from appState");
    }
}

async function loadPopularLocationsFromFirebase() {
    try {
        console.log("Loading popular locations from Firebase...");
        const locations = await getFirebaseLocations();
        
        if (locations && locations.length > 0) {
            // Sort by follower count to get "popular"
            appState.locations = locations.sort((a, b) => 
                (b.followerCount || 0) - (a.followerCount || 0)
            );
            console.log("✅ Loaded popular locations from Firebase");
        }
    } catch (error) {
        console.error("❌ Error loading popular locations:", error);
    }
}



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
    console.log('🚀 Initializing ArtDrops app...');
    
    this.requestLocationPermission();
    
    // Load Firebase data in the background
    (async () => {
        try {
            console.log('🔄 Loading Firebase data...');
            
            // Load all datasets in parallel with proper error handling
            const [artDrops, locations, artists] = await Promise.all([
                loadArtDropsFromFirebase().catch(err => {
                    console.error('Error loading art drops:', err);
                    return []; // Return empty array on error
                }),
                loadLocationsFromFirebase().catch(err => {
                    console.error('Error loading locations:', err);
                    return []; // Return empty array on error
                }),
                loadArtistsFromFirebase().catch(err => {
                    console.error('Error loading artists:', err);
                    return []; // Return empty array on error
                })
            ]);
            
            console.log('✅ Firebase data loaded successfully');
            console.log('   - Art Drops:', artDrops?.length || 0);    // Safe access with fallback
            console.log('   - Locations:', locations?.length || 0);    // Safe access with fallback
            console.log('   - Artists:', artists?.length || 0);        // Safe access with fallback
            
        } catch (error) {
            console.error('❌ Error loading Firebase data:', error);
            console.log('⚠️ Using demo data from appState');
        }
    })();
    
    this.showPage('landing');
    this.updateNav();
    
    console.log('✅ App initialized');
},
    useCurrentLocation() {
    if (!navigator.geolocation) {
        this.showToast('Geolocation not supported');
        return;
    }

    this.showLoadingOverlay('Getting your location...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Update coordinate inputs
            const latInput = document.querySelector('[name="latitude"]');
            const lonInput = document.querySelector('[name="longitude"]');
            
            if (latInput) latInput.value = lat.toFixed(6);
            if (lonInput) lonInput.value = lng.toFixed(6);

            // Reverse geocode to get address details
            const locationData = await this.reverseGeocode(lat, lng);
            
            if (locationData) {
                // Update hidden fields
                document.getElementById('geocodedCity').value = locationData.city;
                document.getElementById('geocodedState').value = locationData.state;
                document.getElementById('geocodedZip').value = locationData.zipCode;
                document.getElementById('geocodedCountry').value = locationData.country;
                
                // If no location name provided, auto-fill with city, state, zip
                const locationNameInput = document.querySelector('[name="locationName"]');
                if (locationNameInput && !locationNameInput.value) {
                    const autoName = `${locationData.city}, ${locationData.state} ${locationData.zipCode}`;
                    locationNameInput.value = autoName;
                    locationNameInput.placeholder = autoName;
                }
                
                // Show location details
                const detailsDiv = document.getElementById('locationDetails');
                const addressDiv = document.getElementById('locationAddress');
                if (detailsDiv && addressDiv) {
                    addressDiv.innerHTML = `
                        <div style="margin-bottom: 0.5rem;"><strong>Address:</strong> ${locationData.formattedAddress}</div>
                        <div><strong>City:</strong> ${locationData.city}, ${locationData.state} ${locationData.zipCode}</div>
                    `;
                    detailsDiv.style.display = 'block';
                }
                
                console.log('✅ Location geocoded:', locationData);
            }

            // Update map
            if (this.dropLocationMapInstance) {
                this.updateDropLocationMap(lat, lng);
            }

            this.hideLoadingOverlay();
            this.showToast('✅ Location captured & geocoded!');
        },
        (error) => {
            console.error('Geolocation error:', error);
            this.hideLoadingOverlay();
            this.showToast('Unable to get location');
        }
    );
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

    showLoadingOverlay(message = 'Loading...') {
    // Remove any existing overlay
    const existing = document.getElementById('loadingOverlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    overlay.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; text-align: center;">
            <div style="width: 40px; height: 40px; border: 3px solid #ddd; border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
        <style>
            @keyframes spin { to { transform: rotate(360deg); } }
        </style>
    `;
    
    document.body.appendChild(overlay);
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

  showPage(page, data) {
    appState.currentPage = page;
    const appContainer = document.getElementById('app');
    
    // Use async IIFE to load data from Firebase before rendering
    (async () => {
        try {
            switch(page) {
                // PAGES THAT NEED FIREBASE DATA
                
                case 'my-drops':
                    if (!appState.currentUser) {
                        this.showPage('artist-login');
                        return;
                    }
                    await loadArtDropsFromFirebase();
                    appContainer.innerHTML = this.renderMyDrops();
                    break;
                    
                case 'popular-locations':
                    await loadPopularLocationsFromFirebase();
                    appContainer.innerHTML = this.renderPopularLocations();
                    break;
                    
                case 'feed':
                    if (!appState.currentUser) {
                        this.showPage('finder-login');
                        return;
                    }
                    await loadArtDropsFromFirebase();
                    appContainer.innerHTML = this.renderFeed();
                    break;
                    
                case 'browse-map':
                    await loadArtDropsFromFirebase();
                    appContainer.innerHTML = this.renderBrowseMap();
                    setTimeout(() => this.initBrowseMap(), 300);
                    break;
                    
                case 'artist-dashboard':
                    if (!appState.currentUser) {
                        this.showPage('artist-login');
                        return;
                    }
                    await loadArtDropsFromFirebase();
                    appContainer.innerHTML = this.renderArtistDashboard();
                    break;
                    
                case 'my-collection':
                    if (!appState.currentUser) {
                        this.showPage('finder-login');
                        return;
                    }
                    await loadArtDropsFromFirebase();
                    appContainer.innerHTML = this.renderMyCollection();
                    break;
                
                // PAGES THAT DON'T NEED FIREBASE (Synchronous)
                
                case 'landing':
                    loadArtDropsFromFirebase().catch(err => console.log("Background load:", err));
                    loadLocationsFromFirebase().catch(err => console.log("Background load:", err));
                    appContainer.innerHTML = this.renderLanding();
                    setTimeout(() => this.initLandingMap(), 200);
                    break;
                    
                case 'home':
                    if (!appState.currentUser) {
                        this.showPage('landing');
                        return;
                    }
                    appContainer.innerHTML = this.renderHome();
                    break;
                    
                case 'artist-login':
                    appContainer.innerHTML = this.renderArtistLogin();
                    break;
                    
                case 'artist-signup':
                    appContainer.innerHTML = this.renderArtistSignup();
                    break;
                    
                case 'finder-login':
                    appContainer.innerHTML = this.renderFinderLogin();
                    break;
                    
                case 'finder-signup':
                    appContainer.innerHTML = this.renderFinderSignup();
                    break;
                    
                case 'drop-new-art':
                    if (!appState.currentUser) {
                        this.showPage('artist-login');
                        return;
                    }
                    appContainer.innerHTML = this.renderDropNewArt();
                    setTimeout(() => this.initDropLocationMap(), 300);
                    break;
                    
                case 'qr-tag-generator':
                    if (!data || !data.dropId) {
                        console.warn("No dropId provided");
                        this.showPage('home');
                        return;
                    }
                    appContainer.innerHTML = this.renderQRTagGenerator(data.dropId);
                    setTimeout(() => this.generateQRCode(data.dropId), 200);
                    break;
                    
                case 'art-story':
                    if (!data || !data.dropId) {
                        console.warn("No dropId provided");
                        this.showPage('browse-map');
                        return;
                    }
                    // Load both art drops AND artists from Firebase before rendering
                    await Promise.all([
                        loadArtDropsFromFirebase(),
                        loadArtistsFromFirebase() // ← Make sure you add this loader function per earlier instructions!
                    ]);
                    appContainer.innerHTML = this.renderArtStory(data.dropId);
                    setTimeout(() => this.initArtStoryMap(data.dropId), 300);
                    break;
                    
                case 'found-confirmation':
                if (!data || !data.dropId) {
                    this.showPage('browse-map');
                    return;
                }
                // Load art drops to ensure latest data
                await loadArtDropsFromFirebase();
                appContainer.innerHTML = this.renderFoundConfirmation(data.dropId);
                break;
                    
                case 'donation-flow':
                if (!data || !data.dropId) {
                    this.showPage('browse-map');
                    return;
                }
                // Load art drops to ensure latest donation info
                await loadArtDropsFromFirebase();
                appContainer.innerHTML = this.renderDonationFlow(data.dropId);
                break;
                    
                case 'thank-you':
                if (!data || !data.dropId) {
                    this.showPage('browse-map');
                    return;
                }
                // Load art drops to show updated donation totals
                await loadArtDropsFromFirebase();
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
                    if (!appState.currentUser) {
                        this.showPage('artist-login');
                        return;
                    }
                    appContainer.innerHTML = this.renderEditProfile();
                    break;
                    
                case 'artist-profile':
                if (!data || !data.artistId) {
                    console.warn("No artistId provided");
                    this.showPage('home');
                    return;
                }
                // Load both art drops AND artists from Firebase
                await Promise.all([
                    loadArtDropsFromFirebase(),
                    loadArtistsFromFirebase()
                ]);
                appContainer.innerHTML = this.renderArtistProfile(data.artistId);
                setTimeout(() => this.initArtistMapPreview(data.artistId), 300);
                break;
                    
                case 'finder-profile':
                    if (!data || !data.finderId) {
                        console.warn("No finderId provided");
                        this.showPage('my-collection');
                        return;
                    }
                    appContainer.innerHTML = this.renderFinderProfile(data.finderId);
                    break;
                    
                case 'location-detail':
                    if (!data || !data.locationId) {
                        console.warn("No locationId provided");
                        this.showPage('popular-locations');
                        return;
                    }
                    await loadArtDropsFromFirebase();
                    await loadLocationsFromFirebase();
                    appContainer.innerHTML = this.renderLocationDetail(data.locationId);
                    break;
                
                default:
                    console.warn("Unknown page:", page);
                    appContainer.innerHTML = `<div class="container"><p>Page not found.</p></div>`;
            }
        } catch (error) {
            console.error("Error loading page:", page, error);
            appContainer.innerHTML = `
                <div class="container" style="text-align: center; padding: 3rem 1rem;">
                    <h2 style="margin-bottom: 1rem;">Error Loading Page</h2>
                    <p style="color: var(--text-gray); margin-bottom: 2rem;">
                        ${error.message || 'An unexpected error occurred. Please try again.'}
                    </p>
                    <button class="btn btn-primary" onclick="app.showPage('landing')" style="min-height: 48px;">
                        Go to Home
                    </button>
                </div>
            `;
        }
    })();
    
    this.updateNav();
    window.scrollTo(0, 0);
},
 async toggleFollowArtist(artistId) {
    if (!appState.currentUser) {
        this.showToast('Please sign in to follow artists');
        this.showPage('finder-login');
        return;
    }

    try {
        const followId = `${appState.currentUser.id}_artist_${artistId}`;
        const followRef = doc(db, 'follows', followId);
        const followSnap = await getDoc(followRef);

        if (followSnap.exists()) {
            // Unfollow
            await deleteDoc(followRef);
            
            // Decrement artist's follower count
            const artistRef = doc(db, 'users', artistId.toString());
            await updateDoc(artistRef, {
                followerCount: increment(-1)
            });
            
            // Update local cache
            const artist = appState.artists.find(a => String(a.id) === String(artistId));
            if (artist && artist.followerCount) {
                artist.followerCount--;
            }
            
            this.showToast('Unfollowed artist');
        } else {
            // Follow
            await setDoc(followRef, {
                followerId: appState.currentUser.id,
                targetType: 'artist',
                targetId: artistId.toString(),
                dateFollowed: serverTimestamp()
            });
            
            // Increment artist's follower count
            const artistRef = doc(db, 'users', artistId.toString());
            await updateDoc(artistRef, {
                followerCount: increment(1)
            });
            
            // Update local cache
            const artist = appState.artists.find(a => String(a.id) === String(artistId));
            if (artist) {
                artist.followerCount = (artist.followerCount || 0) + 1;
            }
            
            this.showToast('Following artist');
        }
        
        // Re-render current page to update follow button
        this.showPage(appState.currentPage, {artistId: artistId});
        
    } catch (error) {
        console.error('Error toggling artist follow:', error);
        this.showToast('Failed to update follow status');
    }
},
            
generateQRCode(dropId) {
    try {
        const qrcodeElement = document.getElementById('qrcode');
        
        if (!qrcodeElement) {
            console.error('QR code element not found');
            return;
        }
        
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            return;
        }
        
        // Clear any existing QR code
        qrcodeElement.innerHTML = '';
        
        // Generate QR code with drop URL
        const qrText = 'https://artdrops.app/drop/' + dropId;
        
        new QRCode(qrcodeElement, {
            text: qrText,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        
        console.log("✅ QR code generated for:", qrText);
        
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
    }
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
    switchPhotoTab(tab) {
    const urlTab = document.getElementById('photoUrlTab');
    const uploadTab = document.getElementById('photoUploadTab');
    const urlBtn = document.getElementById('urlTabBtn');
    const uploadBtn = document.getElementById('uploadTabBtn');
    
    if (tab === 'url') {
        urlTab.style.display = 'block';
        uploadTab.style.display = 'none';
        urlBtn.classList.add('btn-primary');
        urlBtn.classList.remove('btn-outline');
        uploadBtn.classList.remove('btn-primary');
        uploadBtn.classList.add('btn-outline');
        
        // Clear upload input
        const uploadInput = document.getElementById('dropPhotoInput');
        if (uploadInput) uploadInput.value = '';
    } else {
        urlTab.style.display = 'none';
        uploadTab.style.display = 'block';
        uploadBtn.classList.add('btn-primary');
        uploadBtn.classList.remove('btn-outline');
        urlBtn.classList.remove('btn-primary');
        urlBtn.classList.add('btn-outline');
        
        // Clear URL input
        const urlInput = document.getElementById('dropPhotoUrl');
        if (urlInput) urlInput.value = '';
    }
},
async reverseGeocode(lat, lng) { 
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ArtDrops App'
            }
        });
        
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            return {
                formattedAddress: data.display_name,
                city: addr.city || addr.town || addr.village || '',
                state: addr.state || '',
                zipCode: addr.postcode || '',
                country: addr.country_code?.toUpperCase() || ''
            };
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
},
async logout() {
    try {
        this.showLoadingOverlay('Signing out...');
        
        // Firebase sign out
        await firebaseSignOut(auth);
        
        // Clear appState
        appState.currentUser = null;
        
        this.hideLoadingOverlay();
        this.showToast('✅ Signed out successfully');
        this.showPage('landing');
        
    } catch (error) {
        console.error('❌ Logout error:', error);
        this.hideLoadingOverlay();
        this.showToast('❌ Logout failed');
    }
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
                                        <div class="card" style="cursor: pointer;" onclick="app.showPage('art-story', {dropId: '${drop.id}'})">
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
                                <div class="card card-interactive" onclick="app.showPage('location-detail', {locationId: '${location.id}'})">
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
                                            <button class="btn btn-primary" onclick="app.toggleFollowLocation('${location.id}'); event.stopPropagation();" style="flex: 1; min-height: 40px; font-size: 0.85rem; padding: 0.5rem;">Follow</button>
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
renderFoundConfirmation(dropId) {
    const drop = appState.artDrops.find(d => String(d.id) === String(dropId));
    if (!drop) {
        return `<div class="container"><p>Error: Art drop not found.</p></div>`;
    }

    return `
        <div class="container" style="max-width: 600px; text-align: center;">
            <div style="padding: 3rem 1.5rem;">
                <div style="width: 100px; height: 100px; background: var(--sage-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem;">
                    <svg style="width: 60px; height: 60px;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                
                <h1 style="margin-bottom: 1rem;">You Found It!</h1>
                <h2 style="color: var(--text-gray); font-weight: 400; margin-bottom: 3rem;">"${drop.title}"</h2>
                
                <form onsubmit="app.handleFoundSubmit(event, '${drop.id}')" style="text-align: left;">
                    <div class="form-group">
                        <label>Your Name (optional)</label>
                        <input type="text" class="form-control" name="finderName" placeholder="Anonymous">
                    </div>
                    
                    <div class="form-group">
                        <label>Leave a Message for the Artist</label>
                        <textarea class="form-control" name="message" rows="4" placeholder="Share your thoughts about this discovery..."></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px; margin-top: 1rem;">
                        Record Find
                    </button>
                </form>
                
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 2rem;">
                    Your find will be recorded and shared with ${drop.artistName}
                </p>
            </div>
        </div>
    `;
},
            renderDonationFlow(dropId) {
    const drop = appState.artDrops.find(d => String(d.id) === String(dropId));
    if (!drop) {
        return `<div class="container"><p>Error: Art drop not found.</p></div>`;
    }

    const artist = appState.artists.find(a => String(a.id) === String(drop.artistId));
    const artistName = artist ? artist.name : drop.artistName;

    return `
        <div class="container" style="max-width: 600px;">
            <h1 style="text-align: center; margin-bottom: 2rem;">Support ${artistName}</h1>
            
            <div class="card" style="margin-bottom: 2rem;">
                <img src="${drop.photoUrl}" alt="${drop.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
                <div class="card-content" style="padding: 1.5rem;">
                    <h3 style="margin: 0 0 0.5rem;">${drop.title}</h3>
                    <p style="color: var(--text-gray); margin: 0;">📍 ${drop.locationName}</p>
                </div>
            </div>
            
            <form onsubmit="app.handleDonation(event, '${drop.id}')">
                <h3 style="margin-bottom: 1rem;">Choose Amount</h3>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;">
                    <button type="button" class="donation-btn btn btn-outline" data-amount="3" onclick="app.selectDonationAmount(3, event)" style="min-height: 60px; font-size: 1.2rem; font-weight: 600;">$3</button>
                    <button type="button" class="donation-btn btn btn-outline" data-amount="5" onclick="app.selectDonationAmount(5, event)" style="min-height: 60px; font-size: 1.2rem; font-weight: 600;">$5</button>
                    <button type="button" class="donation-btn btn btn-outline" data-amount="10" onclick="app.selectDonationAmount(10, event)" style="min-height: 60px; font-size: 1.2rem; font-weight: 600;">$10</button>
                </div>
                
                <div class="form-group">
                    <label>Custom Amount</label>
                    <input type="number" id="customAmount" name="customAmount" class="form-control" placeholder="Enter amount" min="1" step="0.01">
                </div>
                
                <div class="form-group">
                    <label>Your Name (optional)</label>
                    <input type="text" class="form-control" name="donorName" placeholder="Anonymous">
                </div>
                
                <div class="form-group">
                    <label>Email for Receipt (optional)</label>
                    <input type="email" class="form-control" name="donorEmail" placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
                </div>
                
                <div class="form-group">
                    <label>Message to Artist (optional)</label>
                    <textarea class="form-control" name="message" rows="3" placeholder="Leave a message..."></textarea>
                </div>
                
                <div style="background: var(--light-gray); padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.9rem;">
                    <p style="margin: 0 0 0.5rem; color: var(--text-gray);">
                        <strong>Platform fee:</strong> ${(appState.platformCommission * 100).toFixed(0)}%
                    </p>
                    <p style="margin: 0; color: var(--text-gray);">
                        100% of the remaining amount goes directly to the artist.
                    </p>
                </div>
                
                <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px;">
                    💚 Support Artist
                </button>
            </form>
        </div>
    `;
},
            renderThankYou(dropId, amount) {
    const drop = appState.artDrops.find(d => String(d.id) === String(dropId));
    if (!drop) {
        return `<div class="container"><p>Error: Art drop not found.</p></div>`;
    }

    const artist = appState.artists.find(a => String(a.id) === String(drop.artistId));
    const artistName = artist ? artist.name : drop.artistName;

    return `
        <div class="container" style="max-width: 600px; text-align: center;">
            <div style="padding: 3rem 1.5rem;">
                <div style="width: 120px; height: 120px; background: var(--sage-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; font-size: 4rem;">
                    💚
                </div>
                
                <h1 style="margin-bottom: 1rem;">Thank You!</h1>
                <p style="color: var(--text-gray); font-size: 1.2rem; margin-bottom: 3rem;">
                    Your $${amount ? amount.toFixed(2) : '0.00'} donation supports ${artistName}
                </p>
                
                <div style="background: var(--light-gray); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: left;">
                    <h3 style="margin-bottom: 1rem;">What's Next?</h3>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="margin-bottom: 1rem; display: flex; gap: 1rem;">
                            <span style="color: var(--sage-green); font-size: 1.5rem;">✓</span>
                            <span>Your donation was recorded and ${artistName} has been notified</span>
                        </li>
                        <li style="margin-bottom: 1rem; display: flex; gap: 1rem;">
                            <span style="color: var(--sage-green); font-size: 1.5rem;">✓</span>
                            <span>Your find has been added to "${drop.title}"'s story</span>
                        </li>
                        <li style="display: flex; gap: 1rem;">
                            <span style="color: var(--sage-green); font-size: 1.5rem;">✓</span>
                            <span>Keep exploring to discover more hidden treasures!</span>
                        </li>
                    </ul>
                </div>
                
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button class="btn btn-primary" onclick="app.showPage('art-story', {dropId: '${drop.id}'})" style="min-height: 48px;">
                        View Art Story
                    </button>
                    <button class="btn btn-secondary" onclick="app.showPage('browse-map')" style="min-height: 48px;">
                        Find More Art
                    </button>
                </div>
                
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-top: 3rem;">
                    Want to spread more joy? Share this art with friends!
                </p>
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
                                <input type="email" class="form-control" name="email" required placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
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
                                <input type="email" class="form-control" name="email" required placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
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
        return '';
    }
    
    // SAFE ACCESS with fallback values
    const totalDonations = (appState.currentUser.totalDonations || 0).toFixed(2);
    const activeDrops = appState.currentUser.activeDrops || 0;
    
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
                    <div class="stat-value">${activeDrops}</div>
                    <div class="stat-label">Active Drops</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">$${totalDonations}</div>
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
        <div class="map-page">
            <!-- Mobile-Optimized Filter Toggle -->
            <button id="filterToggle" 
                    class="filter-toggle-btn" 
                    onclick="app.toggleMapFilters()"
                    style="position: fixed; top: 80px; right: 16px; z-index: 1000; background: white; border: 2px solid var(--primary-black); border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="4" y1="21" x2="4" y2="14"/>
                    <line x1="4" y1="10" x2="4" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12" y2="3"/>
                    <line x1="20" y1="21" x2="20" y2="16"/>
                    <line x1="20" y1="12" x2="20" y2="3"/>
                    <line x1="1" y1="14" x2="7" y1="14"/>
                    <line x1="9" y1="8" x2="15" y1="8"/>
                    <line x1="17" y1="16" x2="23" y1="16"/>
                </svg>
            </button>

            <!-- Collapsible Filter Panel -->
            <div id="mapFilters" class="map-filters" style="display: none; position: fixed; top: 150px; right: 16px; z-index: 999; background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 90vw; width: 300px;">
                <h3 style="margin: 0 0 1rem; font-size: 1rem;">Filters</h3>
                
                <!-- Status Filter -->
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">Status</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="filter-btn active" data-filter="status" data-value="all" onclick="app.updateMapFilter('status', 'all')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: var(--primary-black); color: white; font-size: 0.85rem;">
                            All
                        </button>
                        <button class="filter-btn" data-filter="status" data-value="active" onclick="app.updateMapFilter('status', 'active')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: white; color: var(--primary-black); font-size: 0.85rem;">
                            Active
                        </button>
                        <button class="filter-btn" data-filter="status" data-value="found" onclick="app.updateMapFilter('status', 'found')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: white; color: var(--primary-black); font-size: 0.85rem;">
                            Found
                        </button>
                    </div>
                </div>

                <!-- Location Type Filter -->
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">Location Type</label>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="filter-btn active" data-filter="locationType" data-value="all" onclick="app.updateMapFilter('locationType', 'all')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: var(--primary-black); color: white; font-size: 0.85rem;">
                            All
                        </button>
                        <button class="filter-btn" data-filter="locationType" data-value="park" onclick="app.updateMapFilter('locationType', 'park')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: white; color: var(--primary-black); font-size: 0.85rem;">
                            Park
                        </button>
                        <button class="filter-btn" data-filter="locationType" data-value="trail" onclick="app.updateMapFilter('locationType', 'trail')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: white; color: var(--primary-black); font-size: 0.85rem;">
                            Trail
                        </button>
                        <button class="filter-btn" data-filter="locationType" data-value="urban" onclick="app.updateMapFilter('locationType', 'urban')" style="padding: 0.5rem 1rem; border: 2px solid var(--border-gray); border-radius: 20px; background: white; color: var(--primary-black); font-size: 0.85rem;">
                            Urban
                        </button>
                    </div>
                </div>

                <!-- Distance Filter -->
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">Distance</label>
                    <input type="range" id="distanceFilter" min="0" max="50" value="50" onchange="app.updateMapFilter('distance', this.value)" style="width: 100%; margin-bottom: 0.5rem;">
                    <div style="text-align: center; font-size: 0.85rem; color: var(--text-gray);">
                        Within <span id="distanceValue">50</span> miles
                    </div>
                </div>
            </div>

            <!-- Map Container -->
            <div id="browseMap" style="width: 100%; height: calc(100vh - 80px);"></div>
        </div>
    `;
},
            toggleMapFilters() {
    const filterPanel = document.getElementById('mapFilters');
    if (filterPanel.style.display === 'none') {
        filterPanel.style.display = 'block';
    } else {
        filterPanel.style.display = 'none';
    }
},

// Update map filters
updateMapFilter(filterType, value) {
    // Update button styles
    const buttons = document.querySelectorAll(`[data-filter="${filterType}"]`);
    buttons.forEach(btn => {
        if (btn.dataset.value === value) {
            btn.style.background = 'var(--primary-black)';
            btn.style.color = 'white';
            btn.classList.add('active');
        } else {
            btn.style.background = 'white';
            btn.style.color = 'var(--primary-black)';
            btn.classList.remove('active');
        }
    });

    // Update distance display
    if (filterType === 'distance') {
        document.getElementById('distanceValue').textContent = value;
    }

    // Store filters
    if (!appState.mapFilters) {
        appState.mapFilters = {
            status: 'all',
            locationType: 'all',
            distance: 50
        };
    }
    appState.mapFilters[filterType] = value;

    // Re-render map markers with filters
    this.updateMapMarkers();
},

// Update map markers based on filters
updateMapMarkers() {
    if (!window.mapInstance) return;

    // Clear existing markers
    if (window.mapMarkers) {
        window.mapMarkers.forEach(marker => marker.remove());
    }
    window.mapMarkers = [];

    // Filter drops based on current filters
    const filters = appState.mapFilters || { status: 'all', locationType: 'all', distance: 50 };
    
    let filteredDrops = appState.artDrops;

    // Apply status filter
    if (filters.status !== 'all') {
        filteredDrops = filteredDrops.filter(d => d.status === filters.status);
    }

    // Apply location type filter
    if (filters.locationType !== 'all') {
        filteredDrops = filteredDrops.filter(d => d.locationType === filters.locationType);
    }

    // Apply distance filter
    if (appState.userLocation && filters.distance < 50) {
        filteredDrops = filteredDrops.filter(d => {
            const distance = this.calculateDistance(
                appState.userLocation.latitude,
                appState.userLocation.longitude,
                d.latitude,
                d.longitude
            );
            return distance <= filters.distance;
        });
    }

    // Add markers for filtered drops
    filteredDrops.forEach(drop => {
        const marker = new mapboxgl.Marker({
            color: drop.status === 'active' ? '#4CAF50' : '#FF9800'
        })
            .setLngLat([drop.longitude, drop.latitude])
            .setPopup(
                new mapboxgl.Popup().setHTML(`
                    <div style="padding: 0.5rem;">
                        <h4 style="margin: 0 0 0.5rem;">${drop.title}</h4>
                        <p style="margin: 0 0 0.5rem; font-size: 0.85rem;">${drop.locationName}</p>
                        <button onclick="app.showPage('art-story', {dropId: '${drop.id}'})" 
                                style="padding: 0.5rem 1rem; background: var(--primary-black); color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; font-size: 0.85rem;">
                            View Details
                        </button>
                    </div>
                `)
            )
            .addTo(window.mapInstance);

        window.mapMarkers.push(marker);
    });

    console.log(`✅ Showing ${filteredDrops.length} of ${appState.artDrops.length} drops`);
},

            renderArtistDashboard() {
               if (!appState.currentUser) {
        this.showPage('artist-login');
        return '';
    }
    
    const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
    const activeDrops = myDrops.filter(d => d.status === 'active');
    const foundDrops = myDrops.filter(d => d.status === 'found');
    
    // SAFE ACCESS
    const totalDonations = (appState.currentUser.totalDonations || 0).toFixed(2);
    
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
                    <div class="stat-value">$${totalDonations}</div>
                    <div class="stat-label">Total Donations</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; margin: 3rem 0; flex-wrap: wrap; justify-content: center;">
                <button class="btn btn-primary" onclick="app.showPage('drop-new-art')" style="flex: 1; min-width: 150px; max-width: 250px;">Drop New Art</button>
                <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 150px; max-width: 250px;">View All Drops</button>
                <button class="btn btn-secondary" onclick="app.showPage('edit-profile')" style="flex: 1; min-width: 150px; max-width: 250px;">Edit Profile</button>
            </div>
            
            <h2 style="margin-top: 5rem;">Recent Donations & Messages</h2>
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
            
            <form onsubmit="app.handleDropNewArtWithFirebase(event)">
                <!-- Photo: Choose URL or Upload -->
                <div class="form-group">
                    <label>Photo *</label>
                    
                    <!-- Tab selection -->
                    <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                        <button type="button" class="btn btn-outline" id="urlTabBtn" 
                                onclick="app.switchPhotoTab('url')" 
                                style="flex: 1; min-height: 40px;">
                            URL
                        </button>
                        <button type="button" class="btn btn-outline" id="uploadTabBtn" 
                                onclick="app.switchPhotoTab('upload')" 
                                style="flex: 1; min-height: 40px;">
                            Upload
                        </button>
                    </div>
                    
                    <!-- URL Input (default) -->
                    <div id="photoUrlTab">
                        <input type="url" id="dropPhotoUrl" name="photoUrl" class="form-control" 
                               placeholder="https://example.com/image.jpg">
                        <small style="display: block; margin-top: 0.5rem; color: var(--text-gray);">
                            Paste a direct image URL (JPG, PNG, GIF)
                        </small>
                    </div>
                    
                    <!-- File Upload (hidden by default) -->
                    <div id="photoUploadTab" style="display: none;">
                        <input type="file" id="dropPhotoInput" accept="image/*" class="form-control">
                        <small style="display: block; margin-top: 0.5rem; color: var(--text-gray);">
                            Maximum 5MB - JPG, PNG, or GIF
                        </small>
                    </div>
                </div>

                <!-- Title -->
                <div class="form-group">
                    <label>Title *</label>
                    <input type="text" name="title" class="form-control" required 
                           placeholder="Give your art a memorable name">
                </div>

                <!-- Story -->
                <div class="form-group">
                    <label>Story *</label>
                    <textarea name="story" class="form-control" rows="4" required 
                              placeholder="Tell the story of this piece..."></textarea>
                </div>

                <!-- Location Type -->
                <div class="form-group">
                    <label>Location Type *</label>
                    <select name="locationType" class="form-control" required>
                        <option value="">Select type</option>
                        <option value="coffee-shop">Coffee Shop</option>
                        <option value="bookstore">Bookstore</option>
                        <option value="park">Park</option>
                        <option value="trail">Trail</option>
                        <option value="plaza">Plaza</option>
                        <option value="mall">Mall</option>
                        <option value="library">Library</option>
                        <option value="outdoor">Outdoor</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <!-- Location Name (optional - auto-populated from geocoding) -->
                <div class="form-group">
                    <label>Location Name (optional)</label>
                    <input type="text" name="locationName" class="form-control" 
                           placeholder="e.g., Central Perk Cafe - will auto-populate from coordinates">
                    <small style="display: block; margin-top: 0.5rem; color: var(--text-gray);">
                        Leave blank to use "City, State Zip"
                    </small>
                </div>

                <!-- Coordinates -->
                <div class="form-group">
                    <label>Location *</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <input type="number" name="latitude" step="any" class="form-control" 
                                   placeholder="Latitude" required>
                        </div>
                        <div>
                            <input type="number" name="longitude" step="any" class="form-control" 
                                   placeholder="Longitude" required>
                        </div>
                    </div>
                    
                    <button type="button" class="btn btn-secondary" onclick="app.useCurrentLocation()" 
                            style="width: 100%; min-height: 48px;">
                        📍 Use My Current Location
                    </button>
                </div>

                <!-- Location Details (auto-populated) -->
                <div id="locationDetails" style="display: none; background: var(--light-gray); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>Location Details:</strong>
                    <div id="locationAddress" style="margin-top: 0.5rem; font-size: 0.9rem;"></div>
                </div>

                <!-- Map -->
                <div class="form-group">
                    <div id="dropLocationMap" style="width: 100%; height: 300px; border-radius: 8px; border: 1px solid var(--border-gray);"></div>
                </div>

                <!-- Materials -->
                <div class="form-group">
                    <label>Materials (optional)</label>
                    <input type="text" name="materials" class="form-control" 
                           placeholder="e.g., Stone, Acrylic Paint">
                </div>

                <!-- Hidden fields for geocoded data -->
                <input type="hidden" name="city" id="geocodedCity">
                <input type="hidden" name="state" id="geocodedState">
                <input type="hidden" name="zipCode" id="geocodedZip">
                <input type="hidden" name="country" id="geocodedCountry">

                <!-- Submit -->
                <button type="submit" class="btn btn-primary btn-large" style="width: 100%; min-height: 56px;">
                    Create & Generate QR Tag
                </button>
            </form>
        </div>
    `;
},

renderMyDrops() {
    if (!appState.currentUser) {
        this.showPage('artist-login');
        return ''
    }
    
    const myDrops = appState.artDrops.filter(d => d.artistId === appState.currentUser.id);
    
    console.log("User has", myDrops.length, "drops");
    
    let html = `
        <div class="container">
            <h1>My Drops</h1>
            <p style="color: var(--text-gray); margin-bottom: 2rem;">Your art in the wild</p>
    `;
    
    if (myDrops.length === 0) {
        html += `
            <div class="empty-state" style="text-align: center; padding: 60px 20px;">
                <svg class="icon" style="width: 80px; height: 80px; margin-bottom: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>No art drops yet</h3>
                <p style="margin: 20px 0;">Be the first to drop art and spread joy!</p>
                <button class="btn btn-primary" onclick="app.showPage('drop-new-art')">Drop Your First Piece</button>
            </div>
        `;
    } else {
        html += '<div class="drops-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">';
        
        myDrops.forEach(drop => {
            const status = drop.status === 'active' ? '✓ Active' : '🎯 Found';
            const badgeClass = drop.status === 'active' ? 'active' : 'found';
            const foundCount = drop.foundCount || 0;
            
            html += `
                <div class="card" onclick="app.showPage('art-story', {dropId: '${drop.id}'})">
                    <img src="${drop.photoUrl}" alt="${drop.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0; cursor: pointer;" />
                    <div class="card-content" style="padding: 16px;">
                        <span class="badge badge-${badgeClass}">${status}</span>
                        <h3 style="margin: 8px 0;">${drop.title}</h3>
                        <p style="color: #666; font-size: 0.9rem;">📍 ${drop.locationName}</p>
                        <p style="color: #999; font-size: 0.875rem;">Found ${foundCount} time${foundCount !== 1 ? 's' : ''}</p>
                        <p style="color: #999; font-size: 0.875rem;">$${(drop.totalDonations || 0).toFixed(2)} donated</p>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
},
            

renderQRTagGenerator(dropId) {
    console.log('Rendering QR generator for drop ID:', dropId);
    
    // Convert dropId to string if it's an object
    const dropIdString = typeof dropId === 'object' && dropId.id ? dropId.id : String(dropId);
    
    if (!dropIdString) {
        return `<div class="container"><p>Error: No drop ID provided</p></div>`;
    }

    // Find drop from local cache (it was just created)
    let drop = appState.artDrops.find(d => String(d.id) === dropIdString);
    
    if (!drop) {
        console.warn('Drop not found in cache for ID:', dropIdString);
        // Create a temporary drop object
        drop = {
            id: dropIdString,
            title: 'Your Art Drop',
            story: 'Art drop created successfully'
        };
    }

    // Generate unique QR code reference (use string version of ID)
    const qrCode = 'AD-' + dropIdString.substring(0, 8).toUpperCase();

    return `
        <div class="container" style="max-width: 600px;">
            <h1 style="text-align: center; margin-bottom: 1rem;">QR Tag Created!</h1>
            <p style="text-align: center; color: var(--text-gray); margin-bottom: 2rem;">Print & attach this to your art</p>
            
            <div class="card" style="text-align: center;">
                <div class="card-content" style="padding: 2rem;">
                    <div id="qrcode" style="margin: 2rem auto; display: flex; justify-content: center;"></div>
                    <h3 style="margin: 1rem 0;">${drop.title}</h3>
                    <p style="color: #666; margin-bottom: 1rem;">QR Code: ${qrCode}</p>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1.5rem 0;">
                        <p style="margin: 0; font-size: 0.9rem; color: #666;">
                            <strong>How to use:</strong><br>
                            1. Print this QR code<br>
                            2. Attach to your art<br>
                            3. Finders scan to see your story
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="window.print()" style="flex: 1; min-width: 150px; min-height: 48px;">
                            Print QR Tag
                        </button>
                        <button class="btn btn-secondary" onclick="app.showPage('my-drops')" style="flex: 1; min-width: 150px; min-height: 48px;">
                            View My Drops
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
},

            renderArtistProfile(artistId) {
                // Type-safe artist lookup
    const artist = appState.artists.find(a => String(a.id) === String(artistId));
    
    if (!artist) {
        console.error('Artist not found:', artistId);
        return `<div class="container"><p>Error: Artist not found.</p></div>`;
    }

    // Defensive field access with fallbacks
    const name = artist.name || 'Unknown Artist';
    const bio = artist.bio || 'No bio available.';
    const city = artist.city || '';
    const profilePhoto = artist.profilePhoto || 'https://i.pravatar.cc/200?img=1';
    const followerCount = artist.followerCount || 0;
    const totalDonations = artist.totalDonations || 0;
    const activeDrops = artist.activeDrops || 0;
    const instagram = artist.instagram || '';
    const tiktok = artist.tiktok || '';
    const facebook = artist.facebook || '';
    const website = artist.website || '';
    
    // Get artist's drops
    const artistDrops = appState.artDrops.filter(d => String(d.artistId) === String(artistId));
    
    // Check if current user follows this artist
    const isFollowing = appState.currentUser ? 
        appState.follows.some(f => 
            f.followerId === appState.currentUser.id && 
            f.targetType === 'artist' && 
            String(f.targetId) === String(artistId)
        ) : false;
                
               return `
        <div class="container">
            <div class="artist-header" style="display: flex; gap: 3rem; align-items: start; margin-bottom: 3rem;">
                <img src="${profilePhoto}" alt="${name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-black);">
                
                <div style="flex: 1;">
                    <h1 style="margin: 0 0 0.5rem;">${name}</h1>
                    ${city ? `<p style="color: var(--text-gray); margin: 0 0 1rem;">📍 ${city}</p>` : ''}
                    <p style="color: var(--text-dark); line-height: 1.6; margin-bottom: 2rem;">${bio}</p>
                    
                    <div style="display: flex; gap: 3rem; margin-bottom: 2rem;">
                        <div>
                            <div style="font-size: 2rem; font-weight: 700;">${followerCount}</div>
                            <div style="color: var(--text-gray);">Followers</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: 700;">${activeDrops}</div>
                            <div style="color: var(--text-gray);">Active Drops</div>
                        </div>
                        <div>
                            <div style="font-size: 2rem; font-weight: 700;">$${totalDonations.toFixed(0)}</div>
                            <div style="color: var(--text-gray);">Total Donated</div>
                        </div>
                    </div>
                    
                    ${(instagram || tiktok || facebook || website) ? `
                    <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap;">
                        ${instagram ? `<a href="https://instagram.com/${instagram.replace('@', '')}" target="_blank" style="color: var(--primary-black); text-decoration: underline;">Instagram</a>` : ''}
                        ${tiktok ? `<a href="https://tiktok.com/@${tiktok}" target="_blank" style="color: var(--primary-black); text-decoration: underline;">TikTok</a>` : ''}
                        ${facebook ? `<a href="${facebook}" target="_blank" style="color: var(--primary-black); text-decoration: underline;">Facebook</a>` : ''}
                        ${website ? `<a href="${website}" target="_blank" style="color: var(--primary-black); text-decoration: underline;">Website</a>` : ''}
                    </div>
                    ` : ''}
                    
                    ${appState.currentUser && String(appState.currentUser.id) !== String(artistId) ? `
                    <button class="btn btn-${isFollowing ? 'secondary' : 'primary'}" 
                            onclick="app.toggleFollowArtist('${artistId}')" 
                            style="min-height: 48px; min-width: 150px;">
                        ${isFollowing ? '✓ Following' : '+ Follow Artist'}
                    </button>
                    ` : ''}
                </div>
            </div>

            ${artistDrops.length > 0 ? `
            <h2 style="margin-bottom: 2rem;">Art Drops</h2>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                ${artistDrops.map(drop => this.renderDropCard(drop)).join('')}
            </div>
            ` : `
            <div style="text-align: center; padding: 3rem; background: var(--light-gray); border-radius: 12px;">
                <h3>No art drops yet</h3>
                <p style="color: var(--text-gray);">This artist hasn't dropped any art yet. Check back soon!</p>
            </div>
            `}
        </div>
    `;
},
    renderArtStory(dropId) {
    // 1. Defensive lookup
    const drop = appState.artDrops.find(d => String(d.id) === String(dropId));
    if (!drop) {
        return `<div class="container"><p>Error: Art drop not found.</p></div>`;
    }

    // 2. Defensive artist lookup
    const artist = appState.artists.find(a => String(a.id) === String(drop.artistId));
    if (!artist) {
        console.error('Artist not found for drop:', drop);
        return `<div class="container"><p>Error: Artist not found for this art drop.</p></div>`;
    }

    // 3. Location lookup
    const location = appState.locations.find(
        l => l.name === drop.locationName || String(l.id) === String(drop.locationId)
    );

    // 4. Check if user follows this artist
    const isFollowingArtist = appState.currentUser ? 
        appState.follows.some(f => 
            f.followerId === appState.currentUser.id && 
            f.targetType === 'artist' && 
            f.targetId === artist.id
        ) : false;

    // 5. Check if user follows this location
    const isFollowingLocation = appState.currentUser && location ? 
        appState.follows.some(f => 
            f.followerId === appState.currentUser.id && 
            f.targetType === 'location' && 
            f.targetId === location.id
        ) : false;

    return `
        <div class="container">
            <div class="art-detail-grid" style="align-items: start;">
                <div style="position: relative;">
                    <img src="${drop.photoUrl}" alt="${drop.title}" class="art-image-large" style="display: block;">
                </div>
                <div class="art-info">
                    <span class="badge badge-${drop.status === 'active' ? 'active' : 'found'}">${drop.status === 'active' ? 'Active' : 'Found'}</span>
                    <h1 style="margin: 1rem 0;">${drop.title}</h1>
                    
                    <div class="artist-section" style="display: block; cursor: pointer;" onclick="app.showPage('artist-profile', {artistId: '${artist.id}'})">
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
                            ${artist.tiktok ? `<a href="https://tiktok.com/@${artist.tiktok}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">TikTok</a>` : ''}
                            ${artist.facebook ? `<a href="${artist.facebook}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Facebook</a>` : ''}
                            ${artist.website ? `<a href="${artist.website}" target="_blank" style="color: var(--primary-black); text-decoration: underline; font-size: 0.9rem;">Website</a>` : ''}
                        </div>
                        ` : ''}
                    </div>

                    <h3 style="margin-top: 3rem; margin-bottom: 1.5rem;">The Story</h3>
                    <p style="color: var(--primary-black); line-height: 1.8; margin-bottom: 3rem;">${drop.story}</p>

                    <div style="background: var(--light-gray); padding: 2rem; margin: 3rem 0;">
                        <p style="font-size: 0.9rem; margin-bottom: 1rem;"><strong>Location:</strong> ${drop.locationName}</p>
                        ${location && location.id ? `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span style="font-size: 0.85rem; color: var(--text-gray);">${location.followerCount} followers</span>
                            ${appState.currentUser ? `
                            <button class="btn btn-${isFollowingLocation ? 'secondary' : 'primary'}" onclick="app.toggleFollowLocation('${location.id}')" style="padding: 0.5rem 1rem; font-size: 0.85rem; min-height: 36px;">
                                ${isFollowingLocation ? 'Unfollow Location' : 'Follow Location'}
                            </button>
                            ` : ''}
                        </div>
                        ` : ''}
                        <p style="font-size: 0.9rem; margin-bottom: 1rem;"><strong>Type:</strong> ${drop.locationType}</p>
                        <p style="font-size: 0.9rem; margin: 0;"><strong>Dropped:</strong> ${new Date(drop.dateCreated).toLocaleDateString()}</p>
                    </div>

                    ${appState.currentUser && artist ? `
                    <button class="btn btn-${isFollowingArtist ? 'secondary' : 'primary'}" onclick="app.toggleFollowArtist('${artist.id}')" style="width: 100%; margin-bottom: 1rem; min-height: 48px;">
                        ${isFollowingArtist ? 'Unfollow Artist' : 'Follow Artist'}
                    </button>
                    ` : ''}

                    ${drop.status === 'active' ? `
                    <button class="btn btn-primary btn-large" onclick="app.showPage('found-confirmation', {dropId: '${drop.id}'})" style="width: 100%; margin-bottom: 1rem; min-height: 56px; font-size: 18px;">
                        I Found This!
                    </button>
                    ` : `
                    <div class="alert alert-info" style="margin-bottom: 1rem;">
                        This art has been found! It might still be at the location.
                    </div>
                    `}

                    <button class="btn btn-secondary" onclick="app.showPage('donation-flow', {dropId: '${drop.id}'})" style="width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                        </svg>
                        Thank the Artist
                    </button>
                </div>
            </div>

           <!-- Related Art from Same Artist -->
                ${(() => {
                    const relatedDrops = appState.artDrops.filter(d => String(d.artistId) === String(drop.artistId) && String(d.id) !== String(drop.id)).slice(0, 3);
                    if (relatedDrops.length === 0) return '';
                    
                    return `
                    <div style="margin-top: 5rem;">
                        <h2 style="margin-bottom: 2rem; text-align: center;">More from ${drop.artistName}</h2>
                        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                            ${relatedDrops.map(relatedDrop => this.renderDropCard(relatedDrop)).join('')}
                        </div>
                    </div>
                    `;
                })()}
            <!-- Finder Messages -->
            ${drop.findEvents && drop.findEvents.length > 0 ? `
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

            <div style="margin-top: 5rem;">
                <h2 style="margin-bottom: 1rem;">Location Map</h2>
                <div class="map-container" style="height: 400px;">
                    <div id="artStoryMap"></div>
                </div>
            </div>
        </div>
    `;
},
renderDropCard(drop) {
    if (!drop) return '';
    
    const status = drop.status === 'active' ? 'Active' : 'Found';
    const badgeClass = drop.status === 'active' ? 'active' : 'found';
    const foundCount = drop.foundCount || 0;
    
    return `
        <div class="card" onclick="app.showPage('art-story', {dropId: '${drop.id}'})" style="cursor: pointer;">
            <img src="${drop.photoUrl}" alt="${drop.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;" />
            <div class="card-content" style="padding: 16px;">
                <span class="badge badge-${badgeClass}">${status}</span>
                <h3 style="margin: 8px 0; font-weight: 600;">${drop.title}</h3>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 8px;">📍 ${drop.locationName}</p>
                <p style="color: #999; font-size: 0.875rem;">Found ${foundCount} time${foundCount !== 1 ? 's' : ''}</p>
                <p style="color: #999; font-size: 0.875rem;">$${(drop.totalDonations || 0).toFixed(2)} donated</p>
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
                    <div class="card card-interactive" onclick="app.showPage('art-story', {dropId: '${drop.id}'})">
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
                                <input type="email" class="form-control" name="email" required placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
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
                                <input type="email" class="form-control" name="email" required placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
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
                                        <input type="email" class="form-control" name="email" required placeholder="your_email@example.com" pattern="[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}">
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
async handleArtistSignup(e) {
    e.preventDefault();
    
    try {
        const form = e.target;
        const name = form.querySelector('input[name="name"]').value;
        const email = form.querySelector('input[name="email"]').value;
        const password = form.querySelector('input[name="password"]').value;
        const bio = form.querySelector('textarea[name="bio"]').value;
        
        // Get profile photo if uploaded
        let profilePhoto = 'https://i.pravatar.cc/200?img=1';
        const fileInput = document.getElementById('signupProfileInput');
        if (fileInput && fileInput.files.length > 0) {
            this.showLoadingOverlay('Uploading photo...');
            profilePhoto = await uploadPhotoToStorage(fileInput.files);
        }

        this.showLoadingOverlay('Creating account...');

        // Firebase signup
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create COMPLETE user profile in Firestore
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            // Core identity
            userId: result.user.uid,
            id: result.user.uid,
            name: name,
            email: email,
            profilePhoto: profilePhoto,
            
            // User type
            userType: 'artist',
            
            // Bio & location
            bio: bio || '',
            city: '',
            
            // Social media
            instagram: '',
            tiktok: '',
            facebook: '',
            website: '',
            
            // Stats
            followerCount: 0,
            totalDonations: 0,
            activeDrops: 0,
            
            // Timestamps
            joinDate: new Date().toISOString().split('T'),
            createdAt: serverTimestamp()
        });

        console.log('✅ Artist profile created:', result.user.uid);

        // Set appState with ALL required fields
        appState.currentUser = {
            id: result.user.uid,
            name: name,
            email: email,
            profilePhoto: profilePhoto,
            userType: 'artist',
            bio: bio || '',
            city: '',
            instagram: '',
            tiktok: '',
            facebook: '',
            website: '',
            followerCount: 0,
            totalDonations: 0,
            activeDrops: 0,
            joinDate: new Date().toISOString().split('T')
        };

        this.hideLoadingOverlay();
        this.showToast('✅ Account created successfully!');
        this.showPage('artist-dashboard');

    } catch (error) {
        console.error('❌ Signup error:', error);
        this.hideLoadingOverlay();
        
        let message = 'Signup failed';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Email already in use. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak. Use at least 6 characters.';
        }
        
        this.showToast(message);
    }
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

           async handleFinderLogin(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            this.showToast('Please enter email and password');
            return;
        }
        
        console.log("Finder signing in...");
        
        // Firebase Authentication
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Finder login successful:", result.user.email);
        
        // Load user profile from Firestore
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            appState.currentUser = {
                id: result.user.uid,
                name: userData.name || result.user.displayName || 'Finder',
                email: result.user.email,
                profilePhoto: userData.profilePhoto || result.user.photoURL || 'https://i.pravatar.cc/200?img=50',
                userType: userData.userType || 'finder',
                bio: userData.bio || '',
                city: userData.city || '',
                foundArt: userData.foundArt || [],
                followedArtists: userData.followedArtists || [],
                followedLocations: userData.followedLocations || [],
                totalFinds: userData.totalFinds || 0,
                joinDate: userData.joinDate || new Date().toISOString().split('T')[0]
            };
        }
        
        this.showToast('✅ Welcome back, ' + appState.currentUser.name + '!');
        this.showPage('feed');
        
    } catch (error) {
        console.error('❌ Finder login error:', error);
        
        let message = 'Login failed';
        if (error.code === 'auth/user-not-found') {
            message = 'User not found. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        }
        
        this.showToast('❌ ' + message);
    }
},

            async handleFinderSignup(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');
        const city = formData.get('city') || '';
        
        if (!email || !password || !name) {
            this.showToast('Please fill in all required fields');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters');
            return;
        }
        
        console.log("Creating finder account...");
        
        // Create Firebase user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log("✅ Finder signup successful:", result.user.email);
        
        // Upload profile photo if provided
        let profilePhotoUrl = 'https://i.pravatar.cc/200?img=50';
        const photoInput = document.getElementById('finderSignupProfileInput');
        if (photoInput && photoInput.files.length > 0) {
            console.log("Uploading finder profile photo...");
            try {
                profilePhotoUrl = await uploadPhotoToStorage(photoInput.files[0]);
            } catch (photoError) {
                console.error("Photo upload failed, using default", photoError);
            }
        }
        
        // Create user document in Firestore
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
            userId: result.user.uid,
            id: result.user.uid,
            name: name,
            email: email,
            profilePhoto: profilePhotoUrl,
            userType: 'finder',
            bio: '',
            city: city,
            foundArt: [],
            followedArtists: [],
            followedLocations: [],
            totalFinds: 0,
            joinDate: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp()
        });
        
        console.log("✅ Finder profile created in Firestore");
        
        // Set appState
        appState.currentUser = {
            id: result.user.uid,
            name: name,
            email: email,
            profilePhoto: profilePhotoUrl,
            userType: 'finder',
            bio: '',
            city: city,
            foundArt: [],
            followedArtists: [],
            followedLocations: [],
            totalFinds: 0,
            joinDate: new Date().toISOString().split('T')[0]
        };
        
        this.showToast('✅ Account created successfully!');
        this.showPage('feed');
        
    } catch (error) {
        console.error('❌ Finder signup error:', error);
        
        let message = 'Signup failed';
        if (error.code === 'auth/email-already-in-use') {
            message = 'Email already in use. Please login instead.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            message = 'Password is too weak. Use at least 6 characters.';
        }
        
        this.showToast('❌ ' + message);
    }
},

       signInWithApple() {
    const provider = new OAuthProvider('apple.com');
    signInWithPopup(auth, provider)
        .then(async (result) => {
            console.log('✅ Apple sign in successful');
            
            // Ensure user document exists with complete profile
            await ensureUserDocument(result.user);
            
            // Load COMPLETE user profile from Firestore
            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                
                // Set currentUser with ALL fields
                appState.currentUser = {
                    id: result.user.uid,
                    name: userData.name || result.user.displayName || 'Apple User',
                    email: result.user.email,
                    profilePhoto: userData.profilePhoto || result.user.photoURL || 'https://i.pravatar.cc/200?img=50',
                    userType: userData.userType || 'artist',
                    bio: userData.bio || '',
                    city: userData.city || '',
                    instagram: userData.instagram || '',
                    tiktok: userData.tiktok || '',
                    facebook: userData.facebook || '',
                    website: userData.website || '',
                    followerCount: userData.followerCount || 0,
                    totalDonations: userData.totalDonations || 0,
                    activeDrops: userData.activeDrops || 0,
                    joinDate: userData.joinDate || new Date().toISOString().split('T')
                };
                
                console.log('✅ User profile loaded:', appState.currentUser.name);
            }
            
            this.showToast(`✅ Welcome!`);
            this.showPage('home');
        })
        .catch((error) => {
            console.error('❌ Apple sign in error:', error);
            this.showToast('Sign in failed: ' + error.message);
        });
},

     signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(async (result) => {
            console.log('✅ Google sign in successful:', result.user.email);
            
            // Ensure user document exists with complete profile
            await ensureUserDocument(result.user);
            
            // Load COMPLETE user profile from Firestore
            const userRef = doc(db, 'users', result.user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                
                // Set currentUser with ALL fields
                appState.currentUser = {
                    id: result.user.uid,
                    name: userData.name || result.user.displayName || 'Artist',
                    email: result.user.email,
                    profilePhoto: userData.profilePhoto || result.user.photoURL || 'https://i.pravatar.cc/200?img=1',
                    userType: userData.userType || 'artist',
                    bio: userData.bio || '',
                    city: userData.city || '',
                    instagram: userData.instagram || '',
                    tiktok: userData.tiktok || '',
                    facebook: userData.facebook || '',
                    website: userData.website || '',
                    followerCount: userData.followerCount || 0,
                    totalDonations: userData.totalDonations || 0,
                    activeDrops: userData.activeDrops || 0,
                    joinDate: userData.joinDate || new Date().toISOString().split('T')
                };
                
                console.log('✅ User profile loaded:', appState.currentUser.name);
            }
            
            this.showToast(`✅ Welcome, ${appState.currentUser.name}!`);
            this.showPage('home');
        })
        .catch((error) => {
            console.error('❌ Google sign in error:', error);
            this.showToast('Sign in failed: ' + error.message);
        });
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

async handleArtistLogin(e) {
    e.preventDefault();
    
    try {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        if (!email || !password) {
            this.showToast('Please enter email and password');
            return;
        }
        
        console.log("Signing in...");
        
        // Firebase Authentication
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Artist login successful:", result.user.email);
        
        // Load user profile from Firestore
        const userRef = doc(db, 'users', result.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            
            appState.currentUser = {
                id: result.user.uid,
                name: userData.name || result.user.displayName || 'Artist',
                email: result.user.email,
                profilePhoto: userData.profilePhoto || result.user.photoURL || 'https://i.pravatar.cc/200?img=1',
                userType: userData.userType || 'artist',
                bio: userData.bio || '',
                city: userData.city || '',
                instagram: userData.instagram || '',
                tiktok: userData.tiktok || '',
                facebook: userData.facebook || '',
                website: userData.website || '',
                followerCount: userData.followerCount || 0,
                totalDonations: userData.totalDonations || 0,
                activeDrops: userData.activeDrops || 0,
                joinDate: userData.joinDate || new Date().toISOString().split('T')[0]
            };
        }
        
        this.showToast('✅ Welcome back, ' + appState.currentUser.name + '!');
        this.showPage('home');
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        let message = 'Login failed';
        if (error.code === 'auth/user-not-found') {
            message = 'User not found. Please sign up first.';
        } else if (error.code === 'auth/wrong-password') {
            message = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Invalid email address.';
        }
        
        this.showToast('❌ ' + message);
    }
},

  async handleDropNewArt(e) {
    e.preventDefault();
    
    try {
        if (!appState.currentUser) {
            this.showToast('Please sign in first');
            this.showPage('artist-login');
            return;
        }

        console.log('🎨 Starting art drop creation...');

        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';
        }

        // Get form elements
        const form = e.target;
        
        // STEP 1: Get photo - EITHER from URL or upload
        let photoUrl = '';
        
        // Check URL input first
        const urlInput = document.getElementById('dropPhotoUrl');
        const uploadInput = document.getElementById('dropPhotoInput');
        
        if (urlInput && urlInput.value) {
            // Using URL - no upload needed
            photoUrl = urlInput.value;
            console.log('✅ Using photo URL:', photoUrl);
            
            // Validate it's a valid URL
            try {
                new URL(photoUrl);
            } catch (e) {
                this.showToast('❌ Please enter a valid image URL');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create & Generate QR Tag';
                }
                return;
            }
        } 
        else if (uploadInput && uploadInput.files && uploadInput.files.length > 0) {
            // Using file upload
            this.showLoadingOverlay('Uploading photo...');
            
            try {
                photoUrl = await uploadPhotoToStorage(uploadInput.files[0]);
                console.log('✅ Photo uploaded:', photoUrl);
            } catch (error) {
                console.error('❌ Photo upload failed:', error);
                this.hideLoadingOverlay();
                this.showToast('Photo upload failed: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create & Generate QR Tag';
                }
                return;
            }
        } 
        else {
            this.showToast('❌ Please provide a photo URL or upload a file');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create & Generate QR Tag';
            }
            return;
        }

        this.showLoadingOverlay('Creating art drop...');

        // STEP 2: Collect form data
        const dropData = {
            photoUrl: photoUrl,  // Already validated/uploaded
            title: form.querySelector('[name="title"]')?.value?.trim() || '',
            story: form.querySelector('[name="story"]')?.value?.trim() || '',
            materials: form.querySelector('[name="materials"]')?.value?.trim() || '',
            locationType: form.querySelector('[name="locationType"]')?.value || 'other',
            locationName: form.querySelector('[name="locationName"]')?.value?.trim() || '',
            latitude: parseFloat(form.querySelector('[name="latitude"]')?.value) || 0,
            longitude: parseFloat(form.querySelector('[name="longitude"]')?.value) || 0,
            city: document.getElementById('geocodedCity')?.value || 'Unknown',
            state: document.getElementById('geocodedState')?.value || 'Unknown',
            zipCode: document.getElementById('geocodedZip')?.value || '',
            country: document.getElementById('geocodedCountry')?.value || 'US',
            artistId: appState.currentUser.id,
            artistName: appState.currentUser.name
        };

        // STEP 3: Validate required fields
        if (!dropData.title || !dropData.story) {
            this.showToast('❌ Please fill in title and story');
            this.hideLoadingOverlay();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create & Generate QR Tag';
            }
            return;
        }

        if (!dropData.locationName) {
            this.showToast('❌ Please set location name or coordinates');
            this.hideLoadingOverlay();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create & Generate QR Tag';
            }
            return;
        }

        if (dropData.latitude === 0 || dropData.longitude === 0) {
            this.showToast('❌ Please set location coordinates');
            this.hideLoadingOverlay();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Create & Generate QR Tag';
            }
            return;
        }

        console.log('📦 Drop data prepared:', dropData);

        // STEP 4: Create art drop in Firebase
        const artDropRef = await createArtDropInFirebase(dropData);
        
        console.log('✅ Art drop created with ID:', artDropRef.id);

        // STEP 5: Add to local cache
        const newDrop = {
            id: artDropRef.id,
            ...dropData,
            status: 'active',
            foundCount: 0,
            totalDonations: 0,
            findEvents: [],
            dateCreated: new Date().toISOString()
        };
        
        appState.artDrops.unshift(newDrop);
        
        if (appState.currentUser) {
            appState.currentUser.activeDrops = (appState.currentUser.activeDrops || 0) + 1;
        }

        this.hideLoadingOverlay();
        this.showToast('✅ Art drop created successfully!');

        // STEP 6: Navigate to QR code generator
        setTimeout(() => {
            this.showPage('qr-tag-generator', { dropId: artDropRef.id });
        }, 1000);

    } catch (error) {
        console.error('❌ Error creating art drop:', error);
        this.hideLoadingOverlay();
        this.showToast('Failed to create drop: ' + error.message);
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create & Generate QR Tag';
        }
    }
},
            
            hideLoadingOverlay() {
                const overlay = document.getElementById('loadingOverlay');
                if (overlay) overlay.remove();
            },
            
           async handleDonation(e, dropId) {
    e.preventDefault();
    
    console.log("Processing donation...");
    
    try {
        const formData = new FormData(e.target);
        const customAmount = parseFloat(formData.get('customAmount'));
        const selectedBtn = document.querySelector('.donation-btn.selected');
        const presetAmount = selectedBtn ? parseFloat(selectedBtn.dataset.amount) : 0;
        
        const amount = customAmount || presetAmount;
        
        if (!amount || amount < 1) {
            this.showToast('Please select or enter a donation amount');
            return;
        }
        
        // Find drop (Firebase or local cache)
        let drop = appState.artDrops.find(d => d.id === dropId);
        if (!drop) {
            throw new Error('Art drop not found');
        }
        
        // Calculate fees
        const platformFee = amount * appState.platformCommission;
        const artistPayout = amount - platformFee;
        
        console.log("Creating donation record...");
        
        // Create donation record in Firebase
        const donationData = {
            dropId: dropId,
            artistId: drop.artistId,
            artistName: drop.artistName,
            donorName: formData.get('donorName') || 'Anonymous',
            donorEmail: formData.get('donorEmail') || '',
            amount: amount,
            platformFee: platformFee,
            artistPayout: artistPayout,
            message: formData.get('message') || '',
            donationDate: serverTimestamp(),
            status: 'completed'
        };
        
        // Save donation to Firebase
        const donationRef = await addDoc(collection(db, 'donations'), donationData);
        console.log("✅ Donation recorded with ID:", donationRef.id);
        
        // Update drop in Firebase
        const dropRef = doc(db, 'artDrops', dropId);
        const dropSnap = await getDoc(dropRef);
        
        if (dropSnap.exists()) {
            const currentData = dropSnap.data();
            const currentEvents = currentData.findEvents || [];
            
            // Mark last find event as donated
            if (currentEvents.length > 0) {
                currentEvents[currentEvents.length - 1].donated = true;
            }
            
            await updateDoc(dropRef, {
                totalDonations: increment(artistPayout),
                findEvents: currentEvents
            });
            
            console.log("✅ Drop updated with donation");
        }
        
        // Update artist in Firebase
        const artistRef = doc(db, 'users', drop.artistId);
        await updateDoc(artistRef, {
            totalDonations: increment(artistPayout)
        });
        
        console.log("✅ Artist total donations updated");
        
        // Update local cache
        drop.totalDonations = (drop.totalDonations || 0) + artistPayout;
        
        // Update current user's donations if they're the artist
        if (appState.currentUser && appState.currentUser.id === drop.artistId) {
            appState.currentUser.totalDonations = (appState.currentUser.totalDonations || 0) + artistPayout;
        }
        
        this.showToast('✅ Thank you for your donation!');
        this.showPage('thank-you', { dropId: dropId, amount: amount });
        
    } catch (error) {
        console.error('❌ Error processing donation:', error);
        this.showToast('❌ Failed to process donation: ' + error.message);
    }
},

selectDonationAmount(amount) {
    document.querySelectorAll('.donation-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Find the button that was clicked
    if (event && event.target) {
        event.target.classList.add('selected');
    }
    
    // Clear custom amount input
    const customInput = document.getElementById('customAmount');
    if (customInput) {
        customInput.value = '';
    }
},
            // ============================================
            // HELPER METHODS
            // ============================================

            downloadQRCode(qrCode) {
    try {
        // Get the QR code element
        const qrcodeElement = document.getElementById('qrcode');
        
        if (!qrcodeElement) {
            this.showToast('QR code not found');
            return;
        }
        
        // Get the canvas from QRCode library
        const canvas = qrcodeElement.querySelector('canvas');
        
        if (!canvas) {
            this.showToast('QR code canvas not found');
            return;
        }
        
        // Download the image
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = qrCode + '.png';
        link.click();
        
        this.showToast('✅ QR code downloaded!');
        
    } catch (error) {
        console.error('Error downloading QR code:', error);
        this.showToast('❌ Failed to download QR code');
    }
},

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

            async handleContactSubmit(e) {
    e.preventDefault();
    
    try {
        this.showLoadingOverlay('Sending message...');
        
        const formData = new FormData(e.target);
        
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message'),
            userId: appState.currentUser ? appState.currentUser.id : null,
            submittedAt: serverTimestamp(),
            status: 'new'
        };
        
        // Save to Firestore
        const docRef = await addDoc(collection(db, 'contact_messages'), contactData);
        
        console.log("✅ Message saved with ID:", docRef.id);
        
        this.hideLoadingOverlay();
        this.showToast('✅ Message sent successfully! We\'ll be in touch soon.');
        e.target.reset();
        
    } catch (error) {
        console.error('❌ Error sending contact message:', error);
        this.hideLoadingOverlay();
        this.showToast('❌ Failed to send message: ' + error.message);
    }
},

            async toggleFollowArtist(artistId) {
    if (!appState.currentUser) {
        this.showToast('Please sign in to follow artists');
        this.showPage('artist-login');
        return;
    }
    
    try {
        const followId = `${appState.currentUser.id}_${artistId}`;
        const followRef = doc(db, 'follows', followId);
        
        const followSnap = await getDoc(followRef);
        
        if (followSnap.exists()) {
            // Unfollow
            await deleteDoc(followRef);
            
            // Decrement artist's followerCount
            const artistRef = doc(db, 'users', artistId);
            await updateDoc(artistRef, {
                followerCount: increment(-1)
            });
            
            // Update local cache
            const artist = appState.artists.find(a => a.id === artistId);
            if (artist) artist.followerCount--;
            
            this.showToast('✅ Unfollowed');
            console.log("✅ Artist unfollowed");
            
        } else {
            // Follow
            await setDoc(followRef, {
                followerId: appState.currentUser.id,
                targetType: 'artist',
                targetId: artistId,
                dateFollowed: serverTimestamp()
            });
            
            // Increment artist's followerCount
            const artistRef = doc(db, 'users', artistId);
            await updateDoc(artistRef, {
                followerCount: increment(1)
            });
            
            // Update local cache
            const artist = appState.artists.find(a => a.id === artistId);
            if (artist) artist.followerCount++;
            
            this.showToast('✅ Following');
            console.log("✅ Artist followed");
        }
        
    } catch (error) {
        console.error('❌ Error toggling follow:', error);
        this.showToast('❌ Failed to update follow status');
    }
},

            async toggleFollowLocation(locationId) {
    if (!appState.currentUser) {
        this.showToast('Please sign in to follow locations');
        this.showPage('artist-login');
        return;
    }
    
    try {
        const followId = `${appState.currentUser.id}_loc_${locationId}`;
        const followRef = doc(db, 'follows', followId);
        
        const followSnap = await getDoc(followRef);
        
        if (followSnap.exists()) {
            // Unfollow
            await deleteDoc(followRef);
            
            // Decrement location's followerCount
            const locationRef = doc(db, 'locations', locationId.toString());
            await updateDoc(locationRef, {
                followerCount: increment(-1)
            });
            
            // Update local cache
            const location = appState.locations.find(l => l.id === locationId);
            if (location) location.followerCount--;
            
            this.showToast('✅ Unfollowed location');
            
        } else {
            // Follow
            await setDoc(followRef, {
                followerId: appState.currentUser.id,
                targetType: 'location',
                targetId: locationId.toString(),
                dateFollowed: serverTimestamp()
            });
            
            // Increment location's followerCount
            const locationRef = doc(db, 'locations', locationId.toString());
            await updateDoc(locationRef, {
                followerCount: increment(1)
            });
            
            // Update local cache
            const location = appState.locations.find(l => l.id === locationId);
            if (location) location.followerCount++;
            
            this.showToast('✅ Following location');
        }
        
    } catch (error) {
        console.error('❌ Error toggling location follow:', error);
        this.showToast('❌ Failed to update follow status');
    }
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

            async handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!appState.currentUser) {
        this.showToast('Please sign in first');
        return;
    }
    
    try {
        this.showLoadingOverlay('Updating profile...');
        
        const formData = new FormData(e.target);
        
        const updateData = {
            name: formData.get('name') || appState.currentUser.name,
            bio: formData.get('bio') || '',
            city: formData.get('city') || '',
            instagram: formData.get('instagram') || '',
            tiktok: formData.get('tiktok') || '',
            facebook: formData.get('facebook') || '',
            website: formData.get('website') || ''
        };
        
        // Handle profile photo upload if provided
        const photoInput = document.getElementById('editProfilePhotoInput');
        if (photoInput && photoInput.files.length > 0) {
            this.showLoadingOverlay('Uploading profile photo...');
            updateData.profilePhoto = await uploadPhotoToStorage(photoInput.files);
        }
        
        // Update Firestore user document
        const userRef = doc(db, 'users', appState.currentUser.id);
        await updateDoc(userRef, updateData);
        
        console.log("✅ Profile updated in Firestore");
        
        // Update appState
        appState.currentUser = {
            ...appState.currentUser,
            ...updateData
        };
        
        this.hideLoadingOverlay();
        this.showToast('✅ Profile updated successfully!');
        
        // Reload dashboard to show updated info
        this.showPage('artist-dashboard');
        
    } catch (error) {
        console.error('❌ Profile update error:', error);
        this.hideLoadingOverlay();
        this.showToast('❌ Failed to update profile: ' + error.message);
    }
},

 renderFeed() {
    if (!appState.currentUser) {
        this.showPage('finder-login');
        return ''
    }
    
    const artDrops = appState.artDrops || [];
    const activeDrops = artDrops.filter(d => d.status === 'active');
    
    let feedHTML = `
        <div class="container">
            <h1 style="margin-bottom: 0.5rem;">Discover Art</h1>
            <p style="color: var(--text-gray); margin-bottom: 2rem; font-size: 1rem;">
                Find hidden art treasures near you and around the world
            </p>
    `;
    
    if (activeDrops.length === 0) {
        feedHTML += `
            <div class="empty-state" style="text-align: center; padding: 60px 20px;">
                <svg class="icon" style="width: 80px; height: 80px; margin-bottom: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>No art drops yet</h3>
                <p>Check back soon or explore the map to find art!</p>
                <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 48px; margin-top: 1rem;">
                    View Map
                </button>
            </div>
        `;
    } else {
        feedHTML += '<div class="feed-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
        
        activeDrops.forEach(drop => {
            let distanceText = '';
            if (appState.userLocation) {
                const distance = this.calculateDistance(
                    appState.userLocation.latitude,
                    appState.userLocation.longitude,
                    drop.latitude,
                    drop.longitude
                );
                distanceText = `<p style="color: #999; font-size: 0.85rem; margin-top: 8px;">📍 ${this.formatDistance(distance)}</p>`;
            }
            
            feedHTML += `
                <div class="feed-card card" onclick="app.showPage('art-story', {dropId: '${drop.id}'})" style="cursor: pointer;">
                    <img src="${drop.photoUrl}" alt="${drop.title}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px 8px 0 0;" />
                    <div class="card-content" style="padding: 16px;">
                        <span class="badge" style="display: inline-block; padding: 4px 12px; background: var(--primary-black); color: white; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-bottom: 8px;">
                            Active
                        </span>
                        <h3 style="margin: 8px 0; font-weight: 600; font-size: 1.1rem;">${drop.title}</h3>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 8px;">📍 ${drop.locationName}</p>
                        <p style="color: #999; font-size: 0.875rem; margin-bottom: 4px;">by <strong>${drop.artistName}</strong></p>
                        ${distanceText}
                        <div style="display: flex; gap: 8px; margin-top: 12px; font-size: 0.8rem; color: var(--text-gray);">
                            <span>Found ${drop.foundCount || 0} time${(drop.foundCount || 0) !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>$${(drop.totalDonations || 0).toFixed(2)} donated</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        feedHTML += '</div>';
    }
    
    feedHTML += `
            <div style="text-align: center; margin-top: 3rem; padding: 2rem 1rem; background: var(--light-gray); border-radius: 12px;">
                <h3 style="margin-bottom: 1rem;">Want More Control?</h3>
                <p style="color: var(--text-gray); margin-bottom: 1rem;">
                    Use the interactive map to filter by location type, distance, and status.
                </p>
                <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 44px;">
                    Open Map View
                </button>
            </div>
        </div>
    `;
    
    return feedHTML;
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
                    
                    <div class="artist-info-section" onclick="app.showPage('artist-profile', {artistId: '${drop.artistId}'}); app.closeOverlay('detailsOverlay');" style="cursor: pointer;">
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
    const locations = appState.locations || [];
    
    let html = `
        <div class="container">
            <h1>Popular Locations</h1>
            <p style="color: var(--text-gray); margin-bottom: 2rem;">Discover hotspots for art drops</p>
            <div class="locations-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
    `;
    
    if (locations.length === 0) {
        html += `
            <div class="empty-state" style="text-align: center; padding: 60px 20px;">
                <svg class="icon" style="width: 80px; height: 80px; margin-bottom: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>No locations yet</h3>
                <p>Check back soon as artists discover new locations!</p>
            </div>
        `;
    } else {
        locations.forEach(location => {
            const followers = location.followerCount || 0;
            const drops = location.activeDropCount || 0;
            
            const isFollowing = appState.currentUser ? 
                appState.follows.some(f => 
                    f.followerId === appState.currentUser.id && 
                    f.targetType === 'location' && 
                    f.targetId === location.id
                ) : false;
            
            html += `
                <div class="card" onclick="app.showPage('location-detail', {locationId: '${location.id}'})" style="cursor: pointer;">
                    <img src="${location.locationPhoto}" alt="${location.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;" />
                    <div class="card-content" style="padding: 16px;">
                        <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 1.1rem;">${location.name}</h3>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 8px;">📍 ${location.city}, ${location.state}</p>
                        <div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: #999; margin-bottom: 12px;">
                            <span>${followers} follower${followers !== 1 ? 's' : ''}</span>
                            <span>${drops} drop${drops !== 1 ? 's' : ''}</span>
                        </div>
                        <button class="btn btn-primary" onclick="event.stopPropagation(); app.toggleFollowLocation('${location.id}')" style="width: 100%; min-height: 40px; font-size: 0.9rem;">
                            ${isFollowing ? '✓ Following' : 'Follow Location'}
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
            </div>
            <div style="text-align: center; margin-top: 2rem; padding: 2rem 1rem; background: var(--light-gray); border-radius: 12px;">
                <h3 style="margin-bottom: 1rem;">Explore by Map</h3>
                <p style="color: var(--text-gray); margin-bottom: 1rem;">
                    Want to find art drops near you? Use the interactive map to discover locations in your area.
                </p>
                <button class="btn btn-primary" onclick="app.showPage('browse-map')" style="min-height: 44px;">
                    View on Map
                </button>
            </div>
        </div>
    `;
    
    return html;
},

            renderLocationDetail(locationId) {
    // Defensive lookup with type-safe ID matching
    const location = appState.locations.find(l => String(l.id) === String(locationId));
    
    if (!location) {
        console.error('Location not found:', locationId, 'Available locations:', appState.locations);
        return `
            <div class="container" style="text-align: center; padding: 3rem 1rem;">
                <h2>Location Not Found</h2>
                <p style="color: var(--text-gray); margin: 1rem 0 2rem;">
                    This location doesn't exist or hasn't been loaded yet.
                </p>
                <button class="btn btn-primary" onclick="app.showPage('popular-locations')">
                    Browse Locations
                </button>
            </div>
        `;
    }

    // Get art drops at this location
    const dropsAtLocation = appState.artDrops.filter(d => 
        d.locationName === location.name || 
        String(d.locationId) === String(location.id)
    );

    // Check if user follows this location
    const isFollowing = appState.currentUser ? 
        appState.follows.some(f => 
            f.followerId === appState.currentUser.id && 
            f.targetType === 'location' && 
            String(f.targetId) === String(location.id)
        ) : false;

    return `
        <div class="container">
            <div class="location-header" style="margin-bottom: 3rem;">
                <img src="${location.locationPhoto || 'https://via.placeholder.com/1200x400?text=Location'}" 
                     alt="${location.name}" 
                     style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 2rem;">
                
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 2rem; flex-wrap: wrap;">
                    <div>
                        <h1 style="margin: 0 0 0.5rem;">${location.name}</h1>
                        <p style="color: var(--text-gray); font-size: 1.1rem; margin: 0;">
                            📍 ${location.city}, ${location.state}
                        </p>
                    </div>
                    
                    ${appState.currentUser ? `
                    <button class="btn btn-${isFollowing ? 'secondary' : 'primary'}" 
                            onclick="app.toggleFollowLocation('${location.id}')" 
                            style="min-height: 48px; min-width: 150px;">
                        ${isFollowing ? '✓ Following' : '+ Follow Location'}
                    </button>
                    ` : ''}
                </div>
                
                <div style="display: flex; gap: 3rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-gray);">
                    <div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-black);">${location.followerCount || 0}</div>
                        <div style="color: var(--text-gray);">Followers</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-black);">${dropsAtLocation.length}</div>
                        <div style="color: var(--text-gray);">Art Drops</div>
                    </div>
                    <div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-black);">${location.locationType || 'Outdoor'}</div>
                        <div style="color: var(--text-gray);">Type</div>
                    </div>
                </div>
            </div>

            ${dropsAtLocation.length > 0 ? `
            <h2 style="margin-bottom: 2rem;">Art at This Location</h2>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-bottom: 3rem;">
                ${dropsAtLocation.map(drop => this.renderDropCard(drop)).join('')}
            </div>
            ` : `
            <div style="text-align: center; padding: 3rem 1rem; background: var(--light-gray); border-radius: 12px;">
                <h3>No art drops yet</h3>
                <p style="color: var(--text-gray); margin: 1rem 0 2rem;">Be the first to drop art at this location!</p>
                ${appState.currentUser ? `
                <button class="btn btn-primary" onclick="app.showPage('drop-new-art')" style="min-height: 48px;">
                    Drop Art Here
                </button>
                ` : ''}
            </div>
            `}

            <div style="margin-top: 3rem;">
                <h2 style="margin-bottom: 1rem;">Location Map</h2>
                <div id="locationDetailMap" style="width: 100%; height: 400px; border-radius: 12px; background: var(--light-gray);"></div>
            </div>
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
                                                <button class="btn btn-secondary" onclick="app.toggleFollowArtist('${artist.id}')" style="min-height: 40px; padding: 0.5rem 1.5rem;">Unfollow</button>
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
                                                <button class="btn btn-secondary" onclick="app.toggleFollowLocation('${location.id}')" style="min-height: 40px; padding: 0.5rem 1.5rem;">Unfollow</button>
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
    try {
        // Convert dropId to string if it's an object
        const dropIdString = typeof dropId === 'object' && dropId.id ? dropId.id : String(dropId);
        
        const qrcodeElement = document.getElementById('qrcode');
        if (!qrcodeElement) {
            console.error('QR code element not found');
            return;
        }

        if (typeof QRCode === 'undefined') {
            console.error('QRCode library not loaded');
            return;
        }

        // Clear any existing QR code
        qrcodeElement.innerHTML = '';

        // Generate QR code with drop URL
        const qrText = `https://artdrops.app/drop/${dropIdString}`;
        new QRCode(qrcodeElement, {
            text: qrText,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log('✅ QR code generated for:', qrText);
    } catch (error) {
        console.error('❌ Error generating QR code:', error);
    }
},

            // ============================================
            // MAP INITIALIZATION
            // ============================================

            initLandingMap() {
                // Not using map on landing for minimalist approach
            },

            async initBrowseMap() {
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
        locateControl.onAdd = function(mapInstance) {
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
                            mapInstance.setView([position.coords.latitude, position.coords.longitude], 13);
                            if (userMarker) {
                                mapInstance.removeLayer(userMarker);
                            }
                            userMarker = L.marker([position.coords.latitude, position.coords.longitude], {
                                icon: L.divIcon({
                                    className: 'user-location-marker',
                                    html: '<div style="background: #000; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>',
                                    iconSize: [24, 24]
                                })
                            }).addTo(mapInstance);
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
        
        // ============================================
        // FIREBASE INTEGRATION - Load art drops
        // ============================================
        
        let artDrops = [];
        
        try {
            // Try to load from Firebase first
            console.log('Loading art drops from Firebase...');
            const firebaseDrops = await getFirebaseArtDrops({ status: 'active' });
            
            if (firebaseDrops && firebaseDrops.length > 0) {
                artDrops = firebaseDrops;
                console.log('✅ Loaded', artDrops.length, 'drops from Firebase');
            } else {
                // Fallback to in-memory data
                artDrops = appState.artDrops;
                console.log('Using', artDrops.length, 'drops from memory');
            }
        } catch (error) {
            console.error('Error loading Firebase drops, using fallback data:', error);
            artDrops = appState.artDrops;
        }
        
        // Add markers for each art drop
        artDrops.forEach(drop => {
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
                    <button onclick="app.showPage('art-story', {dropId: '${drop.id}'})" style="margin-top: 1rem; padding: 1rem; background: #000000; color: #FFFFFF; border: none; cursor: pointer; width: 100%; font-weight: 600;">View Story</button>
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
        // Use user location if available, otherwise default
        const lat = appState.userLocation ? appState.userLocation.latitude : 40.7589;
        const lon = appState.userLocation ? appState.userLocation.longitude : -73.9851;

        const map = L.map('dropLocationMap').setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Force map to refresh size
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Add click handler to place marker
        let marker = null;
        
        // Add initial marker if user location exists
        if (appState.userLocation) {
            marker = L.marker([lat, lon]).addTo(map);
        }

        map.on('click', (e) => {
            // Remove old marker
            if (marker) {
                map.removeLayer(marker);
            }
            
            // Add new marker
            marker = L.marker(e.latlng).addTo(map);
            
            // Update form fields
            const latInput = document.querySelector('[name="latitude"]');
            const lonInput = document.querySelector('[name="longitude"]');
            
            if (latInput) latInput.value = e.latlng.lat.toFixed(6);
            if (lonInput) lonInput.value = e.latlng.lng.toFixed(6);
            
            console.log('✅ Location set:', e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
        });

        // Store map instance
        this.dropLocationMapInstance = map;
        
        console.log('✅ Drop location map initialized');

    } catch (error) {
        console.error('Error initializing drop location map:', error);
    }
},

            updateDropLocationMap(lat, lng) {
    if (!this.dropLocationMapInstance) {
        console.warn('Map instance not initialized');
        return;
    }

    try {
        // Center map on new location
        this.dropLocationMapInstance.setView([lat, lng], 13);
        
        // Remove all existing layers except tile layer
        this.dropLocationMapInstance.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                this.dropLocationMapInstance.removeLayer(layer);
            }
        });
        
        // Add new marker
        L.marker([lat, lng]).addTo(this.dropLocationMapInstance);
        
        // Refresh map size
        this.dropLocationMapInstance.invalidateSize();
        
        console.log('✅ Map updated to:', lat, lng);
    } catch (error) {
        console.error('Error updating drop location map:', error);
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

      

app.signInWithGoogle = async function() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        
        console.log("✅ Google sign in successful:", result.user.email);
        
        await ensureUserDocument(result.user);
        
        appState.currentUser = {
            id: result.user.uid,
            name: result.user.displayName,
            email: result.user.email,
            profilePhoto: result.user.photoURL || 'https://i.pravatar.cc/200?img=1',
            userType: 'artist'
        };
        
        this.showToast('Welcome, ' + result.user.displayName + '!');
        this.showPage('home');
        
    } catch (error) {
        console.error('❌ Google sign in error:', error);
        this.showToast('Sign in failed: ' + error.message);
    }
};

app.signInWithApple = async function() {
    try {
        const provider = new OAuthProvider('apple.com');
        const result = await signInWithPopup(auth, provider);
        
        console.log("✅ Apple sign in successful");
        
        await ensureUserDocument(result.user);
        
        appState.currentUser = {
            id: result.user.uid,
            name: result.user.displayName || 'Apple User',
            email: result.user.email,
            profilePhoto: result.user.photoURL || 'https://i.pravatar.cc/200?img=50',
            userType: 'artist'
        };
        
        this.showToast('Welcome!');
        this.showPage('home');
        
    } catch (error) {
        console.error('❌ Apple sign in error:', error);
        this.showToast('Sign in failed: ' + error.message);
    }
};

app.logout = async function() {
    try {
        await firebaseSignOut(auth);
        appState.currentUser = null;
        this.showToast('Signed out successfully');
        this.showPage('landing');
    } catch (error) {
        console.error('❌ Logout error:', error);
        this.showToast('Logout failed');
    }
};

app.loadMapWithFirebaseData = async function() {
    try {
        // Load Firebase data instead of using appState
        const firebaseDrops = await getFirebaseArtDrops({ status: 'active' });
        
        // Use firebaseDrops if available, otherwise fall back to appState
        const artDrops = firebaseDrops.length > 0 ? firebaseDrops : appState.artDrops;
        
        console.log("Loading map with", artDrops.length, "drops");
        
        // Then render map as usual - your existing map code works
        this.initBrowseMap(artDrops);
        
    } catch (error) {
        console.error("❌ Error loading map:", error);
    }
};

app.loadFeedWithFirebaseData = async function() {
    try {
        // Load Firebase data
        const firebaseDrops = await getFirebaseArtDrops({ limit: 20 });
        
        // Use Firebase data if available, otherwise fall back to appState
        const artDrops = firebaseDrops.length > 0 ? firebaseDrops : appState.artDrops;
        
        console.log("Loading feed with", artDrops.length, "drops");
        
        // Then render feed as usual - your existing feed rendering works
        return this.renderFeed(artDrops);
        
    } catch (error) {
        console.error("❌ Error loading feed:", error);
        return this.renderFeed(appState.artDrops); // Fallback
    }
};

app.handleDropNewArtWithFirebase = async function(e) {
    e.preventDefault();
    
    try {
        if (!auth.currentUser) {
            this.showToast('Please sign in first');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        // Get form data
        const photoInput = document.getElementById('dropPhotoInput');
        let photoUrl = '';
        
        // If photo was uploaded, upload to Firebase Storage
        if (photoInput && photoInput.files.length > 0) {
            photoUrl = await uploadPhotoToStorage(photoInput.files[0]);
        } else {
            photoUrl = document.getElementById('dropPhotoUrl')?.value || '';
        }
        
        const formData = {
            title: document.getElementById('dropTitle')?.value,
            story: document.getElementById('dropStory')?.value,
            photoUrl: photoUrl,
            latitude: document.getElementById('dropLatitude')?.value,
            longitude: document.getElementById('dropLongitude')?.value,
            locationType: document.getElementById('dropLocationType')?.value,
            locationName: document.getElementById('dropLocationName')?.value,
            materials: document.getElementById('dropMaterials')?.value
        };

        
        // Create in Firebase
        await createArtDropInFirebase(formData);
        
        this.showToast('Art drop created successfully!');
        e.target.reset();
        this.showPage('home');
        
    } catch (error) {
        console.error('❌ Error:', error);
        this.showToast('Failed to create drop: ' + error.message);
    } finally {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create & Generate QR Tag';
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 ArtDrops app loaded");
    app.init();
});

window.app = app;


        
        
