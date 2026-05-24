import { Directive, ElementRef, HostListener, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[dragScroll]',
  standalone: true,
})
export class DragScrollDirective implements OnDestroy {
  private isDragging = false;
  private startY = 0;
  private startX = 0;
  private startScrollTop = 0;
  private startScrollLeft = 0;
  private preventNextClick = false;
  private hasMoved = false;
  private isBrowser = false;
  private scrollTarget: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      // Intercept and destroy the click event during the capturing phase if dragging occurred
      window.addEventListener('click', this.onWindowClick, true);
    }
  }

  private onWindowClick = (e: MouseEvent) => {
    if (this.preventNextClick) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  /**
   * Traverse up the DOM tree from startEl to find the nearest element that is actually scrollable.
   * If none are found, fallback to the document viewport scroll container.
   */
  private getScrollableElement(startEl: HTMLElement): HTMLElement {
    let el: HTMLElement | null = startEl;
    while (el) {
      const style = window.getComputedStyle(el);
      const hasScrollableHeight = el.scrollHeight > el.clientHeight;
      const hasScrollableWidth = el.scrollWidth > el.clientWidth;

      const isScrollable = (hasScrollableHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll')) ||
                           (hasScrollableWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll'));

      if (isScrollable) {
        return el;
      }

      if (el === document.body || el === document.documentElement) {
        break;
      }
      el = el.parentElement;
    }
    return document.documentElement || document.body;
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent): void {
    if (!this.isBrowser || e.button !== 0) return;

    const target = e.target as HTMLElement;
    
    // Avoid stealing drag events from HTML range sliders or other native draggable controls
    const isRangeInput = target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'range';
    if (isRangeInput) return;

    const nativeEl = this.el.nativeElement;
    this.scrollTarget = this.getScrollableElement(nativeEl);

    this.isDragging = true;
    this.startY = e.clientY;
    this.startX = e.clientX;
    this.startScrollTop = this.scrollTarget.scrollTop;
    this.startScrollLeft = this.scrollTarget.scrollLeft;
    this.hasMoved = false;
    this.preventNextClick = false;

    try {
      nativeEl.setPointerCapture(e.pointerId);
    } catch (err) {}
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.scrollTarget) return;

    const dy = e.clientY - this.startY;
    const dx = e.clientX - this.startX;
    const nativeEl = this.el.nativeElement;

    // 10px threshold to distinguish dragging from simple tapping
    if (!this.hasMoved && (Math.abs(dy) > 10 || Math.abs(dx) > 10)) {
      this.hasMoved = true;
      this.preventNextClick = true;
      nativeEl.style.userSelect = 'none';
      nativeEl.style.touchAction = 'none';
    }

    if (this.hasMoved) {
      if (this.scrollTarget.scrollHeight > this.scrollTarget.clientHeight) {
        this.scrollTarget.scrollTop = this.startScrollTop - dy;
      }
      if (this.scrollTarget.scrollWidth > this.scrollTarget.clientWidth) {
        this.scrollTarget.scrollLeft = this.startScrollLeft - dx;
      }
    }
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    const nativeEl = this.el.nativeElement;

    nativeEl.style.removeProperty('user-select');
    nativeEl.style.removeProperty('touch-action');

    try {
      nativeEl.releasePointerCapture(e.pointerId);
    } catch (err) {}

    this.scrollTarget = null;

    if (this.preventNextClick) {
      setTimeout(() => {
        this.preventNextClick = false;
      }, 50);
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('click', this.onWindowClick, true);
    }
  }
}
