
import { BehaviorSubject, Observable, ReplaySubject, combineLatest } from 'rxjs';

export class ItemWidthCalc {
  private readonly shouldStretchItems$ = new BehaviorSubject<boolean>(false);
  private readonly minItemWidth$ = new BehaviorSubject<number>(0);
  private readonly isGrid$ = new BehaviorSubject<boolean>(false);
  private readonly itemsPerRow$ = new BehaviorSubject<number>(1);
  private readonly scrollContainerWidth$ = new BehaviorSubject<number>(0);

  private lastItemWidth = 0;
  private itemWidthObservable = new ReplaySubject<number>(1);
  private minItemWidthObservable = new BehaviorSubject<number | undefined>(
    undefined
  );

  get itemWidth(): Observable<number> {
    return this.itemWidthObservable;
  }

  get miniumItemWidth(): Observable<number | undefined> {
    return this.minItemWidthObservable;
  }

  constructor() {
    combineLatest([
      this.shouldStretchItems$,
      this.minItemWidth$,
      this.isGrid$,
      this.itemsPerRow$,
      this.scrollContainerWidth$,
    ]).subscribe(
      ([
        shouldStretchItems,
        minItemWidth,
        isGrid,
        itemsPerRow,
        scrollContainerWidth,
      ]) => {
        if (minItemWidth <= 0) {
          return;
        }
        if (itemsPerRow <= 0) {
          this.setCurrentItemWidth(minItemWidth);
          return;
        }
        if (shouldStretchItems && isGrid) {
          const stretchedWidth = Math.floor(
            (scrollContainerWidth - 20) / itemsPerRow
          );
          this.setCurrentItemWidth(stretchedWidth);
          return;
        }
        this.setCurrentItemWidth(minItemWidth);
      }
    );
  }

  private setCurrentItemWidth(width: number) {
    if (this.lastItemWidth !== width) {
      this.lastItemWidth = width;
      this.itemWidthObservable.next(width);
    }
  }

  setShouldStretchItems(value: boolean) {
    this.shouldStretchItems$.next(value);
  }

  setInputItemWidth(value: number) {
    if (this.minItemWidthObservable.value !== value) {
      this.minItemWidth$.next(value);
      this.minItemWidthObservable.next(value);
    }
  }

  setIsGrid(value: boolean) {
    this.isGrid$.next(value);
  }

  setItemsPerRow(value: number) {
    this.itemsPerRow$.next(value);
  }

  setScrollContainerWidth(value: number) {
    if (this.shouldStretchItems$.value) {
      this.scrollContainerWidth$.next(value);
    }
  }

  /**
   * Call this to clean up all observables and prevent memory leaks.
   */
  destroy() {
    this.shouldStretchItems$.complete();
    this.minItemWidth$.complete();
    this.isGrid$.complete();
    this.itemsPerRow$.complete();
    this.scrollContainerWidth$.complete();
    this.itemWidthObservable.complete();
    this.minItemWidthObservable.complete();
  }
}
