/**
 * DriftWall Vanilla JS Component (Smooth & Optimized Version)
 * Ultra 60/120fps hardware-accelerated continuous infinite drift wall
 * with zero layout reflows, seamless column looping, and instant hover response.
 */

const YANC_DEFAULT_DRIFT_ITEMS = [
  { image: 'YANC - photos/y2.jpg', title: 'Community Gathering' },
  { image: 'YANC - photos/workshop.JPG', title: 'Interactive Workshop' },
  { image: 'YANC - photos/y3.jpg', title: 'Discussion Circle' },
  { image: 'YANC - photos/y4.jpg', title: 'Ideation Session' },
  { image: 'YANC - photos/y5.JPG', title: 'Masterclass in Action' },
  { image: 'YANC - photos/y6.JPG', title: 'Collaborative Strategy' },
  { image: 'YANC - photos/y7.JPG', title: 'Team Mentorship' },
  { image: 'YANC - photos/y12.jpg', title: 'Cohort Exchange' },
  { image: 'YANC - photos/y22.jpg', title: 'Founder Circle' },
  { image: 'YANC - photos/y23.jpg', title: 'Creative Brainstorming' },
  { image: 'YANC - photos/y24.jpg', title: 'Youth Innovators' },
  { image: 'YANC - photos/y24(1).JPG', title: 'Leadership Forum' },
  { image: 'YANC - photos/y26.jpg', title: 'Problem Solving Sprint' },
  { image: 'YANC - photos/y27.jpg', title: 'Networking Experience' },
  { image: 'YANC - photos/y27 (1).jpg', title: 'Peer Learning Cohort' },
  { image: 'YANC - photos/y30.jpg', title: 'Community Milestone' },
  { image: 'YANC - photos/y31.jpg', title: 'Startup Pitch Stage' },
  { image: 'YANC - photos/y33.jpg', title: 'Fireside Dialogue' },
  { image: 'YANC - photos/y34.jpg', title: 'Next-Gen Leaders' },
  { image: 'YANC - photos/workshop2.jpg', title: 'Builder Sprint' },
  { image: 'YANC - photos/WhatsApp Image 2026-06-13 at 6.58.16 PM.jpeg', title: 'YANC Celebrations' },
  { image: 'Mentors/Sravanth.jpg', title: 'Startup Mentorship' },
  { image: 'Mentors/Manoj.jpg', title: 'Tech Strategy' },
  { image: 'Mentors/Hari.jpg', title: 'Innovation Insights' },
  { image: 'Mentors/Praveen Dorna.jpg', title: 'Ecosystem Guidance' },
  { image: 'Mentors/Shoban Babu.jpg', title: 'Leadership Talk' },
  { image: 'Mentors/Dr. Lavanya NJP.jpg', title: 'Civic Leadership' },
  { image: 'Mentors/Daisuke Tanji.jpg', title: 'Cross-Border Advisory' }
];

// Instant Parallel Image Cache Warm-Up
if (typeof window !== 'undefined') {
  const warmedSet = new Set();
  YANC_DEFAULT_DRIFT_ITEMS.forEach(item => {
    if (!item.image || warmedSet.has(item.image)) return;
    warmedSet.add(item.image);
    const pre = new Image();
    pre.src = item.image;
    if (pre.decode) pre.decode().catch(() => {});
  });
}

