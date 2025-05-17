import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  HostBinding,
  input,
  output,
} from '@angular/core';
import { RandomPhotoComponent } from './random-photo.component';
import { StarIconComponent } from './star-icon.component';
import { ScrollGridItem } from './types';

@Component({
  selector: 'demo-grid-item',
  standalone: true,
  imports: [CommonModule, RandomPhotoComponent, StarIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        @apply bg-white rounded-lg max-w-full max-h-full flex flex-col shadow-md overflow-hidden transform transition hover:scale-105 min-w-8;
        &.selected {
          @apply ring-4 ring-blue-500;
        }
        &.listItem {
          @apply min-w-64;
        }
      }
    `,
  ],
  template: `
    <demo-random-photo
      class="w-full h-[30%]flex-shrink-0 overflow-hidden"
      [seed]="item().id"
    ></demo-random-photo>
    <div class="p-4 flex flex-col flex-1 w-full">
      <div class="w-full flex-shrink-0 flex flex-row overflow-hidden ">
        <h2
          [id]="headingId()"
          class="text-xl font-bold mb-2 text-gray-800 flex-1 truncate flex w-full gap-2 items-center"
        >
          Card {{ item().index }}
        </h2>
        @if (item().isFavored; as isFavored) {

        <div
          class="flex-shrink-0"
          [id]="starId()"
          [attr.data-starred]="isFavored"
        >
          <demo-star-icon [isStarred]="isFavored"></demo-star-icon>
        </div>
        }
      </div>

      <p class="text-gray-600 mb-4 flex-1 line-clamp-2">
        This item is in row {{ row() }} and in column {{ column() }}
      </p>
      <button
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex-shrink-0 truncate"
        (click)="selectItem()"
        (pointerup)="selectItem()"
        [id]="buttonId()"
      >
        Learn More
      </button>
    </div>
  `,
})
export class GridItemComponent {
  type = input<'list' | 'grid'>('grid');
  item = input.required<ScrollGridItem>();
  row = input<number>(0);
  column = input<number>(0);
  isSelected = input<boolean>(false);
  isSelectedChange = output<boolean>();

  buttonId = computed(() => `grid-item-learn-more-btn-${this.item().index}`);
  headingId = computed(() => `grid-item-heading-${this.item().index}`);
  starId = computed(() => `grid-item-star-${this.item().index}`);

  @HostBinding('class') hostClasses = '';

  constructor(cdr: ChangeDetectorRef) {
    effect(() => {
      const classes: string[] = [];
      if (this.isSelected()) {
        classes.push('selected');
      }
      if (this.type() === 'list') {
        classes.push('listItem');
      }
      this.hostClasses = classes.join(' ');

      cdr.markForCheck();
    });
  }

  selectItem() {
    if (this.isSelected() === false) {
      this.isSelectedChange.emit(true);
    }
  }
}
