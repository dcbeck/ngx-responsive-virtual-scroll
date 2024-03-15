import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EmbeddedViewRef,
  HostBinding,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { ScrollItem } from './scrollItem';
import { CommonModule } from '@angular/common';
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  takeUntil,
} from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-responsive-virtual-scroll-row',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        position: absolute;
        width: 100%;
      }

      .grid {
        position: relative;
        display: none;
      }

      .viewRef {
        display: none;
      }
    `,
  ],
  template: `<div
    class="grid"
    [ngStyle]="{
      display: displayHost,
      gridTemplateColumns: cssColumns,
      width: calcWidth,
      height: calcHeight,
      maxHeight: calcHeight,
      'padding.px': gapPx,
      'gridGap.px': gapPx
    }"
  >
    <div #viewRef class="viewRef"></div>
  </div>`,
})
export class VirtualRowComponent implements OnDestroy {
  @ViewChild('viewRef', { static: true, read: ViewContainerRef })
  private _viewContainer!: ViewContainerRef;
  @HostBinding('style.transform') get getTransform() {
    return `translateY(${this._translateY}px)`;
  }

  @HostBinding('style.grid-template-columns')
  cssColumns?: string;

  @HostBinding('style.height.px')
  heightPx?: number;

  displayHost = 'none';

  gapPx = 0;
  calcWidth = '100%';
  calcHeight = '100%';

  private _translateY = 0;
  private unsubscribe$ = new Subject<void>();

  constructor(private _cdr: ChangeDetectorRef) {
    this.setGap(24);
  }

  setGap(gapInPx: number) {
    this.gapPx = gapInPx;
    this.calcWidth = `calc(100% - ${2 * gapInPx}px)`;
    this.calcHeight = `calc(100% - ${ gapInPx}px)`;
    this._cdr.markForCheck();
  }

  get scrollItemFocused$(): Observable<ScrollItem> {
    return this._scrollItemFocus$.pipe(
      distinctUntilChanged((prev, curr) => prev.$implicit === curr.$implicit)
    );
  }

  private _scrollItemFocus$ = new Subject<ScrollItem>();

  addItem(
    template: TemplateRef<ScrollItem>,
    context: ScrollItem,
    index?: number
  ): EmbeddedViewRef<ScrollItem> {
    this._cdr.markForCheck();

    const view = this._viewContainer.createEmbeddedView(
      template,
      context,
      index
    );

    if (Array.isArray(view.rootNodes)) {
      const resizeEvents = view.rootNodes.map((node) =>
        fromEvent(node, 'mouseup')
      );

      combineLatest(resizeEvents)
        .pipe(takeUntil(this.unsubscribe$))
        .subscribe(() => {
          this._scrollItemFocus$.next({ ...context });
        });
    }

    return view;
  }

  setSizeObservables(
    numColumns: Observable<number>,
    height: Observable<number>
  ) {
    numColumns
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe((columns) => {
        this.cssColumns = Array.from({ length: columns })
          .map(() => '1fr')
          .join(' ');
        this._cdr.markForCheck();
      });

    height
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe((height) => {
        this.heightPx = height;
        this.displayHost = 'grid';
        this._cdr.markForCheck();
      });
  }

  setTransform(translateY: number) {
    this._translateY = translateY;
  }

  updateItem(column: number, context: ScrollItem): EmbeddedViewRef<ScrollItem> {
    this._cdr.markForCheck();
    const viewRef = this._viewContainer.get(
      column
    ) as EmbeddedViewRef<ScrollItem>;
    viewRef.context.$implicit = context;
    return viewRef;
  }

  removeItem(column: number): void {
    this._cdr.markForCheck();
    this._viewContainer.remove(column);
  }

  updateRow(row: number): void {
    for (let c = 0; c < this._viewContainer.length; c++) {
      const viewRef = this._viewContainer.get(c) as EmbeddedViewRef<ScrollItem>;
      viewRef.context.row = row;
    }
    this._cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }
}