class DriftWall {
  constructor(container, options = {}) {
    if (!container) return;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    const isHero = Boolean(this.container.closest('.hero-drift-wall-wrap')) || (window.innerWidth <= 1024 && Boolean(this.container.closest('.hero')));
    const isMobile = window.innerWidth <= 768;

    const defaultCols = isHero ? (isMobile ? 2 : 4) : (isMobile ? 3 : 5);
    const defaultTileW = isHero ? (isMobile ? 160 : 195) : 240;
    const defaultTileH = isHero ? (isMobile ? 115 : 142) : 160;
    const defaultGap = isHero ? (isMobile ? 10 : 14) : 20;

    this.options = {
      items: options.items || YANC_DEFAULT_DRIFT_ITEMS,
      columns: options.columns || defaultCols,
      tileWidth: options.tileWidth || defaultTileW,
      tileHeight: options.tileHeight || defaultTileH,
      gap: options.gap || defaultGap,
      radius: options.radius || (isHero ? 14 : 16),
      tilt: options.tilt !== undefined ? options.tilt : (isHero ? 2 : 0),
      turn: options.turn !== undefined ? options.turn : (isHero ? -4 : 0),
      roll: options.roll || 0,
      perspective: options.perspective || 1200,
      depth: options.depth !== undefined ? options.depth : 0,
      speed: options.speed || 15,
      direction: options.direction || 'up',
      variance: options.variance !== undefined ? options.variance : 0.35,
      parallax: options.parallax !== undefined ? options.parallax : 0,
      pauseOnHover: options.pauseOnHover || false,
      lift: options.lift || (isHero ? 36 : 48),
      fade: options.fade !== undefined ? options.fade : 0.15,
      dim: options.dim !== undefined ? options.dim : 0.95,
      grayscale: options.grayscale || false,
      overlayColor: options.overlayColor || 'rgba(0, 0, 0, 0.08)',
      ...options
    };

    this.plane = null;
    this.trackEls = [];
    this.rafId = null;
    this.lastTs = null;

    this.offsets = [];
    this.velocities = [];
    this.hoveredCol = -1;
    this.wallHovered = false;
    this.pointer = { x: 0, y: 0 };
    this.pointerDamped = { x: 0, y: 0 };
    this.containerHeight = this.container.clientHeight || 580;
    this.activeId = null;

    this.reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  columnFactor(index, variance) {
    const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
    return 1 + variance * pseudo;
  }

  init() {
    const { items, columns, tileWidth, tileHeight, gap, radius, perspective, lift, dim, grayscale, overlayColor, fade, speed, direction, variance } = this.options;

    // Apply CSS Variables to container
    this.container.classList.add('drift-wall');
    if (this.reduced) this.container.classList.add('drift-wall--reduced');
    this.container.setAttribute('role', 'group');
    this.container.setAttribute('aria-label', 'Drifting wall of community moments');

    const styleMap = {
      '--dw-tile-w': `${tileWidth}px`,
      '--dw-tile-h': `${tileHeight}px`,
      '--dw-gap': `${gap}px`,
      '--dw-radius': `${radius}px`,
      '--dw-perspective': `${perspective}px`,
      '--dw-lift': `${lift}px`,
      '--dw-dim': dim,
      '--dw-gray': grayscale ? 1 : 0,
      '--dw-overlay': overlayColor,
      '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`
    };

    for (const [key, value] of Object.entries(styleMap)) {
      this.container.style.setProperty(key, value);
    }

    // Distribute items evenly across columns
    const cols = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    this.columnItems = cols.map(col => (col.length ? col : items.slice(0, 1)));

    // Calculate metadata for seamless infinite copies (6 buffer copies guarantee infinite viewport fill)
    const unit = tileHeight + gap;
    this.columnMeta = this.columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = 6;
      return { copyHeight, copies };
    });

