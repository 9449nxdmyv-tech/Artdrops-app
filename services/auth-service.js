// ============================================
// AUTHENTICATION SERVICE
// ============================================

import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    OAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, setDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { state } from './state-manager.js';

export const authService = {
    /**
     * Initialize authentication state listener
     */
    initAuthListener(onAuthChange) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('👤 User authenticated:', user.email);
                const userData = await this.getUserData(user.uid);
                state.setState({ 
                    currentUser: userData,
                    isAuthenticated: true 
                });
                onAuthChange(userData);
            } else {
                console.log('👤 User signed out');
                state.setState({ 
                    currentUser: null,
                    isAuthenticated: false 
                });
                onAuthChange(null);
            }
        });
    },

    /**
     * Sign in with Google
     */
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Check if user profile exists, create if not
            await this.ensureUserProfile(user);
            
            console.log('✅ Google sign-in successful');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in with Apple
     */
    async signInWithApple() {
        try {
            const provider = new OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');
            
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Check if user profile exists, create if not
            await this.ensureUserProfile(user);
            
            console.log('✅ Apple sign-in successful');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Apple sign-in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign in with email and password
     */
    async signInWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log('✅ Email sign-in successful');
            return { success: true, user: result.user };
        } catch (error) {
            console.error('❌ Email sign-in error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create account with email and password
     */
    async createAccountWithEmail(email, password, displayName) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;
            
            // Create user profile
            await this.createUserProfile(user, { displayName });
            
            console.log('✅ Account created successfully');
            return { success: true, user };
        } catch (error) {
            console.error('❌ Account creation error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        try {
            await firebaseSignOut(auth);
            console.log('✅ Sign out successful');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user data from Firestore
     */
    async getUserData(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return { id: userId, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },

    /**
     * Ensure user profile exists in Firestore
     */
    async ensureUserProfile(user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            await this.createUserProfile(user);
        }
    },

    /**
     * Create user profile in Firestore
     */
    async createUserProfile(user, additionalData = {}) {
        const userRef = doc(db, 'users', user.uid);
        const userData = {
            email: user.email,
            displayName: additionalData.displayName || user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            isArtist: additionalData.isArtist || false,
            bio: additionalData.bio || '',
            location: additionalData.location || '',
            website: additionalData.website || '',
            instagram: additionalData.instagram || '',
            followerCount: 0,
            dropCount: 0,
            findCount: 0,
            dateJoined: new Date().toISOString()
        };
        
        await setDoc(userRef, userData);
        console.log('✅ User profile created');
        return userData;
    },

    /**
     * Update user profile
     */
    async updateUserProfile(userId, updates) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, updates);
            console.log('✅ Profile updated');
            return { success: true };
        } catch (error) {
            console.error('❌ Profile update error:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        return auth.currentUser;
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!auth.currentUser;
    }
};
