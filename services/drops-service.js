/ ============================================
// FIRESTORE SERVICE - ART DROPS
// ============================================

import { 
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
import { db } from './firebase-config.js';
import { state } from './state-manager.js';

export const dropsService = {
    /**
     * Create a new art drop
     */
    async createDrop(dropData) {
        try {
            const drop = {
                artistId: dropData.artistId,
                artistName: dropData.artistName,
                title: dropData.title,
                story: dropData.story,
                photoUrl: dropData.photoUrl,
                latitude: dropData.latitude,
                longitude: dropData.longitude,
                city: dropData.city || '',
                state: dropData.state || '',
                zipCode: dropData.zipCode || '',
                venueName: dropData.venueName || '',
                status: 'active',
                findCount: 0,
                likeCount: 0,
                dateCreated: serverTimestamp(),
                dateFound: null,
                foundBy: null,
                foundByName: null
            };

            const docRef = await addDoc(collection(db, 'artDrops'), drop);
            console.log('✅ Art drop created:', docRef.id);
            
            // Update artist drop count
            if (dropData.artistId) {
                await this.incrementArtistDropCount(dropData.artistId);
            }
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Error creating drop:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all art drops with optional filters
     */
    async getDrops(filters = {}) {
        try {
            let constraints = [];
            
            if (filters.status) {
                constraints.push(where('status', '==', filters.status));
            }
            
            if (filters.artistId) {
                constraints.push(where('artistId', '==', filters.artistId));
            }
            
            if (filters.orderByField) {
                constraints.push(orderBy(filters.orderByField, filters.orderDirection || 'desc'));
            }
            
            if (filters.limitCount) {
                constraints.push(limit(filters.limitCount));
            }
            
            const q = query(collection(db, 'artDrops'), ...constraints);
            const snapshot = await getDocs(q);
            
            const drops = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            state.setState({ artDrops: drops });
            return drops;
        } catch (error) {
            console.error('❌ Error fetching drops:', error);
            return [];
        }
    },

    /**
     * Get a single drop by ID
     */
    async getDrop(dropId) {
        try {
            const dropDoc = await getDoc(doc(db, 'artDrops', dropId));
            if (dropDoc.exists()) {
                return { id: dropDoc.id, ...dropDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('❌ Error fetching drop:', error);
            return null;
        }
    },

    /**
     * Update drop status (e.g., mark as found)
     */
    async updateDropStatus(dropId, status, finderData = {}) {
        try {
            const updates = {
                status,
                dateFound: status === 'found' ? serverTimestamp() : null,
                foundBy: finderData.userId || null,
                foundByName: finderData.userName || null
            };
            
            await updateDoc(doc(db, 'artDrops', dropId), updates);
            console.log('✅ Drop status updated');
            
            // Update finder's find count
            if (status === 'found' && finderData.userId) {
                await this.incrementUserFindCount(finderData.userId);
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ Error updating drop:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Delete a drop
     */
    async deleteDrop(dropId) {
        try {
            await deleteDoc(doc(db, 'artDrops', dropId));
            console.log('✅ Drop deleted');
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting drop:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Toggle like on a drop
     */
    async toggleLike(dropId, userId) {
        try {
            const likeId = `${userId}_${dropId}`;
            const likeRef = doc(db, 'likes', likeId);
            const likeSnap = await getDoc(likeRef);
            
            if (likeSnap.exists()) {
                // Unlike
                await deleteDoc(likeRef);
                await updateDoc(doc(db, 'artDrops', dropId), {
                    likeCount: increment(-1)
                });
                console.log('✅ Drop unliked');
                return { success: true, liked: false };
            } else {
                // Like
                await setDoc(likeRef, {
                    userId,
                    dropId,
                    dateLiked: serverTimestamp()
                });
                await updateDoc(doc(db, 'artDrops', dropId), {
                    likeCount: increment(1)
                });
                console.log('✅ Drop liked');
                return { success: true, liked: true };
            }
        } catch (error) {
            console.error('❌ Error toggling like:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if user has liked a drop
     */
    async hasUserLiked(dropId, userId) {
        try {
            const likeId = `${userId}_${dropId}`;
            const likeSnap = await getDoc(doc(db, 'likes', likeId));
            return likeSnap.exists();
        } catch (error) {
            console.error('Error checking like status:', error);
            return false;
        }
    },

    /**
     * Get drops near a location
     */
    async getDropsNearLocation(latitude, longitude, radiusMiles = 25) {
        // Note: Firestore doesn't support geoqueries natively
        // This would require either GeoFirestore or client-side filtering
        const allDrops = await this.getDrops({ status: 'active' });
        
        return allDrops.filter(drop => {
            const distance = this.calculateDistance(
                latitude, 
                longitude, 
                drop.latitude, 
                drop.longitude
            );
            return distance <= radiusMiles;
        });
    },

    /**
     * Calculate distance between two coordinates (Haversine formula)
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
    },

    /**
     * Helper: Increment artist drop count
     */
    async incrementArtistDropCount(artistId) {
        try {
            await updateDoc(doc(db, 'users', artistId), {
                dropCount: increment(1)
            });
        } catch (error) {
            console.error('Error updating artist drop count:', error);
        }
    },

    /**
     * Helper: Increment user find count
     */
    async incrementUserFindCount(userId) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                findCount: increment(1)
            });
        } catch (error) {
            console.error('Error updating user find count:', error);
        }
    }
};
