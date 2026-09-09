/**
 * YANC Centralized Header Web Component (<site-header>)
 * Allows single-point editing of the navigation header across all pages.
 */
class SiteHeader extends HTMLElement {
  connectedCallback() {
    let root = this.getAttribute('root') || './';
    if (!root.endsWith('/')) {
      root += '/';
    }
    const active = (this.getAttribute('active') || '').toLowerCase();

    const isRoot = root === './' || root === '';
    const aboutHref = isRoot ? '#about' : `${root}index.html#about`;
    const eventsHref = isRoot ? '#events' : `${root}index.html#events`;
    const homeHref = isRoot ? '#' : `${root}index.html`;

    this.innerHTML = `
      <nav id="main-nav">
        <!-- Left column: Member Login & Navigation Links -->
        <div class="nav-left-container">
          <div class="nav-actions">
            <a href="https://web.yanc.in" class="nav-login" target="_blank" rel="noopener noreferrer">Member Login</a>
          </div>
          <ul class="nav-links nav-links-left">
            <li><a href="${aboutHref}" class="${active === 'about' ? 'active' : ''}">About</a></li>
            <li><a href="${root}Sections/Programs/value-proposition.html" class="${active === 'programs' ? 'active' : ''}">Programs</a></li>
            <li><a href="${root}Sections/Team/cohort-founders.html" class="${active === 'team' ? 'active' : ''}">Team</a></li>
            <li><a href="${root}Sections/application.html" class="${active === 'application' ? 'active' : ''}">Application</a></li>
          </ul>
        </div>

        <!-- Center column: Logo -->
        <a href="${homeHref}" class="nav-logo">
          <img src="${root}YANC Logo.png" alt="YANC Logo">
        </a>

        <!-- Right column: Navigation Links & Actions -->
        <div class="nav-right-container">
          <ul class="nav-links nav-links-right">
            <li><a href="${eventsHref}">Events</a></li>
            <li><a href="https://web.yanc.in/careers" target="_blank" rel="noopener noreferrer">Careers</a></li>
            <li><a href="${root}Sections/faq.html" class="${active === 'faq' ? 'active' : ''}">FAQs</a></li>
            <li><a href="https://web.yanc.in/contact-us" target="_blank" rel="noopener noreferrer">Contact</a></li>
          </ul>
          <div class="nav-actions">
            <a href="https://web.yanc.in/membership-application" class="nav-apply-btn" target="_blank" rel="noopener noreferrer">Apply</a>
          </div>
        </div>
      </nav>
    `;

    // Handle sticky scroll class
    const nav = this.querySelector('#main-nav');
    if (nav && !window.__yanc_nav_scroll_bound) {
      window.__yanc_nav_scroll_bound = true;
      window.addEventListener('scroll', () => {
        const currentNav = document.getElementById('main-nav');
        if (currentNav) {
          currentNav.classList.toggle('scrolled', window.scrollY > 20);
        }
      }, { passive: true });
    }
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}
