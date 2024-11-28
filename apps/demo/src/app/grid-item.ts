import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  HostBinding,
  input,
  output,
} from '@angular/core';
import { ScrollGridItem } from './demo.component';
import { RandomPhotoComponent } from './random-photo.component';

@Component({
  selector: 'demo-grid-item',
  standalone: true,
  imports: [CommonModule, RandomPhotoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        @apply bg-white rounded-lg max-w-full max-h-full flex flex-col shadow-md overflow-hidden transform transition hover:scale-105 min-w-8;
        &.selected {
          @apply ring-4 ring-blue-500;
        }
        &.listItem {
          @apply min-w-8 w-72;
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
      <h2 class="text-xl font-bold mb-2 text-gray-800 flex-shrink-0 truncate">
        Card {{ item().index }}
      </h2>
      <p class="text-gray-600 mb-4 flex-1 line-clamp-2">
        This item is in row {{ row() }} and in column {{ column() }}
      </p>
      <button
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex-shrink-0 truncate"
        (click)="selectItem()"
        (pointerup)="selectItem()"
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
      console.log(this.hostClasses);
    });
  }

  selectItem() {
    if (this.isSelected() === false) {
      console.log('shees', this.isSelected());
      this.isSelectedChange.emit(true);
    }
  }
}
