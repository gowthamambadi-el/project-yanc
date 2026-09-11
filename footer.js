/**
 * YANC Centralized Footer Web Component (<site-footer>)
 * Allows single-point editing of the multi-column footer across all pages.
 */
class SiteFooter extends HTMLElement {
  connectedCallback() {
    let root = this.getAttribute('root') || './';
    if (!root.endsWith('/')) {
      root += '/';
    }

    const isRoot = root === './' || root === '';
    const homeHref = isRoot ? '#' : `${root}index.html`;
    const eventsHref = `${root}Sections/events.html`;
    const momentsHref = isRoot ? '#community-moments' : `${root}index.html#community-moments`;

    this.innerHTML = `
      <footer class="yanc-footer" id="contact" role="contentinfo">
        <div class="yanc-footer-inner">
          
          <!-- BRAND & SOCIAL ROW -->
          <div class="yanc-footer-brand-row">
            <div class="yanc-footer-brand-col">
              <a href="${homeHref}" class="yanc-footer-logo-link" aria-label="YANC Home">
                <img src="${root}YANC Logo.png" alt="YANC Logo" class="yanc-footer-logo-img">
              </a>
              <p class="yanc-footer-mission">
                Yet Another Networking Club — empowering young minds through life skills. Exclusive. Experiential. In-person.
              </p>
            </div>

            <!-- SOCIAL CHANNELS -->
            <div class="yanc-footer-social-col">
              <span class="yanc-footer-social-title">Follow Us</span>
              <div class="yanc-footer-social-icons">
                
                <!-- LinkedIn -->
                <a href="https://www.linkedin.com/company/oneyanc" target="_blank" rel="noopener noreferrer" class="yanc-footer-social-btn" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z"/></svg>
                </a>

                <!-- Instagram -->
                <a href="https://instagram.com/yancclub" target="_blank" rel="noopener noreferrer" class="yanc-footer-social-btn" aria-label="Instagram">
                  <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg>
                </a>

                <!-- WhatsApp -->
                <a href="https://api.whatsapp.com/send/?phone=%2B917671819335&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" class="yanc-footer-social-btn" aria-label="WhatsApp">
                  <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24M8.53 7.33c-.14 0-.37.05-.56.27-.19.22-.72.71-.72 1.73s.74 2.01.84 2.15c.1.14 1.42 2.24 3.48 3.09.49.2.87.33 1.17.42.49.16.94.14 1.29.08.4-.06 1.21-.5 1.38-.98.17-.48.17-.89.12-.98-.05-.09-.19-.14-.4-.25s-1.21-.6-1.4-.67c-.19-.07-.33-.1-.47.1-.14.22-.54.67-.66.81-.12.14-.24.16-.45.05-.21-.1-.89-.33-1.69-1.05-.62-.56-1.04-1.25-1.16-1.46-.12-.22-.01-.33.09-.44.1-.1.21-.24.32-.36.1-.12.14-.22.21-.36.07-.15.03-.27-.02-.38-.05-.1-.47-1.14-.64-1.56-.17-.41-.35-.35-.48-.36h-.41Z"/></svg>
                </a>

              </div>
            </div>
          </div>

          <!-- 6-COLUMN LINKS GRID -->
          <div class="yanc-footer-grid" role="navigation" aria-label="Footer Navigation">
            
            <!-- Column 1: Our Offerings -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Our Offerings</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="${root}Sections/Programs/value-proposition.html" class="yanc-footer-link">Value Propositions</a></li>
                <li><a href="${root}Sections/Programs/yanc-advantage.html" class="yanc-footer-link">Why Us</a></li>
                <li><a href="${root}Sections/Programs/who-can-join.html" class="yanc-footer-link">Who Can Join</a></li>
                <li><a href="${root}Sections/Programs/young-minds-mashup.html" class="yanc-footer-link">Young Minds Mashup</a></li>
              </ul>
            </div>

            <!-- Column 2: Careers -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Careers</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="https://web.yanc.in/careers" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Job Openings</a></li>
                <li><a href="https://web.yanc.in/careers" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Internships</a></li>
              </ul>
            </div>

            <!-- Column 3: Application -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Application</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="${root}Sections/application.html" class="yanc-footer-link">Applications</a></li>
                <li><a href="https://web.yanc.in/membership-application" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">YANC Membership</a></li>
                <li><a href="https://web.yanc.in/membership-application" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Discover Meet Registration</a></li>
                <li><a href="https://web.yanc.in/membership-application" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Mentor Registration</a></li>
                <li><a href="https://web.yanc.in/membership-application" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Startup Pitch</a></li>
              </ul>
            </div>

            <!-- Column 4: Events -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Events</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="${eventsHref}" class="yanc-footer-link">Upcoming Events</a></li>
                <li><a href="${momentsHref}" class="yanc-footer-link">Past Events</a></li>
                <li><a href="${momentsHref}" class="yanc-footer-link">Event Gallery</a></li>
              </ul>
            </div>

            <!-- Column 5: Legal -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Legal</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="${root}Sections/Legal/terms-and-conditions.html" class="yanc-footer-link">Terms & Conditions</a></li>
                <li><a href="${root}Sections/Legal/privacy-policy.html" class="yanc-footer-link">Privacy Policy</a></li>
                <li><a href="${root}Sections/Legal/cookie-policy.html" class="yanc-footer-link">Cookie Policy</a></li>
                <li><a href="${root}Sections/Legal/refund-policy.html" class="yanc-footer-link">Refund Policy</a></li>
              </ul>
            </div>

            <!-- Column 6: Support -->
            <div class="yanc-footer-nav-col">
              <h3 class="yanc-footer-col-title">Support</h3>
              <ul class="yanc-footer-links-list">
                <li><a href="${root}Sections/faq.html" class="yanc-footer-link">FAQ</a></li>
                <li><a href="https://web.yanc.in/contact-us" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Contact Us</a></li>
                <li><a href="https://web.yanc.in/contact-us" target="_blank" rel="noopener noreferrer" class="yanc-footer-link">Log Issues</a></li>
              </ul>
            </div>

          </div>

          <!-- BOTTOM SUB-FOOTER BAR -->
          <div class="yanc-footer-bottom">
            <p class="yanc-footer-copyright">
              © 2026 YANC. All rights reserved.
            </p>
            
            <div class="yanc-footer-bottom-meta">
              <span class="yanc-footer-location">
                <span class="yanc-footer-location-dot"></span>
                Hyderabad, India
              </span>
              <span class="yanc-footer-tag">v2026.09.09</span>
            </div>
          </div>

        </div>
      </footer>
    `;
  }
}

if (!customElements.get('site-footer')) {
  customElements.define('site-footer', SiteFooter);
}
