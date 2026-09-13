/**
 * DomeGallery Vanilla JS Engine (Adapted from React Bits specification)
 * 3D Spherical Dome Gallery with drag gesture handling, inertia damping,
 * responsive radius computation, and smooth tile enlargement.
 */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const normalizeAngle = d => ((d % 360) + 360) % 360;
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el, name, fallback) => {
  const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

function computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

function buildItems(pool, seg) {
  const startX = -(seg + (seg % 2 === 1 ? 2 : 0));
  const xCols = Array.from({ length: seg }, (_, i) => startX + i * 2);
  const evenYs = [-6, -4, -2, 0, 2, 4, 6];
  const oddYs = [-5, -3, -1, 1, 3, 5, 7];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }

  const normalizedImages = pool.map(image => {
    if (typeof image === 'string') {
      return { src: image, alt: '' };
    }
    return { src: image.src || '', alt: image.alt || '' };
  });

  const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

  for (let i = 1; i < usedImages.length; i++) {
    if (usedImages[i].src === usedImages[i - 1].src) {
      for (let j = i + 1; j < usedImages.length; j++) {
        if (usedImages[j].src !== usedImages[i].src) {
          const tmp = usedImages[i];
          usedImages[i] = usedImages[j];
          usedImages[j] = tmp;
          break;
        }
      }
    }
  }

  return coords.map((c, i) => ({
    ...c,
    src: usedImages[i].src,
    alt: usedImages[i].alt
  }));
}

class DomeGallery {
  constructor(container, options = {}) {
    if (!container) return;
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) return;

    this.options = {
      images: options.images || [],
      fit: options.fit !== undefined ? options.fit : 0.85,
      fitBasis: options.fitBasis || 'auto',
      minRadius: options.minRadius || 650,
      maxRadius: options.maxRadius || Infinity,
      padFactor: options.padFactor || 0.25,
      overlayBlurColor: options.overlayBlurColor || '#0f0d14',
      maxVerticalRotationDeg: options.maxVerticalRotationDeg || 12,
      dragSensitivity: options.dragSensitivity || 16,
      enlargeTransitionMs: options.enlargeTransitionMs || 350,
      segments: options.segments || 35,
      dragDampening: options.dragDampening !== undefined ? options.dragDampening : 0.65,
      openedImageWidth: options.openedImageWidth || '480px',
      openedImageHeight: options.openedImageHeight || '480px',
      imageBorderRadius: options.imageBorderRadius || '20px',
      openedImageBorderRadius: options.openedImageBorderRadius || '28px',
      grayscale: options.grayscale || false,
      autoRotate: options.autoRotate !== undefined ? options.autoRotate : true,
      autoRotateSpeed: options.autoRotateSpeed || 0.08,
      ...options
    };

    this.rotation = { x: 0, y: 0 };
    this.startRot = { x: 0, y: 0 };
    this.startPos = null;
    this.dragging = false;
    this.moved = false;
    this.inertiaRAF = null;
    this.autoRotateRAF = null;
    this.opening = false;
    this.openStartedAt = 0;
    this.lastDragEndAt = 0;
    this.lastMoveTime = 0;
    this.velocity = { x: 0, y: 0 };
    this.lastPointerPos = { x: 0, y: 0 };

    this.focusedEl = null;
    this.originalTilePosition = null;
    this.scrollLocked = false;

