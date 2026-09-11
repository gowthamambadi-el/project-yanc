/**
 * InfiniteSpiral Vanilla JS Component
 * Seamless 3D cylindrical helix with buttery smooth transitions,
 * zero card overlapping, elegant cosine fades, and interactive drag/scroll.
 */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const modulo = (value, divisor) => ((value % divisor) + divisor) % divisor;

const DEFAULT_CORE_VALUES = [
  { title: 'Respect', desc: 'Treat everyone with dignity and value diverse perspectives.' },
  { title: 'Gratitude', desc: 'Fostering a culture of appreciation and support.' },
  { title: 'Resilience', desc: 'Bouncing back stronger every time.' },
  { title: 'Doing the Right Thing', desc: 'Act with integrity and make ethical decisions.' },
  { title: 'Think Big, Start Small', desc: 'Dream ambitiously while taking actionable steps.' },
  { title: 'Purposeful Learning', desc: 'Every lesson learned with purpose leads to meaningful change.' },
  { title: 'Fostering Connections', desc: 'Connections spark growth and fuel possibilities.' }
];

class InfiniteSpiral {
  constructor(container, options = {}) {
    if (!container) return;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.options = {
      items: options.items || DEFAULT_CORE_VALUES,
      speed: options.speed !== undefined ? options.speed : 0.32,
      direction: options.direction || 'up',
      animationMode: options.animationMode || 'all',
      radiusX: options.radiusX || 170,
      radiusZ: options.radiusZ || 130,
      cardWidth: options.cardWidth || 260,
      cardHeight: options.cardHeight || 100,
      verticalSpacing: options.verticalSpacing || 116,
      perspective: options.perspective || 1100,
      cardsPerTurn: options.cardsPerTurn || 4.6,
      rotation: options.rotation || 0,
      centerScale: options.centerScale || 1.10,
      pauseOnHover: options.pauseOnHover !== undefined ? options.pauseOnHover : true,
      ...options
    };

    this.cardEls = [];
    this.progress = 0;
    this.targetProgress = 0;
    this.autoSpeed = 0;
    this.hovered = false;
    this.visible = true;
    this.dragging = false;
    this.lastPointerY = 0;
    this.dragMoved = false;
    this.lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;

    this.rafId = null;
    this.previousTime = performance.now();
    this.bounds = { width: 500, height: 600 };

    this.reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    const { cardWidth, cardHeight, perspective } = this.options;

    this.container.classList.add('infinite-spiral');
    this.container.style.perspective = `${perspective}px`;
    this.container.style.setProperty('--infinite-spiral-card-width', `${cardWidth}px`);
    this.container.style.setProperty('--infinite-spiral-card-height', `${cardHeight}px`);

    this.container.innerHTML = '';
    this.stage = document.createElement('div');
    this.stage.className = 'infinite-spiral__stage';
    this.stage.setAttribute('role', 'list');
    this.stage.setAttribute('aria-label', 'Core Values 3D Spiral');

    const items = this.options.items;
    this.cardEls = [];

    items.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'infinite-spiral__item';
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', item.title);

      const title = document.createElement('h4');
      title.className = 'spiral-card-title';
      title.innerHTML = item.title.includes(' ') 
        ? item.title.replace(/(\w+)$/, '<em>$1</em>')
        : `<em>${item.title}</em>`;

      const desc = document.createElement('p');
      desc.className = 'spiral-card-desc';
      desc.textContent = item.desc || '';

      card.appendChild(title);
      card.appendChild(desc);

      // Smooth focus on click
      card.addEventListener('click', () => {
        if (this.dragMoved) return;
        const count = items.length;
        let diff = modulo(index - this.targetProgress + count / 2, count) - count / 2;
        this.targetProgress += diff;
      });

      this.stage.appendChild(card);
      this.cardEls[index] = card;
    });

    this.container.appendChild(this.stage);

    this.updateBounds();
    this.bindEvents();
    this.startAnimation();
  }

  updateBounds() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.bounds = {
      width: rect.width || 500,
      height: rect.height || 600
    };
  }

  bindEvents() {
    const dragEnabled = this.options.animationMode === 'drag' || this.options.animationMode === 'all';
    const scrollEnabled = this.options.animationMode === 'scroll' || this.options.animationMode === 'all';

    this.container.addEventListener('mouseenter', () => {
      this.hovered = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.hovered = false;
    });

    if (dragEnabled) {
      this.container.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        this.dragging = true;
        this.dragMoved = false;
        this.lastPointerY = e.clientY;
        this.targetProgress = this.progress;
        try {
          this.container.setPointerCapture(e.pointerId);
        } catch (err) {}
      });

      this.container.addEventListener('pointermove', e => {
        if (!this.dragging) return;
        const delta = e.clientY - this.lastPointerY;
        this.lastPointerY = e.clientY;
        if (Math.abs(delta) > 1) this.dragMoved = true;
        this.targetProgress -= delta / Math.max(this.options.verticalSpacing * 1.3, 1);
      });

      const stopDrag = e => {
        if (!this.dragging) return;
        this.dragging = false;
        try {
          if (this.container.hasPointerCapture(e.pointerId)) {
            this.container.releasePointerCapture(e.pointerId);
          }
        } catch (err) {}
      };

      this.container.addEventListener('pointerup', stopDrag);
      this.container.addEventListener('pointercancel', stopDrag);
    }

    if (scrollEnabled) {
      let scrollTicking = false;
      window.addEventListener('scroll', () => {
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            const nextScrollY = window.scrollY;
            const scrollDelta = nextScrollY - this.lastScrollY;
            this.lastScrollY = nextScrollY;
            if (this.visible && scrollDelta !== 0) {
              this.targetProgress += clamp(
                scrollDelta / (this.options.verticalSpacing * 4.5),
                -1.0,
                1.0
              );
            }
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObs = new ResizeObserver(() => this.updateBounds());
      this.resizeObs.observe(this.container);
    } else {
      window.addEventListener('resize', () => this.updateBounds(), { passive: true });
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObs = new IntersectionObserver(([entry]) => {
        const wasVisible = this.visible;
        this.visible = entry.isIntersecting;
        if (this.visible && !wasVisible && !this.rafId) {
          this.previousTime = performance.now();
          this.startAnimation();
        } else if (!this.visible && this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }, { threshold: 0.02 });
      this.intersectionObs.observe(this.container);
    }
  }

  startAnimation() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (!this.visible) return;

    const {
      speed,
      direction,
      animationMode,
      radiusX,
      radiusZ,
      verticalSpacing,
      cardsPerTurn,
      rotation,
      centerScale,
      pauseOnHover
    } = this.options;

    const render = time => {
      if (!this.visible) {
        this.rafId = null;
        return;
      }
      const delta = Math.min((time - this.previousTime) / 1000, 0.05);
      this.previousTime = time;

      const autoEnabled = animationMode === 'auto' || animationMode === 'all';
      const motionPaused = this.dragging || (pauseOnHover && this.hovered);
      const directionMultiplier = direction === 'down' ? -1 : 1;
      const desiredAutoSpeed =
        autoEnabled && this.visible && !this.reduced && !motionPaused
          ? speed * directionMultiplier
          : 0;

      const speedBlend = 1 - Math.exp(-delta * 5);
      this.autoSpeed += (desiredAutoSpeed - this.autoSpeed) * speedBlend;
      this.targetProgress += this.autoSpeed * delta;

      // Ultra-smooth easing curve
      const followBlend = 1 - Math.exp(-delta * (this.dragging ? 18 : 8));
      this.progress += (this.targetProgress - this.progress) * followBlend;

      const count = this.options.items.length;
      const half = count / 2;
      const width = Math.max(this.bounds.width, 360);
      
      const widthScale = Math.min(1, width / 520);
      const currentRadiusX = radiusX * widthScale;
      const currentRadiusZ = radiusZ * widthScale;
      const currentSpacing = verticalSpacing * Math.min(1, width / 480);
      const turnSize = Math.max(cardsPerTurn, 1);

      this.cardEls.forEach((card, index) => {
        if (!card) return;
        let offset = index - this.progress;
        offset = modulo(offset + half, count) - half;

        const dist = Math.abs(offset);

        // Smooth cosine fade: 1.0 at center, 0 at dist >= 2.2
        // Since wrap is at 3.5, wrapping is 100% invisible!
        let opacity = 0;
        if (dist < 2.2) {
          opacity = Math.cos((dist / 2.2) * (Math.PI / 2));
          opacity = Math.pow(opacity, 1.3);
        }

        // 3D coordinates along the helix
        const angle = offset * (360 / turnSize) + rotation;
        const rad = (angle * Math.PI) / 180;

        const x = Math.sin(rad) * currentRadiusX;
        const z = Math.cos(rad) * currentRadiusZ;
        const y = offset * currentSpacing;

        // Depth & scaling
        const normZ = (z + currentRadiusZ) / (2 * currentRadiusZ); // 0 (back) to 1 (front)
        const scale = 0.84 + normZ * (centerScale - 0.84);

        // Subtle 3D angular rotation
        const rotY = Math.sin(rad) * 16;
        const rotX = -Math.cos(rad) * 3;

        card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(1)}deg) rotateX(${rotX.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(Math.round(normZ * 50) + 10);
        card.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';

        if (dist < 0.45) {
          card.classList.add('is-focused');
        } else {
          card.classList.remove('is-focused');
        }
      });

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.resizeObs) this.resizeObs.disconnect();
    if (this.intersectionObs) this.intersectionObs.disconnect();
  }
}

// Auto initialize on DOM ready
if (typeof document !== 'undefined') {
  const init = () => {
    const el = document.getElementById('core-values-spiral');
    if (el && !el.__spiralInstance) {
      el.__spiralInstance = new InfiniteSpiral(el);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
