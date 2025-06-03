import { computed, effect, Injectable, Signal, signal } from '@angular/core';

import { BehaviorSubject } from 'rxjs';
import { ParamMap, Router } from '@angular/router';
import { ScrollGridItem, StateKey } from './types';

@Injectable({ providedIn: 'root' })
export class DemoStateService {
  selectedItem = signal<ScrollGridItem | null>(null);
  numberOfItems = signal<number>(500);

  itemWidth = signal<number>(300);
  rowHeight = signal<number>(280);
  itemPadding = signal<number>(24);
  scrollViewPadding = signal<number>(24);
  stretchItems = signal<boolean>(false);
  isGrid = signal<boolean>(true);

  initialStateLoaded = signal<boolean>(false);

  data: Signal<ScrollGridItem[]> = computed(() => {
    const favoredItemIdSet = this.favoredItemIds();
    return Array.from({ length: this.numberOfItems() }).map((_, i) => {
      const id = `${i}_data_1`;

      return {
        index: i,
        id: `${i}_data_1`,
        isFavored: favoredItemIdSet.has(id),
      };
    });
  });

  private favoredItemIds = signal(new Set<string>());

  isGridVisible = signal<boolean>(true);
  gridData$ = new BehaviorSubject<string>('');

  constructor(private readonly router: Router) {
    effect(
      () => {
        const state = `${this.itemWidth()}_${this.rowHeight()}_${this.itemPadding()}_${this.scrollViewPadding()}_${this.stretchItems()}_${this.isGrid()}`;

        if (this.gridData$.value !== state) {
          this.isGridVisible.set(false);
          this.gridData$.next(state);
        }
      },
      { allowSignalWrites: true }
    );

    effect(async () => {
      const selectedItem = this.selectedItem();

      if (this.initialStateLoaded()) {
        await this.router.navigate(['/'], {
          queryParams: {
            selectedIndex: selectedItem ? selectedItem.index : -1,
            numberOfItems: this.numberOfItems(),
            itemWidth: this.itemWidth(),
            rowHeight: this.rowHeight(),
            itemPadding: this.itemPadding(),
            scrollViewPadding: this.scrollViewPadding(),
            stretchItems: this.stretchItems(),
            isGrid: this.isGrid(),
          },
          queryParamsHandling: 'replace',
        });

        this.router.navigateByUrl;
      }
    });
  }

  setFavored(favored: boolean, itemId: string) {
    if (favored) {
      this.favoredItemIds.update((ids) => {
        const idsCopy = new Set([...ids]);
        idsCopy.add(itemId);
        return idsCopy;
      });
    } else {
      this.favoredItemIds.update((ids) => {
        const idsCopy = new Set([...ids]);
        if (idsCopy.has(itemId)) {
          idsCopy.delete(itemId);
        }
        return idsCopy;
      });
    }

    const selectedIndex = this.selectedItem()?.index;
    if (selectedIndex !== undefined) {
      this.selectedItem.set(this.data()[selectedIndex]);
    }
  }

  updateDataByParmMap(paramMap: ParamMap) {
    console.log(paramMap);
    const selectedIndex = this.extractInt(paramMap, 'selectedIndex');
    if (selectedIndex !== null) {
      const data = this.data();
      if (selectedIndex >= 0 && selectedIndex < data.length) {
        this.selectedItem.set(data[selectedIndex]);
      } else {
        this.selectedItem.set(null);
      }
    } else {
      this.selectedItem.set(null);
    }

    const numberOfItems = this.extractInt(paramMap, 'numberOfItems');
    if (numberOfItems !== null && numberOfItems >= 0) {
      this.numberOfItems.set(numberOfItems);
    } else {
      this.numberOfItems.set(500);
    }

    const itemWidth = this.extractInt(paramMap, 'itemWidth');
    if (itemWidth !== null && itemWidth >= 0) {
      this.itemWidth.set(itemWidth);
    } else {
      this.itemWidth.set(300);
    }

    const rowHeight = this.extractInt(paramMap, 'rowHeight');

    if (rowHeight !== null && rowHeight >= 0) {
      this.rowHeight.set(rowHeight);
    } else {
      this.rowHeight.set(280);
    }

    const itemPadding = this.extractInt(paramMap, 'itemPadding');
    if (itemPadding !== null && itemPadding >= 0) {
      this.itemPadding.set(itemPadding);
    } else {
      this.itemPadding.set(24);
    }

    const scrollViewPadding = this.extractInt(paramMap, 'scrollViewPadding');

    if (scrollViewPadding !== null && scrollViewPadding >= 0) {
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

    setTimeout(() => {
      if (this.initialStateLoaded() === false) {
        this.initialStateLoaded.set(true);
      }
    });
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
