// Unified Pointer Drag-to-Scroll for Touch Kiosks and Linux Touchscreens
(function initTouchScroll() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let isDragging = false;
  let startY = 0;
  let startX = 0;
  let startScrollTop = 0;
  let startScrollLeft = 0;
  let activeScrollContainer: HTMLElement | null = null;
  let preventNextClick = false;
  let hasMoved = false;

  window.addEventListener('pointerdown', (e: PointerEvent) => {
    // Only drag on primary button (usually left-click or touch tap)
    if (e.button !== 0) return;

    let el = e.target as HTMLElement | null;
    while (el) {
      if (el === document.documentElement || el === document.body) {
        break;
      }

      const style = window.getComputedStyle(el);
      const hasScrollableHeight = el.scrollHeight > el.clientHeight;
      const hasScrollableWidth = el.scrollWidth > el.clientWidth;
      const isScrollable = (hasScrollableHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll')) ||
                           (hasScrollableWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll'));

      // Avoid stealing drag events from HTML range sliders
      const isRangeInput = el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'range';

      if (isScrollable && !isRangeInput) {
        activeScrollContainer = el;
        isDragging = true;
        startY = e.clientY;
        startX = e.clientX;
        startScrollTop = el.scrollTop;
        startScrollLeft = el.scrollLeft;
        hasMoved = false;
        preventNextClick = false;

        try {
          activeScrollContainer.setPointerCapture(e.pointerId);
        } catch (err) {}
        break;
      }
      el = el.parentElement;
    }
  }, { passive: true });

  window.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDragging || !activeScrollContainer) return;

    const dy = e.clientY - startY;
    const dx = e.clientX - startX;

    // 10px movement threshold to distinguish intentional scroll from tap
    if (!hasMoved && (Math.abs(dy) > 10 || Math.abs(dx) > 10)) {
      hasMoved = true;
      preventNextClick = true;

      // Temporarily disable selection and browser panning behavior
      activeScrollContainer.style.userSelect = 'none';
      activeScrollContainer.style.touchAction = 'none';
    }

    if (hasMoved) {
      if (activeScrollContainer.scrollHeight > activeScrollContainer.clientHeight) {
        activeScrollContainer.scrollTop = startScrollTop - dy;
      }
      if (activeScrollContainer.scrollWidth > activeScrollContainer.clientWidth) {
        activeScrollContainer.scrollLeft = startScrollLeft - dx;
      }
    }
  }, { passive: true });

  window.addEventListener('pointerup', (e: PointerEvent) => {
    if (!isDragging) return;

    isDragging = false;
    if (activeScrollContainer) {
      activeScrollContainer.style.removeProperty('user-select');
      activeScrollContainer.style.removeProperty('touch-action');
      try {
        activeScrollContainer.releasePointerCapture(e.pointerId);
      } catch (err) {}
      activeScrollContainer = null;
    }

    if (preventNextClick) {
      // Clear click blocker after a minor delay to ensure the click event is successfully intercepted
      setTimeout(() => {
        preventNextClick = false;
      }, 50);
    }
  }, { passive: true });

  // Intercept and prevent the click event in capturing phase if dragging has occurred
  window.addEventListener('click', (e: MouseEvent) => {
    if (preventNextClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);
})();
