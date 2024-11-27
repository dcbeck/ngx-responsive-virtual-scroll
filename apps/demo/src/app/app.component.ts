import { CommonModule } from '@angular/common';
import { Component, computed, effect, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ResponsiveVirtualScrollModule } from 'ngx-responsive-virtual-scroll';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RandomPhotoComponent } from "./random-photo.component";

export type Item = {
  id: string;
  index: number;
  imageUrl: string;
};

@Component({
  standalone: true,
  imports: [
    RouterModule,
    ResponsiveVirtualScrollModule,
    CommonModule,
    FormsModule,
    RandomPhotoComponent
],
  selector: 'ngx-responsive-virtual-scroll-demo',
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent {
  selectedItem?: Item;

  numberOfItems = signal<number>(250);

  maxItemsPerRow = signal<number>(7);

  itemWidth = signal<number>(300);

  rowHeight = signal<number>(280);

  itemGap = signal<number>(24);

  scrollViewPadding = signal<number>(24);

  stretchItems = signal<boolean>(true);

  isGrid = signal<boolean>(true);

  previousHeight = 280;

  data: Signal<Item[]> = computed(() =>
    Array.from({ length: this.numberOfItems() }).map((_, i) => ({
      index: i,
      id: `${i}_data_1`,
      imageUrl: 'https://picsum.photos/seed/' + `${i}_data_1` + '/300/200',
    }))
  );

  gridVisible = true;
  private heightChanged$ = new Subject<void>();

  constructor() {
    this.heightChanged$
      .pipe(takeUntilDestroyed(), debounceTime(50))
      .subscribe(() => {
        this.gridVisible = true;
      });

    effect(() => {
      const height = this.rowHeight();
      if (this.previousHeight !== height) {
        this.gridVisible = false;
        this.heightChanged$.next();
      }
    });
  }

  selectItem(item: Item) {
    this.selectedItem = item;
  }
}
