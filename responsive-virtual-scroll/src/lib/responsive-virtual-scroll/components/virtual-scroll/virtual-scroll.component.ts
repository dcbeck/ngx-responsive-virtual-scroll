import {
  Component,
  Input,
  ContentChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  Renderer2,
  ViewContainerRef,
  TemplateRef,
  Inject,
  Output,
  NgZone,
  TrackByFunction,
  AfterViewInit,
  OnDestroy,
  input,
  signal,
  effect,
  EventEmitter,
  ViewEncapsulation,
  HostBinding,
} from '@angular/core';

import {
  Observable,
  combineLatest,
  fromEvent,
  asyncScheduler,
  forkJoin,
  EMPTY,
  merge,
  of,
  ReplaySubject,
  Subject,
  lastValueFrom,
} from 'rxjs';
import {
  throttleTime,
  tap,
  filter,
  switchMap,
  map,
  distinctUntilChanged,
  withLatestFrom,
  startWith,
  pairwise,
  delay,
  skip,
  take,
  takeUntil,
} from 'rxjs/operators';
import { VirtualItem } from '../../directives/virtual-item.directive';
import { VirtualPlaceholder } from '../../directives/virtual-placeholder.directive';
import { VirtualScrollStrategy } from './scroll-strategy/virtual-scroll-strategy';
import { LI_VIRTUAL_SCROLL_STRATEGY } from './scroll-strategy/virtual-scroll-strategy.token';
import { VirtualScrollState } from './scroll-state/virtual-scroll-state';
import { LI_VIRTUAL_SCROLL_STATE } from './scroll-state/virtual-scroll-state.token';
import { withNextFrom } from '../../operators/with-next-from';
import { delayUntil } from '../../operators/delay-until';
import { VsState } from './vs-state';
import { ItemWidthCalc } from './item-width-calc';

export interface ScrollContainerRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type ViewPaddingInput =
  | number
  | { x: number; y: number }
  | { top: number; left: number; bottom: number; right: number };

export interface ScrollViewPadding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

