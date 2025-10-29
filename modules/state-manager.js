// ============================================
// STATE MANAGER
// ============================================

class StateManager {
    constructor() {
        this.state = {
            currentUser: null,
            isAuthenticated: false,
            currentPage: 'landing',
            userLocation: null,
            selectedDrop: null,
            selectedArtist: null,
            selectedLocation: null,
            filters: {
                searchQuery: '',
                artistFilter: 'all',
                statusFilter: 'all',
                sortBy: 'recent'
            },
            artDrops: [],
            artists: [],
            locations: [],
            isLoading: false
        };
        this.listeners = [];
    }

    /**
     * Update state and notify listeners
     */
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        this.notifyListeners(oldState, this.state);
    }

    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners(oldState, newState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            currentUser: null,
            isAuthenticated: false,
            currentPage: 'landing',
            userLocation: null,
            selectedDrop: null,
            selectedArtist: null,
            selectedLocation: null,
            filters: {
                searchQuery: '',
                artistFilter: 'all',
                statusFilter: 'all',
                sortBy: 'recent'
            }
        });
    }
}

// Export singleton instance
export const state = new StateManager();
