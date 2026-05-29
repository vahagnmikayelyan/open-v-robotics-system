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

  @HostListener('pointerdown', ['$event'])
  onPointerDown(e: PointerEvent): void {
    if (!this.isBrowser || e.button !== 0) return;

    const target = e.target as HTMLElement;
    
    // Avoid stealing drag/scroll events from interactive elements like inputs, selects, buttons, links, etc.
    const isInteractive = target.closest('select, input, textarea, button, a');
    if (isInteractive) return;

    const nativeEl = this.el.nativeElement;

    this.isDragging = true;
    this.startY = e.clientY;
    this.startX = e.clientX;
    this.startScrollTop = nativeEl.scrollTop;
    this.startScrollLeft = nativeEl.scrollLeft;
    this.hasMoved = false;
    this.preventNextClick = false;
  }

  @HostListener('document:pointermove', ['$event'])
  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;

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
      if (nativeEl.scrollHeight > nativeEl.clientHeight) {
        nativeEl.scrollTop = this.startScrollTop - dy;
      }
      if (nativeEl.scrollWidth > nativeEl.clientWidth) {
        nativeEl.scrollLeft = this.startScrollLeft - dx;
      }
    }
  }

  @HostListener('document:pointerup', ['$event'])
  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    const nativeEl = this.el.nativeElement;

    nativeEl.style.removeProperty('user-select');
    nativeEl.style.removeProperty('touch-action');

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
