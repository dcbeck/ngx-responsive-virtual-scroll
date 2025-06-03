import { TrackByFunction } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { VirtualScrollState } from './scroll-state/virtual-scroll-state';

const TRACK_BY_IDENTITY_FN = <T>(_index: number, item: T) => item;
export class VsState<T> {
  private static readonly DEFAULT_BUFFER_LENGTH = 1;
  private static readonly DEFAULT_SCROLL_THROTTLE_MS = 50;

  public readonly items = new BehaviorSubject<T[]>([]);
  public readonly itemHeight = new BehaviorSubject<number | undefined>(
    undefined
  );
  public readonly scrollContainer = new ReplaySubject<HTMLElement>(1);
  public readonly bufferLength = new BehaviorSubject<number>(
    VsState.DEFAULT_BUFFER_LENGTH
  );
  public readonly gridList = new BehaviorSubject<boolean>(false);
  public readonly trackBy = new BehaviorSubject<TrackByFunction<T>>(
    TRACK_BY_IDENTITY_FN
  );

  public readonly viewCache = new BehaviorSubject<number | boolean>(false);
  public readonly renderedItems = new BehaviorSubject<T[]>([]);
  public readonly scrollPosition =
    new BehaviorSubject<VirtualScrollState.Point>({ x: 0, y: 0 });
  public readonly minIndex = new BehaviorSubject<number>(0);
  public readonly maxIndex = new BehaviorSubject<number>(0);
  public readonly itemsPerRow = new BehaviorSubject<number>(0);

  public readonly asyncRendering = new BehaviorSubject<boolean>(false);
  public readonly scrollDebounceMs = new BehaviorSubject<number>(
    VsState.DEFAULT_SCROLL_THROTTLE_MS
  );

  public readonly renderingViews = new ReplaySubject<boolean>(1);

  public readonly lastFocusedItem = new BehaviorSubject<T | null>(null);

  public readonly itemsPerRowChanged = new Subject<number>();

  private lastScrollContainer: null | HTMLElement = null;

  private lastIsRenderingViews = false;
  setIsRenderingView(isRenderingViews: boolean) {
    if (this.lastIsRenderingViews !== isRenderingViews) {
      this.lastIsRenderingViews = isRenderingViews;
      this.renderingViews.next(isRenderingViews);
    }
  }

  getRenderingViewsValue() {
    return this.lastIsRenderingViews;
  }

  setScrollContainer(scrollContainer: HTMLElement) {
    if (this.lastScrollContainer !== scrollContainer) {
      this.lastScrollContainer = scrollContainer;
      this.scrollContainer.next(scrollContainer);
    }
  }

  destroy() {
    this.items.complete();
    this.itemHeight.complete();
    this.scrollContainer.complete();
    this.bufferLength.complete();
    this.gridList.complete();
    this.trackBy.complete();
    this.viewCache.complete();
    this.renderedItems.complete();
    this.scrollPosition.complete();
    this.minIndex.complete();
    this.maxIndex.complete();
    this.itemsPerRow.complete();
    this.renderingViews.complete();
    this.asyncRendering.complete();
    this.scrollDebounceMs.complete();
    this.lastFocusedItem.complete();
    this.itemsPerRowChanged.complete();
  }
}
