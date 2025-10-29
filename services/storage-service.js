// ============================================
// STORAGE SERVICE - PHOTO UPLOADS
// ============================================


import { 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';
import { storage } from './services/firebase-config.js';

export const storageService = {
    /**
     * Upload a photo to Firebase Storage
     */
    async uploadPhoto(file, path = 'artDrops') {
        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            const filename = `${timestamp}_${randomString}_${file.name}`;
            const storageRef = ref(storage, `${path}/${filename}`);
            
            console.log('📤 Uploading photo...');
            
            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            console.log('✅ Photo uploaded:', snapshot.metadata.fullPath);
            
            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('✅ Download URL obtained');
            
            return { 
                success: true, 
                url: downloadURL,
                path: snapshot.metadata.fullPath 
            };
        } catch (error) {
            console.error('❌ Error uploading photo:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    /**
     * Upload profile photo
     */
    async uploadProfilePhoto(file, userId) {
        return await this.uploadPhoto(file, `profiles/${userId}`);
    },

    /**
     * Upload art drop photo
     */
    async uploadArtDropPhoto(file) {
        return await this.uploadPhoto(file, 'artDrops');
    },

    /**
     * Compress image before upload
     */
    async compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = (height / width) * maxWidth;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            resolve(new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            }));
                        },
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    },

    /**
     * Validate image file
     */
    validateImage(file, maxSizeMB = 5) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        if (!validTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Please upload a valid image (JPEG, PNG, or WebP)'
            };
        }

        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `Image must be smaller than ${maxSizeMB}MB`
            };
        }

        return { valid: true };
    }
};