    this.init();
  }

  init() {
    const { segments, overlayBlurColor, imageBorderRadius, openedImageBorderRadius, grayscale, images } = this.options;

    this.container.innerHTML = `
      <div class="sphere-root" style="--segments-x: ${segments}; --segments-y: ${segments}; --overlay-blur-color: ${overlayBlurColor}; --tile-radius: ${imageBorderRadius}; --enlarge-radius: ${openedImageBorderRadius}; --image-filter: ${grayscale ? 'grayscale(1)' : 'none'};">
        <main class="sphere-main">
          <div class="stage">
            <div class="sphere"></div>
          </div>
          <div class="overlay"></div>
          <div class="overlay overlay--blur"></div>
          <div class="edge-fade edge-fade--top"></div>
          <div class="edge-fade edge-fade--bottom"></div>
          <div class="viewer">
            <div class="scrim"></div>
            <div class="frame"></div>
          </div>
        </main>
      </div>
    `;

    this.root = this.container.querySelector('.sphere-root');
    this.main = this.container.querySelector('.sphere-main');
    this.sphere = this.container.querySelector('.sphere');
    this.viewer = this.container.querySelector('.viewer');
    this.scrim = this.container.querySelector('.scrim');
    this.frame = this.container.querySelector('.frame');

    // Populate items
    const items = buildItems(images, segments);
    const fragment = document.createDocumentFragment();

    items.forEach((it, i) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'item';
      itemEl.dataset.src = it.src;
      itemEl.dataset.offsetX = it.x;
      itemEl.dataset.offsetY = it.y;
      itemEl.dataset.sizeX = it.sizeX;
      itemEl.dataset.sizeY = it.sizeY;
      itemEl.style.setProperty('--offset-x', it.x);
      itemEl.style.setProperty('--offset-y', it.y);
      itemEl.style.setProperty('--item-size-x', it.sizeX);
      itemEl.style.setProperty('--item-size-y', it.sizeY);

      const imageBox = document.createElement('div');
      imageBox.className = 'item__image';
      imageBox.setAttribute('role', 'button');
      imageBox.setAttribute('tabindex', '0');
      imageBox.setAttribute('aria-label', it.alt || 'Open image');

      const img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || '';
      img.draggable = false;
      img.loading = 'lazy';

      imageBox.appendChild(img);
      itemEl.appendChild(imageBox);
      fragment.appendChild(itemEl);
    });

    this.sphere.appendChild(fragment);

    this.setupResizeObserver();
    this.bindPointerGestures();
    this.bindLightboxEvents();
    this.startAutoRotate();
  }

  applyTransform(xDeg, yDeg) {
    if (this.sphere) {
      this.sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }

  setupResizeObserver() {
    const { fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, imageBorderRadius, openedImageBorderRadius, grayscale } = this.options;

    const onResize = () => {
      const cr = this.root.getBoundingClientRect();
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const aspect = w / h;

      let basis;
      switch (fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }

      let radius = basis * fit;
      const heightGuard = h * 2.5;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius);
      const lockedRadius = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      this.root.style.setProperty('--radius', `${lockedRadius}px`);
      this.root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      this.root.style.setProperty('--overlay-blur-color', overlayBlurColor);
      this.root.style.setProperty('--tile-radius', imageBorderRadius);
      this.root.style.setProperty('--enlarge-radius', openedImageBorderRadius);
      this.root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');

      this.applyTransform(this.rotation.x, this.rotation.y);
    };

    this.resizeObserver = new ResizeObserver(onResize);
    this.resizeObserver.observe(this.root);
    onResize();
  }

  stopInertia() {
    if (this.inertiaRAF) {
      cancelAnimationFrame(this.inertiaRAF);
      this.inertiaRAF = null;
    }
  }

  startInertia(vx, vy) {
    const { dragDampening, maxVerticalRotationDeg } = this.options;
    const MAX_V = 1.6;
    let vX = clamp(vx, -MAX_V, MAX_V) * 85;
    let vY = clamp(vy, -MAX_V, MAX_V) * 85;
    let frames = 0;
    const d = clamp(dragDampening ?? 0.65, 0, 1);
    const frictionMul = 0.93 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        this.inertiaRAF = null;
        this.startAutoRotate();
        return;
      }
      if (++frames > maxFrames) {
        this.inertiaRAF = null;
        this.startAutoRotate();
        return;
      }
      const nextX = clamp(this.rotation.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      const nextY = wrapAngleSigned(this.rotation.y + vX / 200);
      this.rotation = { x: nextX, y: nextY };
      this.applyTransform(nextX, nextY);
      this.inertiaRAF = requestAnimationFrame(step);
    };

    this.stopInertia();
    this.inertiaRAF = requestAnimationFrame(step);
  }

  startAutoRotate() {
    if (!this.options.autoRotate) return;
    if (this.autoRotateRAF || this.dragging || this.focusedEl) return;

    const step = () => {
      if (this.dragging || this.focusedEl || this.inertiaRAF) {
        this.autoRotateRAF = null;
        return;
      }
      this.rotation.y = wrapAngleSigned(this.rotation.y + this.options.autoRotateSpeed);
      this.applyTransform(this.rotation.x, this.rotation.y);
      this.autoRotateRAF = requestAnimationFrame(step);
    };

    this.autoRotateRAF = requestAnimationFrame(step);
  }

  stopAutoRotate() {
    if (this.autoRotateRAF) {
      cancelAnimationFrame(this.autoRotateRAF);
      this.autoRotateRAF = null;
    }
  }

  bindPointerGestures() {
    const { dragSensitivity, maxVerticalRotationDeg } = this.options;

    const onPointerDown = e => {
      if (this.focusedEl) return;
      this.stopInertia();
      this.stopAutoRotate();
      this.dragging = true;
      this.moved = false;
      this.startRot = { ...this.rotation };
      this.startPos = { x: e.clientX, y: e.clientY };
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      this.lastMoveTime = performance.now();
      this.velocity = { x: 0, y: 0 };
    };

    const onPointerMove = e => {
      if (!this.dragging || !this.startPos || this.focusedEl) return;
      const now = performance.now();
      const dt = Math.max(1, now - this.lastMoveTime);
      const dxTotal = e.clientX - this.startPos.x;
      const dyTotal = e.clientY - this.startPos.y;

      if (!this.moved) {
        const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
        if (dist2 > 16) this.moved = true;
      }

      const dxStep = e.clientX - this.lastPointerPos.x;
      const dyStep = e.clientY - this.lastPointerPos.y;
      this.velocity = {
        x: (dxStep / dt) * 16,
        y: (dyStep / dt) * 16
      };
      this.lastPointerPos = { x: e.clientX, y: e.clientY };
      this.lastMoveTime = now;

      const nextX = clamp(
        this.startRot.x - dyTotal / dragSensitivity,
        -maxVerticalRotationDeg,
        maxVerticalRotationDeg
      );
      const nextY = wrapAngleSigned(this.startRot.y + dxTotal / dragSensitivity);

      this.rotation = { x: nextX, y: nextY };
      this.applyTransform(nextX, nextY);
    };

    const onPointerUp = () => {
      if (!this.dragging) return;
      this.dragging = false;

      const vx = clamp(this.velocity.x * 0.4, -1.5, 1.5);
      const vy = clamp(this.velocity.y * 0.4, -1.5, 1.5);

      if (Math.abs(vx) > 0.05 || Math.abs(vy) > 0.05) {
        this.startInertia(vx, vy);
      } else {
        this.startAutoRotate();
      }

      if (this.moved) this.lastDragEndAt = performance.now();
      this.moved = false;
    };

    this.main.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
  }

  bindLightboxEvents() {
    const { segments, enlargeTransitionMs, openedImageWidth, openedImageHeight } = this.options;

    const openItem = el => {
      if (this.opening || this.focusedEl) return;
      this.opening = true;
      this.openStartedAt = performance.now();
      this.stopAutoRotate();
      this.stopInertia();

      document.body.classList.add('dg-scroll-lock');

      const parent = el.parentElement;
      this.focusedEl = el;
      el.setAttribute('data-focused', 'true');

      const offsetX = getDataNumber(parent, 'offsetX', 0);
      const offsetY = getDataNumber(parent, 'offsetY', 0);
      const sizeX = getDataNumber(parent, 'sizeX', 2);
      const sizeY = getDataNumber(parent, 'sizeY', 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);

      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(this.rotation.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - this.rotation.x;

      parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
      parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

      const refDiv = document.createElement('div');
      refDiv.className = 'item__image item__image--reference';
      refDiv.style.opacity = '0';
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);

      void refDiv.offsetHeight;

      const tileR = refDiv.getBoundingClientRect();
      const mainR = this.main.getBoundingClientRect();
      const frameR = this.frame.getBoundingClientRect();

      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        this.opening = false;
        this.focusedEl = null;
        parent.removeChild(refDiv);
        document.body.classList.remove('dg-scroll-lock');
        return;
      }

      this.originalTilePosition = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height };
      el.style.visibility = 'hidden';
      el.style.zIndex = 0;

      const overlay = document.createElement('div');
      overlay.className = 'enlarge';
      overlay.style.position = 'absolute';
      overlay.style.left = frameR.left - mainR.left + 'px';
      overlay.style.top = frameR.top - mainR.top + 'px';
      overlay.style.width = frameR.width + 'px';
      overlay.style.height = frameR.height + 'px';
      overlay.style.opacity = '0';
      overlay.style.zIndex = '30';
      overlay.style.willChange = 'transform, opacity';
      overlay.style.transformOrigin = 'top left';
      overlay.style.transition = `transform ${enlargeTransitionMs}ms ease, opacity ${enlargeTransitionMs}ms ease`;

      const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
      const img = document.createElement('img');
      img.src = rawSrc;
      overlay.appendChild(img);
      this.viewer.appendChild(overlay);

      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top - frameR.top;
      const sx0 = tileR.width / frameR.width;
      const sy0 = tileR.height / frameR.height;

      const validSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const validSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;

      overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${validSx0}, ${validSy0})`;

      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = '1';
        overlay.style.transform = 'translate(0px, 0px) scale(1, 1)';
        this.root.setAttribute('data-enlarging', 'true');
      }, 16);

      const wantsResize = openedImageWidth || openedImageHeight;
      if (wantsResize) {
        const onFirstEnd = ev => {
          if (ev.propertyName !== 'transform') return;
          overlay.removeEventListener('transitionend', onFirstEnd);
          const prevTransition = overlay.style.transition;
          overlay.style.transition = 'none';
          const tempWidth = openedImageWidth || `${frameR.width}px`;
          const tempHeight = openedImageHeight || `${frameR.height}px`;
          overlay.style.width = tempWidth;
          overlay.style.height = tempHeight;
          const newRect = overlay.getBoundingClientRect();
          overlay.style.width = frameR.width + 'px';
          overlay.style.height = frameR.height + 'px';
          void overlay.offsetWidth;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease, top ${enlargeTransitionMs}ms ease, width ${enlargeTransitionMs}ms ease, height ${enlargeTransitionMs}ms ease`;
          const centeredLeft = frameR.left - mainR.left + (frameR.width - newRect.width) / 2;
          const centeredTop = frameR.top - mainR.top + (frameR.height - newRect.height) / 2;
          requestAnimationFrame(() => {
            overlay.style.left = `${centeredLeft}px`;
            overlay.style.top = `${centeredTop}px`;
            overlay.style.width = tempWidth;
            overlay.style.height = tempHeight;
          });
          const cleanupSecond = () => {
            overlay.removeEventListener('transitionend', cleanupSecond);
            overlay.style.transition = prevTransition;
          };
          overlay.addEventListener('transitionend', cleanupSecond, { once: true });
        };
        overlay.addEventListener('transitionend', onFirstEnd);
      }
    };

    const closeItem = () => {
      if (performance.now() - this.openStartedAt < 250) return;
      const el = this.focusedEl;
      if (!el) return;
      const parent = el.parentElement;
      const overlay = this.viewer?.querySelector('.enlarge');
      if (!overlay) return;
      const refDiv = parent.querySelector('.item__image--reference');
      const originalPos = this.originalTilePosition;

      if (!originalPos) {
        overlay.remove();
        if (refDiv) refDiv.remove();
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        el.style.visibility = '';
        el.style.zIndex = 0;
        this.focusedEl = null;
        this.root.removeAttribute('data-enlarging');
        this.opening = false;
        document.body.classList.remove('dg-scroll-lock');
        this.startAutoRotate();
        return;
      }

      const currentRect = overlay.getBoundingClientRect();
      const rootRect = this.root.getBoundingClientRect();
      const originalPosRelativeToRoot = {
        left: originalPos.left - rootRect.left,
        top: originalPos.top - rootRect.top,
        width: originalPos.width,
        height: originalPos.height
      };
      const overlayRelativeToRoot = {
        left: currentRect.left - rootRect.left,
        top: currentRect.top - rootRect.top,
        width: currentRect.width,
        height: currentRect.height
      };

      const animatingOverlay = document.createElement('div');
      animatingOverlay.className = 'enlarge-closing';
      animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 28px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
      const originalImg = overlay.querySelector('img');
      if (originalImg) {
        const img = originalImg.cloneNode();
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        animatingOverlay.appendChild(img);
      }
      overlay.remove();
      this.root.appendChild(animatingOverlay);
      void animatingOverlay.getBoundingClientRect();

      requestAnimationFrame(() => {
        animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
        animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
        animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
        animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
        animatingOverlay.style.opacity = '0';
      });

      const cleanup = () => {
        animatingOverlay.remove();
        this.originalTilePosition = null;
        if (refDiv) refDiv.remove();
        parent.style.transition = 'none';
        el.style.transition = 'none';
        parent.style.setProperty('--rot-y-delta', '0deg');
        parent.style.setProperty('--rot-x-delta', '0deg');
        requestAnimationFrame(() => {
          el.style.visibility = '';
          el.style.opacity = '0';
          el.style.zIndex = 0;
          this.focusedEl = null;
          this.root.removeAttribute('data-enlarging');
          requestAnimationFrame(() => {
            parent.style.transition = '';
            el.style.transition = 'opacity 300ms ease-out';
            requestAnimationFrame(() => {
              el.style.opacity = '1';
              setTimeout(() => {
                el.style.transition = '';
                el.style.opacity = '';
                this.opening = false;
                document.body.classList.remove('dg-scroll-lock');
                this.startAutoRotate();
              }, 300);
            });
          });
        });
      };
      animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
    };

    this.sphere.addEventListener('click', e => {
      const imgBox = e.target.closest('.item__image');
      if (!imgBox) return;
      if (this.dragging || this.moved) return;
      if (performance.now() - this.lastDragEndAt < 80) return;
      openItem(imgBox);
    });

    this.scrim.addEventListener('click', closeItem);
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeItem();
    });
  }

  setGrayscale(val) {
    this.options.grayscale = val;
    this.root.style.setProperty('--image-filter', val ? 'grayscale(1)' : 'none');
  }

  toggleAutoRotate() {
    this.options.autoRotate = !this.options.autoRotate;
    if (this.options.autoRotate) {
      this.startAutoRotate();
    } else {
      this.stopAutoRotate();
    }
    return this.options.autoRotate;
  }

  resetView() {
    this.rotation = { x: 0, y: 0 };
    this.applyTransform(0, 0);
  }
}

window.DomeGallery = DomeGallery;
