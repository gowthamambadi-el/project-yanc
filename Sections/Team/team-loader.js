/**
 * YANC Team Dynamic Loader (Supabase Integration)
 * Automatically fetches members for the current page category from Supabase,
 * renders cards matching YANC design tokens, and binds the profile zoom modal.
 */

const SUPABASE_CONFIG = {
  url: 'https://jzcabyfyxsugzrxenybx.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y2FieWZ5eHN1Z3pyeGVueWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDczMTQsImV4cCI6MjEwNDk4MzMxNH0.ZWZh8h9xamxFOtPxdkAWmd-AvIEXpVrmd95WaRuQ9Z4'
};

async function loadTeamMembers(category) {
  const container = document.querySelector('.team-grid');
  if (!container) return;

  // Show subtle loading state if empty
  if (!container.children.length) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--ink2);">
        <p style="font-size: 14px;">Loading team members...</p>
      </div>
    `;
  }

  try {
    const res = await fetch(
      `${SUPABASE_CONFIG.url}/rest/v1/team_members?category=eq.${encodeURIComponent(category)}&order=sort_order.asc,created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
        }
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const members = await res.json();

    if (!members || members.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0; color: var(--ink2);">
          <p style="font-size: 14px;">No members listed in this category yet.</p>
        </div>
      `;
      return;
    }

    // Render cards
    container.innerHTML = members.map(m => {
      const hasPhoto = Boolean(m.photo_url);
      const initials = m.initials || m.name.split(' ').map(w => w[0]).join('').slice(-2).toUpperCase();
      const linkedin = m.linkedin_url || 'https://linkedin.com';
      const bio = m.bio ? escapeHtml(m.bio) : 'Bio coming soon.';
      const name = escapeHtml(m.name);
      const role = escapeHtml(m.role);

      return `
        <div class="team-card" 
             data-name="${name}" 
             data-role="${role}" 
             data-bio="${bio}" 
             data-initials="${initials}" 
             data-photo="${hasPhoto ? m.photo_url : ''}" 
             data-linkedin="${linkedin}">
          <div class="card-click-hint">
            <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
            View Bio
          </div>
          <div class="member-photo-wrap">
            <span class="avatar-fallback" style="${hasPhoto ? 'display: none;' : ''}">${initials}</span>
            ${hasPhoto ? `
              <img src="${m.photo_url}" 
                   alt="${name}" 
                   class="member-photo" 
                   loading="lazy"
                   onerror="this.style.display='none'; this.previousElementSibling.style.display='block';">
            ` : ''}
          </div>
          <div class="member-details">
            <h3 class="member-name">${name}</h3>
            <span class="member-role">${role}</span>
          </div>
          <div class="member-socials">
            <a href="${linkedin}" target="_blank" rel="noopener noreferrer" class="social-btn" aria-label="LinkedIn" onclick="event.stopPropagation();">
              <svg viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Rebind click listeners to newly rendered cards
    bindModalListeners();

  } catch (err) {
    console.error('Failed to load team members from Supabase:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function bindModalListeners() {
  document.querySelectorAll('.team-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.social-btn')) return;
      if (typeof openFounderModal === 'function') {
        openFounderModal(card);
      }
    });
  });
}

// Auto-detect category from page URL or attribute
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.toLowerCase();
  let category = 'cohort-members';

  if (path.includes('advisory-board')) category = 'advisory-board';
  else if (path.includes('executive-management')) category = 'executive-management';
  else if (path.includes('cohort-founders')) category = 'cohort-founders';
  else if (path.includes('cohort-ambassadors')) category = 'cohort-ambassadors';
  else if (path.includes('cohort-members')) category = 'cohort-members';
  else if (path.includes('cross-borders')) category = 'cross-borders';

  const override = document.querySelector('[data-team-category]');
  if (override) {
    category = override.getAttribute('data-team-category');
  }

  loadTeamMembers(category);
});
