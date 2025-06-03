import { effect, Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'any' })
export class ItemWidthService {
  private readonly shouldStretchItems: WritableSignal<boolean> = signal(false);
  private readonly minItemWidth: WritableSignal<number> = signal(0);
  private readonly isGrid: WritableSignal<boolean> = signal(false);
  private readonly itemsPerRow: WritableSignal<number> = signal(1);
  private readonly scrollContainerWidth: WritableSignal<number> = signal(0);

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
    effect(() => {
      const shouldStretchItems = this.shouldStretchItems();
      const minItemWidth = this.minItemWidth();
      const isGrid = this.isGrid();
      const itemsPerRow = this.itemsPerRow();
      const scrollContainerWidth = this.scrollContainerWidth();

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
    });
  }

  private setCurrentItemWidth(width: number) {
    if (this.lastItemWidth !== width) {
      this.lastItemWidth = width;
      this.itemWidthObservable.next(width);

      console.log('CurrentItemWidth', width);
    }
  }

  setShouldStretchItems(value: boolean) {
    this.shouldStretchItems.set(value);
  }

  setInputItemWidth(value: number) {
    if (this.minItemWidthObservable.value !== value) {
      this.minItemWidth.set(value);
      this.minItemWidthObservable.next(value);
    }
  }

  setIsGrid(value: boolean) {
    this.isGrid.set(value);
  }

  setItemsPerRow(value: number) {
    this.itemsPerRow.set(value);
  }

  setScrollContainerWidth(value: number) {
    if (this.shouldStretchItems()) {
      this.scrollContainerWidth.set(value);
    }
  }
}
