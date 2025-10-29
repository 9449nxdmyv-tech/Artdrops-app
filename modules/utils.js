// ============================================
// UTILITY HELPERS
// ============================================



export const utils = {
    /**
     * Format distance for display
     */
    formatDistance(miles) {
        if (miles < 0.1) {
            return 'Nearby';
        } else if (miles < 1) {
            return `${(miles * 5280).toFixed(0)} ft`;
        } else if (miles < 10) {
            return `${miles.toFixed(1)} mi`;
        } else {
            return `${Math.round(miles)} mi`;
        }
    },

    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },

    /**
     * Debounce function calls
     */
    debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function calls
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Get coordinates from browser geolocation
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
            );
            const data = await response.json();
            
            if (data.results && data.results[0]) {
                const result = data.results[0];
                const addressComponents = result.address_components;
                
                return {
                    formattedAddress: result.formatted_address,
                    city: this.getAddressComponent(addressComponents, 'locality'),
                    state: this.getAddressComponent(addressComponents, 'administrative_area_level_1'),
                    zipCode: this.getAddressComponent(addressComponents, 'postal_code'),
                    country: this.getAddressComponent(addressComponents, 'country')
                };
            }
            
            return null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    },

    /**
     * Extract address component from Google Maps API response
     */
    getAddressComponent(components, type) {
        const component = components.find(c => c.types.includes(type));
        return component ? component.short_name : '';
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Sanitize user input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove HTML tags
            .substring(0, 1000); // Limit length
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate URL format
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            return false;
        }
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    },

    /**
     * Truncate text with ellipsis
     */
    truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    /**
     * Get image dimensions
     */
    async getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    },

    /**
     * Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Check if mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Get URL parameters
     */
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    /**
     * Set URL parameter without reload
     */
    setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    }
};
