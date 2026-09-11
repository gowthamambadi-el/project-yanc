/**
 * YANC Centralized Header Web Component (<site-header>)
 * Injects unified styling matching index.html across all pages automatically.
 */

(function () {
  // Inject centralized header styling once
  if (!document.getElementById('yanc-header-styles')) {
    const style = document.createElement('style');
    style.id = 'yanc-header-styles';
    style.textContent = `
      site-header {
        display: block;
        width: 100%;
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      site-header nav#main-nav {
        display: grid !important;
        grid-template-columns: 1fr auto 1fr !important;
        align-items: center !important;
        padding: 16px 40px !important;
        position: relative !important;
        width: 100% !important;
        background: rgba(248, 245, 240, 0.94) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border-bottom: 1px solid transparent !important;
        transition: border-color 0.3s ease, background-color 0.3s ease !important;
        box-sizing: border-box !important;
        margin: 0 !important;
      }

      site-header nav#main-nav.scrolled {
        border-bottom-color: #E8E4DD !important;
      }

      site-header .nav-logo {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        text-decoration: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      site-header .nav-logo img {
        height: 28px !important;
        width: auto !important;
        display: block !important;
        object-fit: contain !important;
      }

      site-header .nav-left-container {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-right: 28px !important;
      }

      site-header .nav-links-left {
        display: flex !important;
        gap: 22px !important;
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      site-header .nav-right-container {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        margin-left: 28px !important;
      }

      site-header .nav-links-right {
        display: flex !important;
        gap: 22px !important;
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      site-header .nav-links a {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 12px !important;
        color: #5C5B58 !important;
        text-decoration: none !important;
        transition: color 0.2s ease !important;
        display: inline-flex !important;
        align-items: center !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        line-height: 1 !important;
      }

      site-header .nav-links a:hover,
      site-header .nav-links a.active {
        color: #111110 !important;
      }

      site-header .nav-actions {
        display: flex !important;
        align-items: center !important;
        gap: 24px !important;
      }

      site-header .nav-login {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 12px !important;
        color: #5C5B58 !important;
        text-decoration: none !important;
        transition: color 0.2s ease !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        line-height: 1 !important;
      }

      site-header .nav-login:hover {
        color: #111110 !important;
      }

      site-header .nav-apply-btn {
        background: #111110 !important;
        color: #F8F5F0 !important;
        font-family: 'Instrument Serif', Georgia, serif !important;
        font-style: italic !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        padding: 6px 20px !important;
        border-radius: 100px !important;
        text-decoration: none !important;
        display: inline-block !important;
        transition: background 0.2s ease, transform 0.15s ease !important;
        white-space: nowrap !important;
        line-height: 1.2 !important;
      }

      site-header .nav-apply-btn:hover {
        background: #ff914c !important;
        transform: translateY(-1px) !important;
      }

      @media (max-width: 1200px) {
        site-header .nav-links-left,
        site-header .nav-links-right {
          gap: 16px !important;
        }
        site-header .nav-right-container {
          margin-left: 20px !important;
        }
        site-header .nav-left-container {
          margin-right: 20px !important;
        }
      }

      @media (max-width: 1024px) {
        site-header .nav-links-left,
        site-header .nav-links-right {
          gap: 10px !important;
        }
        site-header .nav-links a {
          font-size: 11px !important;
        }
        site-header .nav-login {
          font-size: 11px !important;
        }
        site-header .nav-apply-btn {
          font-size: 14px !important;
          padding: 5px 16px !important;
        }
        site-header nav#main-nav {
          padding: 16px 20px !important;
        }
      }

      @media (max-width: 768px) {
        site-header nav#main-nav {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 16px 20px !important;
        }

        site-header .nav-links {
          display: none !important;
        }

        site-header .nav-right-container {
          margin-left: 0 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();

class SiteHeader extends HTMLElement {
  connectedCallback() {
    let root = this.getAttribute('root') || './';
    if (!root.endsWith('/')) {
      root += '/';
    }
    const active = (this.getAttribute('active') || '').toLowerCase();

    const isRoot = root === './' || root === '';
    const aboutHref = isRoot ? '#about' : `${root}index.html#about`;
    const eventsHref = `${root}Sections/Events/events.html`;
    const homeHref = isRoot ? '#' : `${root}index.html`;

    this.innerHTML = `
      <nav id="main-nav" role="navigation" aria-label="Main Navigation">
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
        <a href="${homeHref}" class="nav-logo" aria-label="YANC Home">
          <img src="${root}YANC Logo.png" alt="YANC Logo">
        </a>

        <!-- Right column: Navigation Links & Actions -->
        <div class="nav-right-container">
          <ul class="nav-links nav-links-right">
            <li><a href="${eventsHref}" class="${active === 'events' ? 'active' : ''}">Events</a></li>
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

    // Handle sticky scroll border state with throttled RAF
    const nav = this.querySelector('#main-nav');
    if (nav && !window.__yanc_nav_scroll_bound) {
      window.__yanc_nav_scroll_bound = true;
      let headerTicking = false;
      let isCurrentlyScrolled = false;
      window.addEventListener('scroll', () => {
        if (!headerTicking) {
          requestAnimationFrame(() => {
            const shouldBeScrolled = window.scrollY > 20;
            if (shouldBeScrolled !== isCurrentlyScrolled) {
              isCurrentlyScrolled = shouldBeScrolled;
              const currentNav = document.getElementById('main-nav');
              if (currentNav) {
                currentNav.classList.toggle('scrolled', shouldBeScrolled);
              }
            }
            headerTicking = false;
          });
          headerTicking = true;
        }
      }, { passive: true });
    }
  }
}

if (!customElements.get('site-header')) {
  customElements.define('site-header', SiteHeader);
}