    // Base velocities with alternating column directions
    const dirSign = direction === 'up' ? 1 : -1;
    this.baseVelocities = this.columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * this.columnFactor(c, variance) * dirSign * altSign;
    });

    // Stagger initial column positions smoothly
    this.offsets = this.columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.33) % 1));
    this.velocities = this.columnItems.map((_, c) => this.baseVelocities[c]);

    // Build DOM
    this.container.innerHTML = '';
    this.plane = document.createElement('div');
    this.plane.className = 'drift-wall__plane';
    this.trackEls = [];

    this.columnItems.forEach((col, c) => {
      const meta = this.columnMeta[c];
      const colEl = document.createElement('div');
      colEl.className = 'drift-wall__col';

      const trackEl = document.createElement('div');
      trackEl.className = 'drift-wall__track';
      this.trackEls[c] = trackEl;

      for (let copyIndex = 0; copyIndex < meta.copies; copyIndex++) {
        col.forEach((item, itemIndex) => {
          const tileId = `${c}-${copyIndex}-${itemIndex}`;
          const tileEl = document.createElement(item.href ? 'a' : 'div');
          tileEl.className = 'drift-wall__tile';
          tileEl.dataset.tileId = tileId;
          tileEl.dataset.col = c;
          tileEl.tabIndex = 0;
          if (item.href) {
            tileEl.href = item.href;
            tileEl.target = '_blank';
            tileEl.rel = 'noreferrer noopener';
          }
          tileEl.setAttribute('aria-label', item.title || 'Community Moment');

          const inner = document.createElement('span');
          inner.className = 'drift-wall__inner';

          const img = document.createElement('img');
          img.src = item.image;
          img.alt = item.title || '';
          img.loading = 'eager';
          img.decoding = 'async';
          img.fetchPriority = 'high';
          img.draggable = false;
          img.onerror = () => {
            img.src = 'YANC - photos/y2.jpg';
          };

          const overlay = document.createElement('span');
          overlay.className = 'drift-wall__overlay';
          overlay.setAttribute('aria-hidden', 'true');

          inner.appendChild(img);
          inner.appendChild(overlay);
          tileEl.appendChild(inner);

          tileEl.addEventListener('click', () => {
            if (item.href) return;
            if (typeof window.openMentorModal === 'function') {
              window.openMentorModal({
                name: item.title || 'Life at YANC',
                role: 'Community & Experiential Moments',
                img: item.image
              });
            }
          });

          trackEl.appendChild(tileEl);
        });
      }

      colEl.appendChild(trackEl);
      this.plane.appendChild(colEl);
    });

    this.container.appendChild(this.plane);

    // Bind event listeners with high-performance native event delegation
    this.bindEvents();

    // Start RAF
    this.startAnimation();
  }

  applyPlaneTransform(px, py) {
    if (!this.plane) return;
    const { tilt, turn, roll, depth } = this.options;
    this.plane.style.transform =
      `translateX(-50%) ` +
      `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
      `translateZ(${-depth}px)`;
  }

  activateTile(id, colIndex) {
    if (this.activeId === id) return;
    this.activeId = id;
    this.hoveredCol = colIndex;
    const current = this.container.querySelector(`[data-tile-id="${id}"]`);
    const prevActive = this.container.querySelectorAll('.drift-wall__tile.is-active');
    prevActive.forEach(el => {
      if (el !== current) el.classList.remove('is-active');
    });
    if (current) current.classList.add('is-active');
  }

  releaseTile() {
    this.activeId = null;
    this.hoveredCol = -1;
    const activeTiles = this.container.querySelectorAll('.drift-wall__tile.is-active');
    activeTiles.forEach(el => el.classList.remove('is-active'));
  }

  bindEvents() {
    this.container.addEventListener('pointerenter', () => {
      this.wallHovered = true;
    }, { passive: true });

    this.container.addEventListener('pointerleave', () => {
      this.wallHovered = false;
      this.pointer = { x: 0, y: 0 };
      this.releaseTile();
    }, { passive: true });

    // High performance hover via native DOM bubbling - zero elementFromPoint layout reflows!
    this.plane.addEventListener('mouseover', e => {
      const tile = e.target.closest('.drift-wall__tile');
      if (!tile) return;
      const id = tile.dataset.tileId;
      const col = Number(tile.dataset.col);
      this.activateTile(id, col);
    }, { passive: true });

    this.plane.addEventListener('mouseout', e => {
      const tile = e.target.closest('.drift-wall__tile');
      if (!tile) return;
      const related = e.relatedTarget ? e.relatedTarget.closest('.drift-wall__tile') : null;
      if (!related || related !== tile) {
        this.releaseTile();
      }
    }, { passive: true });

    if (this.options.parallax > 0 && !this.reduced) {
      this.container.addEventListener('pointermove', e => {
        const rect = this.container.getBoundingClientRect();
        if (!rect) return;
        this.pointer.x = (e.clientX - rect.left) / rect.width - 0.5;
        this.pointer.y = (e.clientY - rect.top) / rect.height - 0.5;
      }, { passive: true });
    }

    window.addEventListener('resize', () => {
      this.containerHeight = this.container.clientHeight || 580;
    }, { passive: true });
  }

  startAnimation() {
    const animate = ts => {
      if (this.lastTs === null) this.lastTs = ts;
      const dt = Math.min(0.033, Math.max(0, (ts - this.lastTs) / 1000));
      this.lastTs = ts;

      if (this.options.parallax > 0 && !this.reduced) {
        const maxTilt = this.options.parallax * 8;
        const targetX = this.pointer.x * maxTilt;
        const targetY = -this.pointer.y * maxTilt;
        const damp = 1 - Math.exp(-dt / 0.12);
        this.pointerDamped.x += (targetX - this.pointerDamped.x) * damp;
        this.pointerDamped.y += (targetY - this.pointerDamped.y) * damp;
        this.applyPlaneTransform(this.pointerDamped.x, this.pointerDamped.y);
      }

      if (!this.reduced) {
        for (let c = 0; c < this.trackEls.length; c++) {
          const meta = this.columnMeta[c];
          if (!meta) continue;

          const paused = this.wallHovered && this.options.pauseOnHover;
          const factor = paused || this.hoveredCol === c ? 0 : 1;
          const target = this.baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.15 : 0.25));
          this.velocities[c] += (target - this.velocities[c]) * ease;

          let next = (this.offsets[c] ?? 0) + this.velocities[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          this.offsets[c] = next;

          const el = this.trackEls[c];
          if (el) {
            // Buffer shift by 2 full copyHeights to ensure track always covers full viewport height with zero gaps
            const yPos = -(next + 2 * meta.copyHeight);
            el.style.transform = `translate3d(0, ${yPos.toFixed(1)}px, 0)`;
          }
        }
      }

      this.rafId = requestAnimationFrame(animate);
    };

    this.rafId = requestAnimationFrame(animate);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastTs = null;
  }
}

// Auto-initialize when DOM is ready if #drift-wall element exists
if (typeof document !== 'undefined') {
  const init = () => {
    const el = document.getElementById('drift-wall');
    if (el && !el.__driftWallInstance) {
      el.__driftWallInstance = new DriftWall(el);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
