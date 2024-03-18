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
import { ScrollViewType } from './types';
import { ScrollViewPadding } from './basic';

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
        max-width: 100%;
        max-height: 100%;
        min-height: 0px;
        min-width: 0px;
        display: flex;
      }

      .ngx-responsive-virtual-scroll-row-grid {
        flex: 1;
        max-width: 100%;
        max-height: 100%;
        min-height: 0px;
        min-width: 0px;
        position: relative;
        display: none;
      }
    `,
  ],
  template: `<div
    class="ngx-responsive-virtual-scroll-row-grid"
    [ngStyle]="{
      display: displayHost,
      gridTemplateColumns: cssColumns,
      'paddingBottom.px': gapPx,
      'paddingLeft.px': paddingLeft,
      'paddingRight.px': paddingRight,
      'gridGap.px': gapPx
    }"
  >
    <div #viewRef style="display: none;"></div>
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
  paddingLeft = 0;
  paddingRight = 0;

  private _translateY = 0;
  private unsubscribe$ = new Subject<void>();

  constructor(private _cdr: ChangeDetectorRef) {}

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

    //const el =   view.rootNodes[0];
    //todo Wrap in div: el.setAttribute('style', 'display: flex !important;');

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
    numColumns$: Observable<number>,
    height$: Observable<number>,
    type$: Observable<ScrollViewType>,
    gridGap$: Observable<number | undefined>,
    padding$: Observable<ScrollViewPadding>
  ) {
    combineLatest({
      columns: numColumns$,
      height: height$,
      gap: gridGap$,
      padding: padding$,
      type: type$,
    })
      .pipe(takeUntil(this.unsubscribe$), distinctUntilChanged())
      .subscribe((data) => {
        this.heightPx = data.height;
        this.gapPx = data.gap ?? 0;
        this.paddingLeft = data.padding.left;
        this.paddingRight = data.padding.right;
        if (data.type === 'grid') {
          this.cssColumns = Array.from({ length: data.columns })
            .map(() => `minmax(0, 1fr)`)
            .join(' ');
        }

        if (this.heightPx !== undefined && this.heightPx !== null) {
          this.displayHost = 'grid';
        }

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