@Component({
  standalone: false,
  selector: 'ngx-responsive-virtual-scroll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: LI_VIRTUAL_SCROLL_STATE,
      useExisting: VirtualScrollComponent,
    },
  ],
  host: {
    '[attr.grid-list]': 'isGridList || null',
  },
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      #virtualSpacerBefore
      class="virtual-spacer virtual-spacer-before"
    ></div>
    <ng-container #hostView></ng-container>
    <div #virtualSpacerAfter class="virtual-spacer virtual-spacer-after"></div>
    <ng-template #placeholderTemplate let-item let-index="index">
      @if (virtualPlaceholder) {
      <ng-container
        *ngTemplateOutlet="
          virtualPlaceholder.templateRef;
          context: { $implicit: item, index: index }
        "
      >
      </ng-container>
      } @else {
      <div
        class="virtual-placeholder"
        [style.width]="isGridList ? itemWidthReal + 'px' : null"
        [style.max-width]="isGridList ? itemWidthReal + 'px' : null"
        [style.height]="itemHeightReal + 'px'"
        [style.max-height]="itemHeightReal + 'px'"
        [style.margin]="0"
      ></div>
      }
    </ng-template>
  `,
  styles: [
    ':host { display: block; }',
    '.virtual-spacer { width: 100%; }',
    ':host[grid-list] .virtual-placeholder { display: inline-block; }',
    `
      .ngx-scroll-view-grid-item {
        display: inline-flex !important;
        width: var(--item-width);
        height: var(--item-height);
        min-width: var(--item-width);
        min-height: var(--item-height);
        max-width: var(--item-width);
        max-height: var(--item-height);
      }

      .ngx-scroll-view-list-item {
        height: var(--item-height);
        max-height: var(--item-height);
        min-height: var(--item-height);
      }
    `,
  ],
})
export class VirtualScrollComponent<T>
  implements VirtualScrollState<T>, AfterViewInit, OnDestroy
{
  public readonly recalculateItemSize$ = new ReplaySubject<void>(1);

  private readonly stateRef = new VsState<T>();

  private readonly destroy$ = new Subject<void>();

  @Output()
  public readonly renderedItemsChange = new EventEmitter<T[]>();

  @Output()
  public readonly itemsPerRowChange = new EventEmitter<number>();

  @Input() set items(value: T[]) {
    this.stateRef.items.next(value);
  }
  get items(): T[] {
    return this.stateRef.items.value;
  }

  @Input() set type(listType: 'grid' | 'list') {
    this.gridList = listType === 'grid';
  }

  @Input() set stretchItems(isStretch: boolean) {
    this.itemWidthCalculated.setShouldStretchItems(isStretch);
  }

  set gridList(value: boolean) {
    this.stateRef.gridList.next(value);
    this.isGridList = value;
    this.itemWidthCalculated.setIsGrid(value);
  }
  get gridList(): boolean {
    return this.isGridList;
  }
  isGridList = false;

  @Input() set asyncRendering(value: boolean) {
    this.stateRef.asyncRendering.next(value);
    this.isAsyncRendering = value;
  }
  get asyncRendering(): boolean {
    return this.stateRef.asyncRendering.value;
  }
  isAsyncRendering = false;

  autoScrollOnResize = input(false);

  @Input() set gridItemWidth(value: number | undefined) {
    this.itemWidthCalculated.setInputItemWidth(value ?? 0);
  }

  itemWidthReal?: number;
  @HostBinding('style.--item-width')
  itemWidthStyle = '100%';

  @Input() set rowHeight(value: number | undefined) {
    this.stateRef.itemHeight.next(value);
    this.itemHeightReal = value;
  }
  get rowHeight(): number | undefined {
    return this.stateRef.itemHeight.value;
  }
  itemHeightReal?: number;

  @HostBinding('style.--item-height')
  get itemHeightVar(): string {
    return `${this.rowHeight}px`;
  }

  @Input() set scrollDebounceMs(value: number) {
    this.stateRef.scrollDebounceMs.next(value);
  }
  get scrollDebounceMs(): number {
    return this.stateRef.scrollDebounceMs.value;
  }

  @Input() set bufferLength(value: number) {
    this.stateRef.bufferLength.next(value);
  }
  get bufferLength(): number {
    return this.stateRef.bufferLength.value;
  }

  @Input() set viewCache(value: number | boolean) {
    this.stateRef.viewCache.next(value);
  }

  get viewCache(): number | boolean {
    return this.stateRef.viewCache.value;
  }

  @Input() set trackBy(value: TrackByFunction<T>) {
    this.stateRef.trackBy.next(value);
  }

  get trackBy(): TrackByFunction<T> {
    return this.stateRef.trackBy.value;
  }

  public readonly eventCapture = input(false);

  @ContentChild(VirtualItem)
  public virtualItem!: VirtualItem<T>;

  @ContentChild(VirtualPlaceholder)
  public virtualPlaceholder?: VirtualPlaceholder<T>;

  @ViewChild('hostView', { read: ViewContainerRef, static: true })
  public viewContainerRef!: ViewContainerRef;

  @ViewChild('placeholderTemplate', { static: true })
  public placeholderTemplate!: TemplateRef<VirtualPlaceholder.ViewContext<T>>;

  @ViewChild('virtualSpacerBefore', { static: true })
  public _virtualSpacerBefore!: ElementRef;

  @ViewChild('virtualSpacerAfter', { static: true })
  public _virtualSpacerAfter!: ElementRef;

  private readonly afterViewInit$ = new ReplaySubject<void>(1);

  private readonly onDestroy$ = new ReplaySubject<void>(1);

  private _scrollContainer = signal<HTMLElement | null>(null);

  public get _renderedItems(): T[] {
    return this.stateRef.renderedItems.value;
  }
  public set _renderedItems(value: T[]) {
    this.stateRef.renderedItems.next(value);
    this.renderedItemsChange.emit(value);
  }

  public get _scrollPosition(): VirtualScrollState.Point {
    return this.stateRef.scrollPosition.value;
  }
  public set _scrollPosition(value: VirtualScrollState.Point) {
    this.stateRef.scrollPosition.next(value);
  }

  public get _minIndex(): number {
    return this.stateRef.minIndex.value;
  }
  public set _minIndex(value: number) {
    this.stateRef.minIndex.next(value);
  }

  public get _maxIndex(): number {
    return this.stateRef.maxIndex.value;
  }
  public set _maxIndex(value: number) {
    this.stateRef.maxIndex.next(value);
  }

  public get _itemsPerRow(): number {
    return this.stateRef.itemsPerRow.value;
  }
  public set _itemsPerRow(value: number) {
    if (this.stateRef.itemsPerRow.value !== value) {
      this.itemWidthCalculated.setItemsPerRow(value);
      this.stateRef.itemsPerRow.next(value);
      this.stateRef.itemsPerRowChanged.next(value);
      this.itemsPerRowChange.emit(value);
    }
  }

  @HostBinding('style.--item-rows-selector')
  get itemRowsSelectorVar(): string {
    return `${this._itemsPerRow}n + 1`;
  }

  public get _renderingViews(): boolean {
    return this.stateRef.getRenderingViewsValue();
  }
  public set _renderingViews(value: boolean) {
    this.stateRef.setIsRenderingView(value);
  }

  private _cachedViews: VirtualScrollState.ViewRecord<T> = new Map();
  private _renderedViews: VirtualScrollState.ViewRecord<T> = new Map();
  private _lastScrollOffset: VirtualScrollState.Point = { x: 0, y: 0 };
  private _listElement = signal<HTMLElement | null>(null);

  private unsubscribeFromScrollEvent$ = new Subject<void>();
  private unsubscribeFromPointerEvent$ = new Subject<void>();
  private readonly itemWidthCalculated: ItemWidthCalc;

  constructor(
    @Inject(LI_VIRTUAL_SCROLL_STRATEGY)
    private readonly scrollStrategy: VirtualScrollStrategy<T>,
    private readonly renderer: Renderer2,
    private readonly zone: NgZone,
    private readonly cdr: ChangeDetectorRef,

    { nativeElement: listElement }: ElementRef<HTMLElement>
  ) {
    this.itemWidthCalculated = new ItemWidthCalc();


    this.stateRef.setCdr(cdr);

    effect(() => {
      const autoScrollOnResize = this.autoScrollOnResize();
      const scrollContainer = this._scrollContainer();

      this.unsubscribeFromPointerEvent$.next();
      if (autoScrollOnResize && scrollContainer) {
        fromEvent<PointerEvent>(scrollContainer, 'pointerdown')
          .pipe(takeUntil(this.unsubscribeFromPointerEvent$))
          .subscribe((event) => {
            const target = event.target as HTMLElement;
            const renderViews: Element[] = [];
            const itemValues: T[] = [];
            for (let index = 0; index < this.renderedViews.length; index++) {
              const view = this.renderedViews[index];
              const rootNode = view.viewRef.rootNodes?.[0];
              if (rootNode && rootNode instanceof Element && view.item) {
                renderViews[index] = rootNode;
                itemValues[index] = view.item;
              }
            }
            const index = renderViews.findIndex((el) => el.contains(target));
            if (index > 0 && index < itemValues.length) {
              this.stateRef.lastFocusedItem.next(itemValues[index]);
            }
          });
      }
    });

    effect(() => {
      const scrollContainer = this._scrollContainer();
      const listElement = this._listElement();
      const capture = this.eventCapture();

      if (scrollContainer && listElement) {
        this.applyScrollContainerStyles(
          listElement,
          scrollContainer === listElement
        );

        this.unsubscribeFromScrollEvent$.next();
        merge(
          fromEvent<MouseEvent>(scrollContainer, 'scroll', { capture }),
          this.scrollContainerResize(scrollContainer),
          of({ x: 0, y: 0 })
        )
          .pipe(
            map(
              (): ScrollContainerRect => ({
                left: scrollContainer.scrollLeft,
                top: scrollContainer.scrollTop,
                right:
                  scrollContainer.scrollLeft + this.getUsableContainerWidth(),
                bottom:
                  scrollContainer.scrollTop + this.getUsableContainerHeight(),
              })
            )
          )
          .pipe(
            distinctUntilChanged(
              (prev, cur) =>
                prev.left === cur.left &&
                prev.top === cur.top &&
                prev.right === cur.right &&
                prev.bottom === cur.bottom
            ),
            takeUntil(this.unsubscribeFromScrollEvent$)
          )
          .subscribe((containerBounds) => {
            // Calculate usable width excluding padding and scrollbar insets

            this.itemWidthCalculated.setScrollContainerWidth(
              this.getUsableContainerWidth()
            );

            this._lastScrollOffset.x =
              containerBounds.left - this._scrollPosition.x;
            this._lastScrollOffset.y =
              containerBounds.top - this._scrollPosition.y;
            this._scrollPosition = {
              x: containerBounds.left,
              y: containerBounds.top,
            };

            this.cdr.detectChanges();
          });
      }

      if (scrollContainer) {
        this.stateRef.setScrollContainer(scrollContainer);
      }
    });

    this._scrollContainer.set(listElement);
    this._listElement.set(listElement);

    // Clear all views if the trackBy changes
    this.stateRef.trackBy
      .pipe(switchMap(() => this.clearViewsSafe()))
      .pipe(takeUntil(this.destroy$))
      .subscribe();

    // Clean the view cache when the list of items changes
    this.stateRef.items
      .pipe(switchMap(() => this.waitForRenderComplete))
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cleanViewCache());

    // Clear views and recalculate item size if changing grid list view state
    this.stateRef.gridList
      .pipe(
        distinctUntilChanged(),
        skip(1),
        delay(0), // Wait for any DOM updates to occur
        switchMap(() => this.clearViewsSafe())
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculateItemSize());

    // Clear the view cache if disabled
    this.stateRef.viewCache
      .pipe(
        distinctUntilChanged(),
        filter((viewCache) => !viewCache)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.clearCachedViews());

    // Clear all views and stop listening for scrolls on destroy

    // Recalculate views on rendered items changes
    this.afterViewInit$
      .pipe(
        switchMap(() =>
          this.stateRef.renderedItems.pipe(
            withLatestFrom(this.stateRef.maxIndex, this.stateRef.items),
            pairwise(),
            startWith([[], [[] as T[], 0, [] as T[]]] as const)
          )
        ),
        tap(() => {
          if (!this.virtualItem) {
            throw new Error('liVirtualItem directive is not defined.');
          }
        }),
        filter(
          ([
            [prevRenderedItems, prevMinIndex, prevItems],
            [renderedItems, minIndex, items],
          ]) => {
            // Skip updates if nothing has changed and we're not currently re-rendering views
            return (
              this._renderingViews ||
              !(
                prevItems === items &&
                renderedItems.length === prevRenderedItems?.length &&
                minIndex === prevMinIndex
              )
            );
          }
        ),
        switchMap(([, [renderedItems, minIndex]]) => {
          const prevRenderedViews = this.renderedViews;

          // Remove any prior views that are no longer being rendered
          prevRenderedViews.forEach((view: VirtualScrollState.ViewInfo<T>) => {
            if (!this.isViewForAnyItems(view, renderedItems, minIndex)) {
              this.scrollStrategy.unrenderView(this, view);
            }
          });

          // Purge the view cache
          this.scrollStrategy.purgeViewCache(this);

          if (renderedItems.length === 0) {
            this._renderingViews = false;
            return EMPTY;
          } else {
            this._renderingViews = true;

            // Render the new list of items
            return forkJoin(
              renderedItems.map((renderedItem, index) =>
                this.scrollStrategy.renderViewForItem(
                  this,
                  renderedItem,
                  minIndex + index,
                  this.isAsyncRendering && prevRenderedViews.length > 0
                )
              )
            );
          }
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((renderedViews) => {
        if (this.viewContainerRef.length !== renderedViews.length) {
          console.warn(
            `[VirtualScroll] Expected ${renderedViews.length} views, got ${this.viewContainerRef.length}.`
          );
        }

        this._renderingViews = false;
      });

    // Recalculate rendered items on scroll state changes
    this.afterViewInit$
      .pipe(
        switchMap(() => this.scrollStateChange),
        // Skip updates if we're ignoring scroll updates or item info isn't defined
        filter(([, , minItemWidth, itemHeight, scrollContainer]) => {
          return (
            !this.renderingViews &&
            (!!minItemWidth || !this.gridList) &&
            !!itemHeight &&
            scrollContainer.clientWidth > 0 &&
            scrollContainer.clientHeight > 0
          );
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ([
          scrollPosition,
          items,
          minItemWidth,
          itemHeight,
          scrollContainer,
          bufferLength,
          gridList,
        ]) => {
          // The bounds of the scroll container, in pixels
          const renderedBounds: ScrollContainerRect = {
            left: scrollPosition.x,
            top: scrollPosition.y,
            right: scrollPosition.x + this.getUsableContainerWidth(),
            bottom: scrollPosition.y + this.getUsableContainerHeight(),
          };
          const bufferLengthPx = this.getUsableContainerHeight() * bufferLength;

          // Calculate the number of rendered items per row

          const itemsPerRow = Math.max(
            1,
            gridList
              ? Math.floor(this.getUsableContainerWidth() / minItemWidth!)
              : 1
          );
          const virtualScrollHeight =
            (items.length * itemHeight!) / itemsPerRow;

          // Adjust the bounds by the buffer length and clamp to the edges of the container
          renderedBounds.top -= bufferLengthPx;
          renderedBounds.top = Math.max(0, renderedBounds.top);
          renderedBounds.bottom += bufferLengthPx;
          renderedBounds.bottom = Math.min(
            virtualScrollHeight,
            renderedBounds.bottom
          );

          cdr.detach();

          // Calculate which items should be rendered on screen
          this._itemsPerRow = itemsPerRow;
          this._minIndex = Math.min(
            items.length - 1,
            Math.floor(renderedBounds.top / itemHeight!) * itemsPerRow
          );
          this._maxIndex = Math.min(
            items.length - 1,
            Math.ceil(renderedBounds.bottom / itemHeight!) * itemsPerRow
          );
          this._renderedItems = items.slice(this._minIndex, this._maxIndex + 1);

          cdr.reattach();
          cdr.markForCheck();

          // Calculate the virtual scroll space before/after the rendered items
          const spaceBeforePx =
            Math.floor(this._minIndex / itemsPerRow) * itemHeight!;
          const spaceAfterPx =
            Math.floor((items.length - (this._maxIndex + 1)) / itemsPerRow) *
            itemHeight!;

          // Update the virtual spacers in the DOM (optimized)
          this.updateVirtualSpacers(spaceBeforePx, spaceAfterPx);
        }
      );

    // Dynamically calculate itemWidth if not explicitly passed as an input
    this.afterViewInit$
      .pipe(
        withNextFrom(this.itemWidthCalculated.miniumItemWidth),
        filter(([, itemWidth]) => itemWidth === undefined),
        switchMap(() => this.refItemChange)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (refItem) => (this.gridItemWidth = this.calculateItemWidth(refItem))
      );

    // Dynamically calculate itemHeight if not explicitly passed as an input
    this.afterViewInit$
      .pipe(
        withNextFrom(this.stateRef.itemHeight),
        filter(([, itemHeight]) => itemHeight === undefined),
        switchMap(() => this.refItemChange)
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (refItem) => (this.rowHeight = this.calculateItemHeight(refItem))
      );
  }

  ngAfterViewInit(): void {
    this.afterViewInit$.next();

    this.itemWidthCalculated.itemWidth.subscribe((width) => {
      this.itemWidthReal = width;
      this.itemWidthStyle = `${width}px`;
      this.cdr.detectChanges();
    });

    this.subscribeToAutoscrollEvents();
  }

  private subscribeToAutoscrollEvents() {
    if (this.autoScrollOnResize()) {
      this.stateRef.itemsPerRowChanged
        .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
        .subscribe(async (itemsPerRow) => {
          const item = this.stateRef.lastFocusedItem.value;

          await lastValueFrom(this.waitForRenderComplete.pipe(take(1)));
          setTimeout(() => {
            if (item) {
              const index = this.items.indexOf(item);

              if (index >= 0) {
                if (this.scrollContainer && this.itemHeightReal != null) {
                  const row = Math.floor(index / itemsPerRow);
                  const scrollTop = row * this.itemHeightReal;
                  const style = getComputedStyle(this.scrollContainer);
                  const paddingTop = parseFloat(style.paddingTop) || 0;
                  this.scrollContainer.scrollTop = scrollTop + paddingTop;
                  this.cdr.detectChanges();
                }
              }
            }
          }, 30);
        });
    }
  }

  // Cache for container paddings to avoid repeated getComputedStyle calls
  private _containerPaddingCache: {
    width: {
      clientWidth: number;
      useable: number;
    } | null;
    height: {
      clientHeight: number;
      useable: number;
    } | null;
  } = { width: null, height: null };

  private getUsableContainerWidth() {
    const container = this.scrollContainer;
    if (!container) return 0;

    // Only recalculate if clientWidth has changed
    if (
      !this._containerPaddingCache.width ||
      this._containerPaddingCache.width.clientWidth !== container.clientWidth
    ) {
      const style = getComputedStyle(container);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      this._containerPaddingCache.width = {
        clientWidth: container.clientWidth,
        useable: container.clientWidth - paddingLeft - paddingRight,
      };
    }
    return this._containerPaddingCache.width!.useable;
  }

  private getUsableContainerHeight() {
    const container = this.scrollContainer;
    if (!container) return 0;

    // Only recalculate if clientHeight has changed
    if (
      !this._containerPaddingCache.height ||
      this._containerPaddingCache.height.clientHeight !== container.clientHeight
    ) {
      const style = getComputedStyle(container);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      this._containerPaddingCache.height = {
        clientHeight: container.clientHeight,
        useable: container.clientHeight - paddingTop - paddingBottom,
      };
    }
    return this._containerPaddingCache.height!.useable;
  }

  public get scrollContainer(): HTMLElement | null {
    return this._scrollContainer();
  }

  public get minIndex(): number {
    return this._minIndex;
  }

  public get maxIndex(): number {
    return this._maxIndex;
  }

  public get itemsPerRow() {
    return this._itemsPerRow;
  }

  public get renderedItems(): T[] {
    return this._renderedItems;
  }

  public get scrollPosition(): VirtualScrollState.Point {
    return this._scrollPosition;
  }

  public get lastScrollOffset(): VirtualScrollState.Point {
    return this._lastScrollOffset;
  }

  public get renderingViews(): boolean {
    return this._renderingViews;
  }

  public get cachedViews(): VirtualScrollState.ViewInfo<T>[] {
    return Array.from(this._cachedViews.values());
  }

  public get renderedViews(): VirtualScrollState.ViewInfo<T>[] {
    return Array.from(this._renderedViews.values());
  }

  public get waitForRenderComplete(): Observable<void> {
    return this.stateRef.renderingViews.pipe(
      filter((rendering) => !rendering),
      map(() => undefined),
      take(1)
    );
  }

  public recalculateItemSize(): void {
    this.recalculateItemSize$.next();
  }

  public getCachedView(
    index: number,
    item: T
  ): VirtualScrollState.ViewInfo<T> | undefined {
    return this.getViewInfo(this._cachedViews, index, item);
  }

  public getRenderedView(
    index: number,
    item: T
  ): VirtualScrollState.ViewInfo<T> | undefined {
    return this.getViewInfo(this._renderedViews, index, item);
  }

  public deleteCachedView(index: number, item: T): boolean {
    return this.deleteViewInfo(this._cachedViews, index, item);
  }

  public deleteRenderedView(index: number, item: T): boolean {
    return this.deleteViewInfo(this._renderedViews, index, item);
  }

  public setCachedView(view: VirtualScrollState.ViewInfo<T>): void {
    this.updateViewInfo(this._cachedViews, view);
  }

  public setRenderedView(view: VirtualScrollState.ViewInfo<T>): void {
    this.updateViewInfo(this._renderedViews, view);
  }

  private scrollContainerResize(
    scrollContainer: HTMLElement
  ): Observable<unknown> {
    return new Observable((observer) => {
      const res = new ResizeObserver(() =>
        this.zone.run(() => observer.next())
      );
      res.observe(scrollContainer);
      this.onDestroy$.subscribe(() => (res.disconnect(), observer.complete()));
    });
  }

  private get scrollDebounce(): Observable<VirtualScrollState.Point> {
    return this.stateRef.scrollDebounceMs.pipe(
      switchMap((scrollDebounceMs) =>
        this.stateRef.scrollPosition.pipe(
          throttleTime(scrollDebounceMs, asyncScheduler, {
            leading: true,
            trailing: true,
          })
        )
      )
    );
  }

  private get scrollStateChange() {
    return combineLatest([
      // Listen for scroll position changes
      this.scrollDebounce,
      // Listen for list state changes that affect rendering
      this.stateRef.items,
      this.itemWidthCalculated.miniumItemWidth,
      this.stateRef.itemHeight,
      this.stateRef.scrollContainer,
      this.stateRef.bufferLength,
      this.stateRef.gridList,
      this.stateRef.trackBy,
    ]);
  }

  private get refItemChange(): Observable<HTMLElement> {
    return combineLatest([
      this.stateRef.items,
      this.stateRef.scrollContainer,

      this.recalculateItemSize$.pipe(startWith(true)),
    ]).pipe(
      filter(
        ([items, scrollContainer]) => !!scrollContainer && items.length > 0
      ),
      delayUntil(this.waitForRenderComplete),
      tap(([items]) => {
        if (this._renderedItems.length === 0) {
          this._renderedItems = [items[0]];
        }
      }),
      map(([, scrollContainer]) =>
        scrollContainer.querySelector<HTMLElement>(
          ':scope > :not(.virtual-spacer)'
        )
      ),
      filter((refItem): refItem is HTMLElement => !!refItem)
    );
  }

  private applyScrollContainerStyles(item: HTMLElement, apply: boolean) {
    item.style.overflowY = apply ? 'scroll' : 'initial';
  }

  private calculateItemWidth(itemEl: HTMLElement): number {
    const style = getComputedStyle(itemEl);
    return (
      itemEl.offsetWidth +
      parseInt(style.marginLeft) +
      parseInt(style.marginRight)
    );
  }

  private calculateItemHeight(itemEl: HTMLElement): number {
    const style = getComputedStyle(itemEl);
    return (
      itemEl.offsetHeight +
      parseInt(style.marginTop) +
      parseInt(style.marginBottom)
    );
  }

  private isViewForAnyItems(
    view: VirtualScrollState.ViewInfo<T>,
    items: T[] = this.items,
    indexOffset = 0
  ): boolean {
    const trackByValue = this.trackBy(view.itemIndex, view.item);

    return !!items.find((curItem, curIndex) =>
      Object.is(trackByValue, this.trackBy(indexOffset + curIndex, curItem))
    );
  }

  private getViewInfo(
    viewRecord: VirtualScrollState.ViewRecord<T>,
    index: number,
    item: T
  ): VirtualScrollState.ViewInfo<T> | undefined {
    return viewRecord.get(this.trackBy(index, item));
  }

  private deleteViewInfo(
    viewRecord: VirtualScrollState.ViewRecord<T>,
    index: number,
    item: T
  ): boolean {
    return viewRecord.delete(this.trackBy(index, item));
  }

  private updateViewInfo(
    viewRecord: VirtualScrollState.ViewRecord<T>,
    view: VirtualScrollState.ViewInfo<T>
  ): VirtualScrollState.ViewRecord<T> {
    return viewRecord.set(this.trackBy(view.itemIndex, view.item), view);
  }

  private cleanViewCache(): void {
    // Destroy all cached views that are no longer valid for current items
    for (const [trackByKey, view] of this._cachedViews.entries()) {
      if (!this.isViewForAnyItems(view) || view.viewRef.destroyed) {
        this.scrollStrategy.destroyViewRef(this, view.viewRef);
        this._cachedViews.delete(trackByKey);
      }
    }
  }

  /**
   * Batch update of virtual spacer heights for better performance and readability.
   */
  private updateVirtualSpacers(spaceBeforePx: number, spaceAfterPx: number) {
    this.renderer.setStyle(
      this._virtualSpacerBefore.nativeElement,
      'height',
      `${spaceBeforePx}px`
    );
    this.renderer.setStyle(
      this._virtualSpacerAfter.nativeElement,
      'height',
      `${spaceAfterPx}px`
    );
  }

  private clearViewsSafe(): Observable<void> {
    return this.waitForRenderComplete.pipe(
      map(() => {
        this.clearRenderedViews();
        this.clearCachedViews();
        this.updateVirtualSpacers(0, 0);
      })
    );
  }

  private clearCachedViews(): void {
    for (const cachedView of this._cachedViews.values()) {
      this.scrollStrategy.destroyViewRef(this, cachedView.viewRef);
    }

    this._cachedViews = new Map();
  }

  private clearRenderedViews(): void {
    this._renderedItems = [];

    for (const renderedView of this._renderedViews.values()) {
      this.scrollStrategy.destroyViewRef(this, renderedView.viewRef);
    }

    this.viewContainerRef.clear();
    this._renderedViews = new Map();
  }

  ngOnDestroy(): void {
    this.clearViewsSafe();
    this.itemWidthCalculated.destroy();
    this.unsubscribeFromScrollEvent$.next();
    this.unsubscribeFromScrollEvent$.complete();
    this.unsubscribeFromPointerEvent$.next();
    this.unsubscribeFromPointerEvent$.complete();
    this.onDestroy$.next();
    this.onDestroy$.complete();
    this.itemsPerRowChange.complete();
    this.stateRef.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
