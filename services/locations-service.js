// ============================================
// FIRESTORE SERVICE - LOCATIONS
// ============================================


import { 
    collection, 
    addDoc, 
    getDocs,
    getDoc,
    doc,
    setDoc,
    updateDoc,
    query, 
    where,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-config.js';
import { state } from '../modules/state-manager.js';

export const locationsService = {
    /**
     * Create or update a location
     */
    async createLocation(locationData) {
        try {
            // Check if location already exists
            const existingLocation = await this.findLocationByCoordinates(
                locationData.latitude,
                locationData.longitude
            );

            if (existingLocation) {
                // Increment drop count
                await updateDoc(doc(db, 'locations', existingLocation.id), {
                    dropCount: increment(1)
                });
                return { success: true, id: existingLocation.id, isNew: false };
            }

            // Create new location
            const location = {
                venueName: locationData.venueName || 'Unknown Location',
                city: locationData.city || '',
                state: locationData.state || '',
                zipCode: locationData.zipCode || '',
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                dropCount: 1,
                followerCount: 0,
                dateAdded: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'locations'), location);
            console.log('✅ Location created:', docRef.id);
            return { success: true, id: docRef.id, isNew: true };
        } catch (error) {
            console.error('❌ Error creating location:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all locations
     */
    async getLocations() {
        try {
            const snapshot = await getDocs(collection(db, 'locations'));
            const locations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            state.setState({ locations });
            return locations;
        } catch (error) {
            console.error('❌ Error fetching locations:', error);
            return [];
        }
    },

    /**
     * Get a single location by ID
     */
    async getLocation(locationId) {
        try {
            const locationDoc = await getDoc(doc(db, 'locations', locationId));
            if (locationDoc.exists()) {
                return { id: locationDoc.id, ...locationDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching location:', error);
            return null;
        }
    },

    /**
     * Find location by coordinates (with tolerance)
     */
    async findLocationByCoordinates(latitude, longitude, toleranceMiles = 0.1) {
        const locations = await this.getLocations();
        
        for (const location of locations) {
            const distance = this.calculateDistance(
                latitude,
                longitude,
                location.latitude,
                location.longitude
            );
            
            if (distance <= toleranceMiles) {
                return location;
            }
        }
        
        return null;
    },

    /**
     * Get drops at a location
     */
    async getDropsAtLocation(locationId) {
        try {
            const location = await this.getLocation(locationId);
            if (!location) return [];

            // Query drops near this location
            const allDrops = state.getState().artDrops;
            return allDrops.filter(drop => {
                const distance = this.calculateDistance(
                    location.latitude,
                    location.longitude,
                    drop.latitude,
                    drop.longitude
                );
                return distance <= 0.1; // Within 0.1 miles
            });
        } catch (error) {
            console.error('Error fetching drops at location:', error);
            return [];
        }
    },

    /**
     * Toggle follow location
     */
    async toggleFollow(locationId, userId) {
        try {
            const followId = `${userId}_location_${locationId}`;
            const followRef = doc(db, 'follows', followId);
            const followSnap = await getDoc(followRef);
            
            if (followSnap.exists()) {
                // Unfollow
                await deleteDoc(followRef);
                await updateDoc(doc(db, 'locations', locationId), {
                    followerCount: increment(-1)
                });
                console.log('✅ Location unfollowed');
                return { success: true, following: false };
            } else {
                // Follow
                await setDoc(followRef, {
                    followerId: userId,
                    targetType: 'location',
                    targetId: locationId,
                    dateFollowed: serverTimestamp()
                });
                await updateDoc(doc(db, 'locations', locationId), {
                    followerCount: increment(1)
                });
                console.log('✅ Location followed');
                return { success: true, following: true };
            }
        } catch (error) {
            console.error('❌ Error toggling follow:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if user follows location
     */
    async isFollowing(locationId, userId) {
        try {
            const followId = `${userId}_location_${locationId}`;
            const followSnap = await getDoc(doc(db, 'follows', followId));
            return followSnap.exists();
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    },

    /**
     * Calculate distance between coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
};
