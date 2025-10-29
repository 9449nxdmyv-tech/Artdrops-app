// ============================================
// DONATIONS SERVICE
// ============================================


import { 
    collection, 
    addDoc,
    updateDoc,
    doc,
    increment,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { db } from './firebase-config.js';

export const donationsService = {
    /**
     * Record a donation
     */
    async recordDonation(donationData) {
        try {
            const donation = {
                dropId: donationData.dropId,
                artistId: donationData.artistId,
                donorId: donationData.donorId,
                donorName: donationData.donorName,
                amount: donationData.amount,
                message: donationData.message || '',
                paymentMethod: donationData.paymentMethod || 'card',
                dateDonated: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'donations'), donation);
            console.log('✅ Donation recorded:', docRef.id);
            
            // Update artist total donations
            if (donationData.artistId) {
                await this.updateArtistDonations(
                    donationData.artistId, 
                    donationData.amount
                );
            }
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('❌ Error recording donation:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update artist donation totals
     */
    async updateArtistDonations(artistId, amount) {
        try {
            await updateDoc(doc(db, 'users', artistId), {
                totalDonations: increment(amount),
                donationCount: increment(1)
            });
            console.log('✅ Artist donations updated');
        } catch (error) {
            console.error('Error updating artist donations:', error);
        }
    },

    /**
     * Get suggested donation amounts
     */
    getSuggestedAmounts() {
        return [1, 3, 5, 10, 20];
    },

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    /**
     * Validate donation amount
     */
    validateAmount(amount) {
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { valid: false, error: 'Please enter a valid amount' };
        }
        
        if (numAmount < 1) {
            return { valid: false, error: 'Minimum donation is $1' };
        }
        
        if (numAmount > 1000) {
            return { valid: false, error: 'Maximum donation is $1000' };
        }
        
        return { valid: true, amount: numAmount };
    }
};
