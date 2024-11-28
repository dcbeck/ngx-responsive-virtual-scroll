import { computed, effect, Injectable, Signal, signal } from '@angular/core';
import { ScrollGridItem } from './demo.component';
import { BehaviorSubject } from 'rxjs';
import { ParamMap, Router } from '@angular/router';

export type StateKey =
  | 'selectedIndex'
  | 'numberOfItems'
  | 'maxItemsPerRow'
  | 'itemWidth'
  | 'rowHeight'
  | 'itemGap'
  | 'scrollViewPadding'
  | 'stretchItems'
  | 'isGrid';

@Injectable({ providedIn: 'root' })
export class DemoStateService {
  selectedItem = signal<ScrollGridItem | null>(null);
  numberOfItems = signal<number>(500);
  maxItemsPerRow = signal<number>(6);
  itemWidth = signal<number>(300);
  rowHeight = signal<number>(280);
  itemGap = signal<number>(24);
  scrollViewPadding = signal<number>(24);
  stretchItems = signal<boolean>(false);
  isGrid = signal<boolean>(true);

  data: Signal<ScrollGridItem[]> = computed(() =>
    Array.from({ length: this.numberOfItems() }).map((_, i) => ({
      index: i,
      id: `${i}_data_1`,
    }))
  );
  isGridVisible = signal<boolean>(true);
  gridData$ = new BehaviorSubject<string>('');


  constructor(private readonly router: Router) {
    effect(
      () => {
        const state = `${this.maxItemsPerRow()}_${this.itemWidth()}_${this.rowHeight()}_${this.itemGap()}_${this.scrollViewPadding()}_${this.stretchItems()}_${this.isGrid()}`;

        if (this.gridData$.value !== state) {
          this.isGridVisible.set(false);
          this.gridData$.next(state);
        }
      },
      { allowSignalWrites: true }
    );

    effect(() => {

        console.log()
      this.router.navigate(['/'], {
        queryParams: {
          selectedIndex: this.selectedItem()?.index || -1,
          numberOfItems: this.numberOfItems(),
          maxItemsPerRow: this.maxItemsPerRow(),
          itemWidth: this.itemWidth(),
          rowHeight: this.rowHeight(),
          itemGap: this.itemGap(),
          scrollViewPadding: this.scrollViewPadding(),
          stretchItems: this.stretchItems(),
          isGrid: this.isGrid(),
        },
      });
    });
  }

  updateDataByParmMap(paramMap: ParamMap) {
    const selectedIndex = this.extractInt(paramMap, 'selectedIndex');
    if (selectedIndex !== null) {
      const data = this.data();
      if (selectedIndex > 0 && selectedIndex < data.length) {
        this.selectedItem.set(data[selectedIndex]);
      } else {
        this.selectedItem.set(null);
      }
    } else {
      this.selectedItem.set(null);
    }

    const numberOfItems = this.extractInt(paramMap, 'numberOfItems');
    if (numberOfItems !== null && numberOfItems > 0) {
      this.numberOfItems.set(numberOfItems);
    } else {
      this.numberOfItems.set(500);
    }

    const maxItemsPerRow = this.extractInt(paramMap, 'maxItemsPerRow');
    if (maxItemsPerRow !== null && maxItemsPerRow > 0) {
      this.maxItemsPerRow.set(maxItemsPerRow);
    } else {
      this.maxItemsPerRow.set(6);
    }

    const itemWidth = this.extractInt(paramMap, 'itemWidth');
    if (itemWidth !== null && itemWidth > 0) {
      this.itemWidth.set(itemWidth);
    } else {
      this.itemWidth.set(300);
    }

    const rowHeight = this.extractInt(paramMap, 'rowHeight');
    if (rowHeight !== null && rowHeight > 0) {
      this.rowHeight.set(rowHeight);
    } else {
      this.rowHeight.set(280);
    }

    const itemGap = this.extractInt(paramMap, 'itemGap');
    if (itemGap !== null && itemGap > 0) {
      this.itemGap.set(itemGap);
    } else {
      this.itemGap.set(24);
    }

    const scrollViewPadding = this.extractInt(paramMap, 'scrollViewPadding');
    if (scrollViewPadding !== null && scrollViewPadding > 0) {
      this.scrollViewPadding.set(scrollViewPadding);
    } else {
      this.scrollViewPadding.set(24);
    }

    const stretchItems = this.extractBool(paramMap, 'stretchItems');
    if (stretchItems !== null) {
      this.stretchItems.set(stretchItems);
    } else {
      this.stretchItems.set(false);
    }

    const isGrid = this.extractBool(paramMap, 'isGrid');
    if (isGrid !== null) {
      this.isGrid.set(isGrid);
    } else {
      this.isGrid.set(true);
    }
  }

  private extractInt(paramMap: ParamMap, key: StateKey): number | null {
    const data = paramMap.get(key);
    if (typeof data !== 'string') return null;

    const parsed = parseInt(data);
    if (isNaN(parsed)) return null;

    return parsed;
  }

  private extractBool(paramMap: ParamMap, key: StateKey): boolean | null {
    const data = paramMap.get(key);
    if (typeof data !== 'string') return null;

    const parsed = data.trim().toLowerCase() === 'true';
    return parsed;
  }
}
