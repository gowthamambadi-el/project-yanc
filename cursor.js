/**
 * TargetCursor Vanilla JS Component (ported from React Bits)
 * Supports dynamic GSAP loading, smooth tracking, continuous idle rotation,
 * bounding-box target locking, subtle parallax, and tactile click effects.
 */
(function () {
  const options = {
    targetSelector: '.cursor-target, a, button, input, select, textarea, .team-card, .subnav-pill, .social-btn, .bento-card, .faq-item, .nav-login, .nav-apply-btn, .portal-card, .btn-portal, .help-btn, .what-card, .who-card, .mentor-card, .event-card, .pillar-card, .adv-card, .step-item, .founder-btn, [data-cursor-target]',
    spinDuration: 2,
    hideDefaultCursor: true,
    hoverDuration: 0.2,
    parallaxOn: true,
    cursorColor: '#ffffff',
    cursorColorOnTarget: undefined,
    borderWidth: 3,
    cornerSize: 12
  };

  const isTouchDevice = () => {
    if (typeof window === 'undefined') return false;
    const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouchScreen && isSmallScreen) || mobileRegex.test(userAgent.toLowerCase());
  };

  function loadGsap(callback) {
    if (window.gsap) {
      callback();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    script.onload = callback;
    document.head.appendChild(script);
  }

  function getContainingBlock(element) {
    let node = element?.parentElement;
    while (node && node !== document.documentElement) {
      const style = getComputedStyle(node);
      if (
        style.transform !== 'none' ||
        style.perspective !== 'none' ||
        style.filter !== 'none' ||
        style.willChange.includes('transform') ||
        style.willChange.includes('perspective') ||
        style.willChange.includes('filter') ||
        /paint|layout|strict|content/.test(style.contain)
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function getContainingBlockOffset(block) {
    if (!block) return { x: 0, y: 0 };
    const rect = block.getBoundingClientRect();
    return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
  }

  function initTargetCursor() {
    if (isTouchDevice()) return;

    if (options.hideDefaultCursor) {
      document.body.style.cursor = 'none';
      const style = document.createElement('style');
      style.innerHTML = `
        a, button, input, select, textarea, .team-card, .subnav-pill, .social-btn, .cursor-target {
          cursor: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Create cursor DOM elements
    const wrapper = document.createElement('div');
    wrapper.className = 'target-cursor-wrapper';
    wrapper.id = 'target-cursor';

    const dot = document.createElement('div');
    dot.className = 'target-cursor-dot';
    dot.style.backgroundColor = options.cursorColor;

    const cornerTL = document.createElement('div');
    cornerTL.className = 'target-cursor-corner corner-tl';
    cornerTL.style.borderColor = options.cursorColor;

    const cornerTR = document.createElement('div');
    cornerTR.className = 'target-cursor-corner corner-tr';
    cornerTR.style.borderColor = options.cursorColor;

    const cornerBR = document.createElement('div');
    cornerBR.className = 'target-cursor-corner corner-br';
    cornerBR.style.borderColor = options.cursorColor;

    const cornerBL = document.createElement('div');
    cornerBL.className = 'target-cursor-corner corner-bl';
    cornerBL.style.borderColor = options.cursorColor;

    wrapper.appendChild(dot);
    wrapper.appendChild(cornerTL);
    wrapper.appendChild(cornerTR);
    wrapper.appendChild(cornerBR);
    wrapper.appendChild(cornerBL);
    document.body.appendChild(wrapper);

    const cursor = wrapper;
    const corners = [cornerTL, cornerTR, cornerBR, cornerBL];
    let containingBlock = getContainingBlock(cursor);

    const getOffset = () => getContainingBlockOffset(containingBlock);

    let activeTarget = null;
    let currentLeaveHandler = null;
    let resumeTimeout = null;
    let spinTimeline = null;
    let targetCornerPositions = null;
    let isActive = false;
    const activeStrength = { current: 0 };

    const initialOffset = getOffset();
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2 - initialOffset.x,
      y: window.innerHeight / 2 - initialOffset.y
    });

    const createSpinTimeline = () => {
      if (spinTimeline) spinTimeline.kill();
      spinTimeline = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: '+=360', duration: options.spinDuration, ease: 'none' });
    };

    createSpinTimeline();

    const moveCursor = (x, y) => {
      const { x: offsetX, y: offsetY } = getOffset();
      gsap.to(cursor, {
        x: x - offsetX,
        y: y - offsetY,
        duration: 0.1,
        ease: 'power3.out'
      });
    };

    const tickerFn = () => {
      if (!targetCornerPositions || !cursor) return;

      const strength = activeStrength.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(cursor, 'x');
      const cursorY = gsap.getProperty(cursor, 'y');

      corners.forEach((corner, i) => {
        const currentX = gsap.getProperty(corner, 'x');
        const currentY = gsap.getProperty(corner, 'y');

        const targetX = targetCornerPositions[i].x - cursorX;
        const targetY = targetCornerPositions[i].y - cursorY;

        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;

        const duration = strength >= 0.99 ? (options.parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto'
        });
      });
    };

    const cleanupTarget = target => {
      if (currentLeaveHandler && target) {
        target.removeEventListener('mouseleave', currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    window.addEventListener('mousemove', e => moveCursor(e.clientX, e.clientY));

    window.addEventListener('scroll', () => {
      if (!activeTarget || !cursor) return;
      const { x: offsetX, y: offsetY } = getOffset();
      const mouseX = gsap.getProperty(cursor, 'x') + offsetX;
      const mouseY = gsap.getProperty(cursor, 'y') + offsetY;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget || elementUnderMouse.closest(options.targetSelector) === activeTarget);
      if (!isStillOverTarget && currentLeaveHandler) {
        currentLeaveHandler();
      }
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      gsap.to(dot, { scale: 0.7, duration: 0.3 });
      gsap.to(cursor, { scale: 0.9, duration: 0.2 });
    });

    window.addEventListener('mouseup', () => {
      gsap.to(dot, { scale: 1, duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    });

    window.addEventListener('mouseover', e => {
      const directTarget = e.target;
      let current = directTarget;
      let target = null;
      while (current && current !== document.body) {
        if (current.matches && current.matches(options.targetSelector)) {
          target = current;
          break;
        }
        current = current.parentElement;
      }

      if (!target || !cursor) return;
      if (activeTarget === target) return;
      if (activeTarget) cleanupTarget(activeTarget);

      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      corners.forEach(corner => gsap.killTweensOf(corner, 'x,y'));
      gsap.killTweensOf(cursor, 'rotation');
      spinTimeline?.pause();
      gsap.set(cursor, { rotation: 0 });

      if (options.cursorColorOnTarget) {
        gsap.to(corners, { borderColor: options.cursorColorOnTarget, duration: 0.15, ease: 'power2.out' });
        gsap.to(dot, { backgroundColor: options.cursorColorOnTarget, duration: 0.15, ease: 'power2.out' });
      }

      const rect = target.getBoundingClientRect();
      const { borderWidth, cornerSize } = options;
      const { x: offsetX, y: offsetY } = getOffset();
      const cursorX = gsap.getProperty(cursor, 'x');
      const cursorY = gsap.getProperty(cursor, 'y');

      targetCornerPositions = [
        { x: rect.left - borderWidth - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.top - borderWidth - offsetY },
        { x: rect.right + borderWidth - cornerSize - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY },
        { x: rect.left - borderWidth - offsetX, y: rect.bottom + borderWidth - cornerSize - offsetY }
      ];

      isActive = true;
      gsap.ticker.add(tickerFn);

      gsap.to(activeStrength, {
        current: 1,
        duration: options.hoverDuration,
        ease: 'power2.out'
      });

      corners.forEach((corner, i) => {
        gsap.to(corner, {
          x: targetCornerPositions[i].x - cursorX,
          y: targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: 'power2.out'
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFn);

        isActive = false;
        targetCornerPositions = null;
        gsap.set(activeStrength, { current: 0, overwrite: true });
        activeTarget = null;

        if (options.cursorColorOnTarget) {
          gsap.to(corners, { borderColor: options.cursorColor, duration: 0.15, ease: 'power2.out' });
          gsap.to(dot, { backgroundColor: options.cursorColor, duration: 0.15, ease: 'power2.out' });
        }

        corners.forEach(corner => gsap.killTweensOf(corner, 'x,y'));
        const { cornerSize } = options;
        const positions = [
          { x: -cornerSize * 1.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: -cornerSize * 1.5 },
          { x: cornerSize * 0.5, y: cornerSize * 0.5 },
          { x: -cornerSize * 1.5, y: cornerSize * 0.5 }
        ];
        const tl = gsap.timeline();
        corners.forEach((corner, index) => {
          tl.to(
            corner,
            {
              x: positions[index].x,
              y: positions[index].y,
              duration: 0.3,
              ease: 'power3.out'
            },
            0
          );
        });

        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursor && spinTimeline) {
            const currentRotation = gsap.getProperty(cursor, 'rotation');
            const normalizedRotation = currentRotation % 360;
            spinTimeline.kill();
            spinTimeline = gsap
              .timeline({ repeat: -1 })
              .to(cursor, { rotation: '+=360', duration: options.spinDuration, ease: 'none' });
            gsap.to(cursor, {
              rotation: normalizedRotation + 360,
              duration: options.spinDuration * (1 - normalizedRotation / 360),
              ease: 'none',
              onComplete: () => {
                spinTimeline?.restart();
              }
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      };

      currentLeaveHandler = leaveHandler;
      target.addEventListener('mouseleave', leaveHandler);
    }, { passive: true });

    window.addEventListener('resize', () => {
      containingBlock = getContainingBlock(cursor);
    });
  }

  // Self initialization
  loadGsap(() => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initTargetCursor);
    } else {
      initTargetCursor();
    }
  });
})();
