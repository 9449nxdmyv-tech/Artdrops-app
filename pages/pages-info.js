// ============================================
// PAGE RENDERERS - INFO PAGES (About, How It Works, Contact)
// ============================================

import { state } from './state-manager.js';
import { uiModule } from './ui-module.js';

export const infoPages = {
    /**
     * Render how it works page
     */
    renderHowItWorks() {
        const content = document.getElementById('howItWorksContent');
        if (!content) return;

        content.innerHTML = `
            <div class="info-container how-it-works">
                <button class="btn-back" onclick="app.showPage('landing')">← Back</button>
                
                <h1>How It Works</h1>
                <p class="intro">ArtDrops is a platform where artists share hidden art and community members hunt to find it</p>

                <div class="steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h3>🎨 Artists Create Drops</h3>
                            <p>Artists upload a photo of their work, write a story about it, and mark a specific location where it's hidden in the city.</p>
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h3>🗺️ Community Discovers</h3>
                            <p>Finders browse nearby art drops, search by location or artist, and get excited about the hunt.</p>
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h3>🎉 Finding & Celebrating</h3>
                            <p>When a finder locates the art drop in real life, they can mark it as found and share their discovery with the community.</p>
                        </div>
                    </div>

                    <div class="step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h3>💝 Supporting Artists</h3>
                            <p>Finders can like drops and make optional donations directly to support the artists who created the work.</p>
                        </div>
                    </div>
                </div>

                <div class="faq-section">
                    <h2>Frequently Asked Questions</h2>
                    
                    <div class="faq-item">
                        <h4>Do I need to find the actual physical art?</h4>
                        <p>Yes! Part of the fun is actually going out and discovering the art in your city. When you find it, take a photo or mark it as found in the app.</p>
                    </div>

                    <div class="faq-item">
                        <h4>What if an art drop is damaged?</h4>
                        <p>Contact the artist! We provide messaging between finders and artists. Each drop is an experiment in temporary public art.</p>
                    </div>

                    <div class="faq-item">
                        <h4>Can I create a drop anywhere?</h4>
                        <p>You should always get permission from the location owner. We're committed to responsible public art and legal practices.</p>
                    </div>

                    <div class="faq-item">
                        <h4>How do artists get paid?</h4>
                        <p>Finders can make optional donations. Artists also build a following and can showcase their work to the community.</p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render about page
     */
    renderAbout() {
        const content = document.getElementById('aboutContent');
        if (!content) return;

        content.innerHTML = `
            <div class="info-container about">
                <button class="btn-back" onclick="app.showPage('landing')">← Back</button>
                
                <h1>About ArtDrops</h1>

                <div class="about-hero">
                    <h2>Bridging Street Art and Community</h2>
                    <p>ArtDrops is a community platform that celebrates street art, supports local artists, and brings people together through the joy of discovery.</p>
                </div>

                <div class="about-section">
                    <h3>Our Mission</h3>
                    <p>We believe street art brings color, inspiration, and joy to our communities. ArtDrops creates a space where artists can share their work with the world and finders can experience the excitement of discovery.</p>
                </div>

                <div class="about-section">
                    <h3>Our Values</h3>
                    <ul>
                        <li><strong>Artistic Expression:</strong> We celebrate all forms of creative art</li>
                        <li><strong>Community:</strong> We foster connections between artists and art lovers</li>
                        <li><strong>Responsible Art:</strong> We encourage legal, ethical public art practices</li>
                        <li><strong>Support:</strong> We help artists receive recognition and financial support for their work</li>
                        <li><strong>Discovery:</strong> We believe in the magic of finding something beautiful unexpectedly</li>
                    </ul>
                </div>

                <div class="about-section">
                    <h3>The Team</h3>
                    <p>ArtDrops was founded by a small team of artists, developers, and art enthusiasts who wanted to create a better way for communities to engage with street art.</p>
                </div>

                <div class="about-section">
                    <h3>Safety & Community Guidelines</h3>
                    <p>We take community safety seriously. All art drops must comply with local laws and regulations. Artists are responsible for getting proper permissions and ensuring their work doesn't interfere with public infrastructure or safety.</p>
                </div>
            </div>
        `;
    },

    /**
     * Render contact page
     */
    renderContact() {
        const content = document.getElementById('contactContent');
        if (!content) return;

        content.innerHTML = `
            <div class="info-container contact">
                <button class="btn-back" onclick="app.showPage('landing')">← Back</button>
                
                <h1>Contact Us</h1>
                <p class="subtitle">We'd love to hear from you</p>

                <div class="contact-form-container">
                    <form id="contactForm" class="contact-form">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" id="contactName" placeholder="Your name" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="contactEmail" placeholder="your@email.com" class="form-input" required>
                        </div>

                        <div class="form-group">
                            <label>Subject</label>
                            <select id="contactSubject" class="form-select" required>
                                <option value="">Select a subject...</option>
                                <option value="feedback">Feedback</option>
                                <option value="bug">Report a Bug</option>
                                <option value="feature">Feature Request</option>
                                <option value="partnership">Partnership Inquiry</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Message</label>
                            <textarea id="contactMessage" placeholder="Your message..." class="form-textarea" rows="6" required></textarea>
                        </div>

                        <button type="submit" class="btn-primary btn-block" onclick="app.handleContactSubmit(event)">
                            Send Message
                        </button>
                    </form>

                    <div class="contact-info">
                        <h3>Other Ways to Reach Us</h3>
                        <p>📧 Email: <a href="mailto:info@artdrops.app">info@artdrops.app</a></p>
                        <p>🐦 Twitter: <a href="https://twitter.com/artdrops" target="_blank">@artdrops</a></p>
                        <p>📸 Instagram: <a href="https://instagram.com/artdrops" target="_blank">@artdrops</a></p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('contactForm')?.addEventListener('submit', (e) => {
            app.handleContactSubmit(e);
        });
    },

    /**
     * Render locations page
     */
    renderPopularLocations() {
        const { locations } = state.getState();
        const content = document.getElementById('popularLocationsContent');
        if (!content) return;

        if (!locations || locations.length === 0) {
            content.innerHTML = uiModule.renderEmptyState('No locations yet');
            return;
        }

        // Sort by drop count
        const sortedLocations = [...locations].sort((a, b) => (b.dropCount || 0) - (a.dropCount || 0));

        content.innerHTML = `
            <div class="locations-container">
                <h2>Popular Locations</h2>
                <p class="subtitle">Cities with the most art drops</p>

                <div class="locations-grid">
                    ${sortedLocations.map(location => `
                        <div class="location-card" onclick="app.showPage('locationDetail', {locationId: '${location.id}'})">
                            <div class="location-header">
                                <h3>${location.venueName || 'Unnamed Location'}</h3>
                                <p class="location-address">${location.city}, ${location.state} ${location.zipCode}</p>
                            </div>
                            <div class="location-stats">
                                <div class="location-stat">
                                    <span class="stat-icon">🎨</span>
                                    <span class="stat-value">${location.dropCount || 0}</span>
                                    <span class="stat-label">Drops</span>
                                </div>
                                <div class="location-stat">
                                    <span class="stat-icon">👥</span>
                                    <span class="stat-value">${location.followerCount || 0}</span>
                                    <span class="stat-label">Following</span>
                                </div>
                            </div>
                            <button class="btn-secondary btn-block" onclick="event.stopPropagation(); app.toggleFollowLocation('${location.id}')">
                                Follow Location
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render location detail page
     */
    renderLocationDetail(data) {
        const { locationId } = data;
        const { locations, artDrops } = state.getState();
        const location = locations?.find(l => l.id === locationId);

        if (!location) {
            const content = document.getElementById('locationDetailContent');
            if (content) content.innerHTML = uiModule.renderErrorState('Location not found');
            return;
        }

        const locationDrops = artDrops?.filter(drop => {
            const distance = dropsService.calculateDistance(
                location.latitude, location.longitude,
                drop.latitude, drop.longitude
            );
            return distance <= 0.1;
        }) || [];

        const content = document.getElementById('locationDetailContent');
        if (!content) return;

        content.innerHTML = `
            <div class="location-detail-container">
                <button class="btn-back" onclick="app.showPage('popularLocations')">← Back</button>
                
                <div class="location-detail-header">
                    <h1>${location.venueName || 'Location'}</h1>
                    <p class="location-address">
                        📍 ${location.city}, ${location.state} ${location.zipCode}
                    </p>
                    <button class="btn-primary" onclick="app.toggleFollowLocation('${location.id}')">
                        Follow Location
                    </button>
                </div>

                <div class="location-detail-stats">
                    <div class="stat">
                        <div class="stat-value">${location.dropCount || 0}</div>
                        <div class="stat-label">Art Drops</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${location.followerCount || 0}</div>
                        <div class="stat-label">Followers</div>
                    </div>
                </div>

                <div class="location-drops">
                    <h2>Art Drops at This Location</h2>
                    ${locationDrops.length === 0 
                        ? '<p>No art drops at this location yet</p>'
                        : `
                            <div class="drops-grid">
                                ${locationDrops.map(drop => `
                                    <div class="drop-card" onclick="app.showPage('artStory', {dropId: '${drop.id}'})">
                                        <img src="${drop.photoUrl}" alt="${drop.title}">
                                        <div class="drop-content">
                                            <h3>${drop.title}</h3>
                                            <p>${drop.artistName}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `
                    }
                </div>
            </div>
        `;
    }
};
