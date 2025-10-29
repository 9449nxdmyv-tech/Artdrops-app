// ============================================
// PAGE RENDERERS - LANDING & AUTH PAGES
// ============================================

import { state } from './state-manager.js';
import { authService } from './auth-service.js';
import { uiModule } from './ui-module.js';
import { utils } from './utils.js';

export const authPages = {
    /**
     * Render landing page
     */
    renderLanding() {
        const content = document.getElementById('landingContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="landing-hero">
                <h1>🎨 ArtDrops</h1>
                <p>Discover hidden art in your city</p>
                <div class="landing-actions">
                    <button class="btn-primary btn-large" onclick="app.showPage('finderSignup')">
                        I Want to Find Art
                    </button>
                    <button class="btn-secondary btn-large" onclick="app.showPage('artistSignup')">
                        I'm an Artist
                    </button>
                </div>
            </div>
            <div class="landing-features">
                <div class="feature-card">
                    <div class="feature-icon">🗺️</div>
                    <h3>Discover Nearby</h3>
                    <p>Find hidden art drops near your location</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎉</div>
                    <h3>Join the Hunt</h3>
                    <p>Be the first to find and collect art stories</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">❤️</div>
                    <h3>Support Artists</h3>
                    <p>Donate to support your favorite artists directly</p>
                </div>
            </div>
            <div class="landing-info">
                <button class="link-btn" onclick="app.showPage('howItWorks')">How It Works</button>
                <button class="link-btn" onclick="app.showPage('about')">About Us</button>
                <button class="link-btn" onclick="app.showPage('contact')">Contact</button>
            </div>
        `;
    },

    /**
     * Render finder signup page
     */
    renderFinderSignup() {
        const content = document.getElementById('finderSignupContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="auth-container">
                <h2>Join as an Art Finder</h2>
                <p class="subtitle">Create an account to start finding art drops</p>
                
                <div class="auth-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="finderEmail" placeholder="your@email.com" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="finderPassword" placeholder="••••••••" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Display Name</label>
                        <input type="text" id="finderName" placeholder="Your Name" class="form-input">
                    </div>
                    
                    <button class="btn-primary btn-block" onclick="app.handleFinderSignup()">
                        Create Account
                    </button>
                    
                    <div class="divider">or</div>
                    
                    <button class="btn-google btn-block" onclick="app.signInWithGoogle()">
                        🔵 Sign up with Google
                    </button>
                    
                    <button class="btn-apple btn-block" onclick="app.signInWithApple()">
                        🍎 Sign up with Apple
                    </button>
                </div>
                
                <div class="auth-footer">
                    <p>Already have an account? 
                        <button class="link-btn" onclick="app.showPage('finderLogin')">Sign In</button>
                    </p>
                </div>
            </div>
        `;
        
        this.setupFinderSignupListeners();
    },

    /**
     * Render finder login page
     */
    renderFinderLogin() {
        const content = document.getElementById('finderLoginContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="auth-container">
                <h2>Welcome Back</h2>
                <p class="subtitle">Sign in to your account</p>
                
                <div class="auth-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="loginEmail" placeholder="your@email.com" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="loginPassword" placeholder="••••••••" class="form-input">
                    </div>
                    
                    <button class="btn-primary btn-block" onclick="app.handleFinderLogin()">
                        Sign In
                    </button>
                    
                    <div class="divider">or</div>
                    
                    <button class="btn-google btn-block" onclick="app.signInWithGoogle()">
                        🔵 Sign in with Google
                    </button>
                    
                    <button class="btn-apple btn-block" onclick="app.signInWithApple()">
                        🍎 Sign in with Apple
                    </button>
                </div>
                
                <div class="auth-footer">
                    <p>Don't have an account? 
                        <button class="link-btn" onclick="app.showPage('finderSignup')">Sign Up</button>
                    </p>
                </div>
            </div>
        `;
        
        this.setupFinderLoginListeners();
    },

    /**
     * Render artist signup page
     */
    renderArtistSignup() {
        const content = document.getElementById('artistSignupContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="auth-container">
                <h2>Join as an Artist</h2>
                <p class="subtitle">Create an account to share your art drops</p>
                
                <div class="auth-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="artistEmail" placeholder="your@email.com" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="artistPassword" placeholder="••••••••" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Artist Name</label>
                        <input type="text" id="artistName" placeholder="Your Artist Name" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Bio</label>
                        <textarea id="artistBio" placeholder="Tell us about your art..." class="form-textarea" rows="4"></textarea>
                    </div>
                    
                    <button class="btn-primary btn-block" onclick="app.handleArtistSignup()">
                        Create Artist Account
                    </button>
                    
                    <div class="divider">or</div>
                    
                    <button class="btn-google btn-block" onclick="app.signInWithGoogle()">
                        🔵 Sign up with Google
                    </button>
                </div>
                
                <div class="auth-footer">
                    <p>Already an artist? 
                        <button class="link-btn" onclick="app.showPage('artistLogin')">Sign In</button>
                    </p>
                </div>
            </div>
        `;
        
        this.setupArtistSignupListeners();
    },

    /**
     * Render artist login page
     */
    renderArtistLogin() {
        const content = document.getElementById('artistLoginContent');
        if (!content) return;
        
        content.innerHTML = `
            <div class="auth-container">
                <h2>Artist Sign In</h2>
                <p class="subtitle">Sign in to manage your art drops</p>
                
                <div class="auth-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="artistLoginEmail" placeholder="your@email.com" class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="artistLoginPassword" placeholder="••••••••" class="form-input">
                    </div>
                    
                    <button class="btn-primary btn-block" onclick="app.handleArtistLogin()">
                        Sign In
                    </button>
                    
                    <div class="divider">or</div>
                    
                    <button class="btn-google btn-block" onclick="app.signInWithGoogle()">
                        🔵 Sign in with Google
                    </button>
                </div>
                
                <div class="auth-footer">
                    <p>Not an artist yet? 
                        <button class="link-btn" onclick="app.showPage('artistSignup')">Create Account</button>
                    </p>
                </div>
            </div>
        `;
        
        this.setupArtistLoginListeners();
    },

    /**
     * Setup event listeners for finder signup
     */
    setupFinderSignupListeners() {
        const emailInput = document.getElementById('finderEmail');
        const passwordInput = document.getElementById('finderPassword');
        const nameInput = document.getElementById('finderName');

        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') app.handleFinderSignup();
            });
        }
    },

    /**
     * Setup event listeners for finder login
     */
    setupFinderLoginListeners() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') app.handleFinderLogin();
            });
        }
    },

    /**
     * Setup event listeners for artist signup
     */
    setupArtistSignupListeners() {
        const emailInput = document.getElementById('artistEmail');
        
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') app.handleArtistSignup();
            });
        }
    },

    /**
     * Setup event listeners for artist login
     */
    setupArtistLoginListeners() {
        const emailInput = document.getElementById('artistLoginEmail');
        
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') app.handleArtistLogin();
            });
        }
    }
};
