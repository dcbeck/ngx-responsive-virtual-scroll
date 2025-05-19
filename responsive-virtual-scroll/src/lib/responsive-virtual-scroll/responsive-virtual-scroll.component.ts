/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import {
  animationFrameScheduler as animationScheduler,
  BehaviorSubject,
  combineLatest,
  concat,
  connectable,
  from,
  fromEvent,
  lastValueFrom,
  merge,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';

import {
  concatMap,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  scan,
  startWith,
  take,
  takeUntil,
  tap,
  throttleTime,
  withLatestFrom,
} from 'rxjs/operators';

import {
  IVirtualScrollOptions,
  IVirtualScrollState,
  IVirtualScrollWindow,
  ScrollViewPadding,
} from './basic';
import {
  CmdOption,
  CreateItemCmd,
  CreateRowCmd,
  NoopCmd,
  RemoveItemCmd,
  RemoveRowCmd,
  ShiftRowCmd,
  UpdateItemCmd,
} from './cmd';
import { forColumnsIn, forColumnsInWithPrev, forRowsIn } from './enumerate';
import { calcMeasure, calcScrollWindow, getMaxIndex } from './measurement';
import { ScrollItem } from './scrollItem';
import { ScrollObservableService } from './service';
import { difference, intersection, isEmpty } from './set';
import {
  FocusItemCmd,
  FocusRowCmd,
  IUserCmd,
  SetScrollTopCmd,
  UserCmdOption,
} from './userCmd';
import { VirtualRowComponent } from './virtualRow.component';
import { CommonModule } from '@angular/common';
import { ScrollViewType } from './types';

export type TScrollGridRow<T> = { rowId: number; items: T[] };
@Component({
  selector: 'ngx-responsive-virtual-scroll',
  standalone: true,
  imports: [CommonModule, VirtualRowComponent],
  providers: [ScrollObservableService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        width: 100%;
        max-width: 100%;
        max-height: 100%;
        min-height: 0px;
        min-width: 0px;
        overflow-y: scroll;
        overflow-x: hidden;
      }

      .ngx-responsive-virtual-scroll-container {
        display: width;
        position: relative;
        width: 100%;
        max-width: 100%;
        min-height: 0px;
        min-width: 0px;
      }
    `,
  ],
  template: `<div
    class="ngx-responsive-virtual-scroll-container"
    [style.width]="stretchItems ? '100%' : width"
    [style.height.px]="height"
    [style.marginTop.px]="marginTop"
    [style.marginBottom.px]="marginBottom"
  >
    <div #viewRef><div></div></div>
  </div>`,
})
export class ResponsiveVirtualScrollComponent<T> implements OnInit, OnDestroy {
  // === Inputs ===
  @Input({ required: true }) set items(itemValues: T[]) {
    this.handleItemsInput(itemValues);
  }
  @Input() set type(type: ScrollViewType) {
    this.handleTypeInput(type);
  }
  @Input() set trackBy(trackByFn: (item: T) => string | boolean | number) {
    this.trackByFn$.next(trackByFn);
  }
  @Input() stretchItems = false;
  @Input() autoScrollOnResize = false;
  @Input() set scrollViewPadding(
    padding:
      | number
      | { x: number; y: number }
      | { top: number; left: number; bottom: number; right: number }
  ) {
    this.handlePaddingInput(padding);
  }
  @Input() set itemGap(gap: number) {
    this.itemGap$.next(gap);
  }
  @Input() set gridItemWidth(width: number) {
    this.itemWidth$.next(width);
  }
  @Input({ required: true }) set rowHeight(height: number) {
    this.itemHeight$.next(height);
  }
  @Input() set gridMaxColumns(maxColumns: number) {
    this.numLimitColumns$.next(maxColumns);
  }
  @Input() set renderAdditionalRows(numRows: number) {
    this.numAdditionalRows$.next(numRows);
  }

  // === Outputs ===
  @Output() columnCountChange = new EventEmitter<number>();

  // === Template/Content ===
  @ContentChild(TemplateRef, { static: true })
  private _templateRef!: TemplateRef<ScrollItem>;
  @ViewChild('viewRef', { static: true, read: ViewContainerRef })
  private _viewContainer!: ViewContainerRef;

  // === State & Observables ===
  previousTrackByHash = 0;
  itemSubject$ = new BehaviorSubject<T[]>([]);
  silentValueUpdates$ = new Subject<number>();
  private vsUserCmd = new Subject<IUserCmd>();
  private itemWidth$ = new BehaviorSubject<number>(200);
  private type$ = new BehaviorSubject<ScrollViewType>('grid');
  private padding$ = new BehaviorSubject<ScrollViewPadding>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  private itemGap$ = new BehaviorSubject<number | undefined>(undefined);
  private itemHeight$ = new ReplaySubject<number>(1);
  private numAdditionalRows$ = new BehaviorSubject<number>(1);
  private numLimitColumns$ = new BehaviorSubject<number | undefined>(undefined);
  private actualColumns$ = new ReplaySubject<number>(1);
  private unsubscribe$ = new Subject<void>();
  private scrollWindow$ = new BehaviorSubject<IVirtualScrollWindow | null>(
    null
  );
  private executesAutomaticScroll = false;
  private itemStreamChanged$ = new ReplaySubject<Observable<T[]>>(1);
  private trackByFn$ = new BehaviorSubject<
    undefined | ((item: T) => string | boolean | number)
  >(undefined);
  vsOptions: Observable<IVirtualScrollOptions> = combineLatest({
    itemWidth: this.itemWidth$,
    itemHeight: this.itemHeight$,
    numAdditionalRows: this.numAdditionalRows$,
    numLimitColumns: this.numLimitColumns$,
    itemGap: this.itemGap$,
    type: this.type$,
    padding: this.padding$,
  });

  // === DOM/Resize ===
  private resizeObserver: ResizeObserver;
  private hostResize$ = new Subject<any>();

  // === Misc State ===
  height = 0;
  width = '0px';
  marginTop = 0;
  marginBottom = 0;
  private lastFocusedItem: {
    row: number;
    column: number;
    index: number;
  } | null = null;
  private _subs: Subscription[] = [];
  vsEqualsFunc: (prevIndex: number, curIndex: number) => boolean = (
    prevIndex,
    curIndex
  ) => prevIndex === curIndex;

  constructor(
    private readonly _elem: ElementRef,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _obsService: ScrollObservableService,
    private readonly _zone: NgZone
  ) {
    this.resizeObserver = new ResizeObserver((data) =>
      this.hostResize$.next(data)
    );
    this.resizeObserver.observe(this._elem.nativeElement);
  }

  // === Input Handlers ===
  private handleItemsInput(itemValues: T[]) {
    if (this.trackByFn$.value) {
      const hash = this.createSimpleHash(itemValues, this.trackByFn$.value);
      if (hash !== this.previousTrackByHash) {
        this.renewInitialization(itemValues);
      } else {
        this.executeSilentValueUpdates(itemValues, hash);
      }
      this.previousTrackByHash = hash;
    } else {
      this.renewInitialization(itemValues);
    }
  }

  private handleTypeInput(type: ScrollViewType) {
    this.type$.next(type);
    if (type === 'list') this.actualColumns$.next(1);
  }

  private handlePaddingInput(
    padding:
      | number
      | { x: number; y: number }
      | { top: number; left: number; bottom: number; right: number }
  ) {
    const p = padding as any;
    if (typeof p === 'number' && Number.isFinite(p)) {
      this.padding$.next({ top: p, bottom: p, left: p, right: p });
    } else if (
      typeof p.x === 'number' &&
      Number.isFinite(p.x) &&
      typeof p.y === 'number' &&
      Number.isFinite(p.y)
    ) {
      this.padding$.next({ top: p.y, bottom: p.y, left: p.x, right: p.x });
    } else if (
      typeof p.top === 'number' &&
      Number.isFinite(p.top) &&
      typeof p.left === 'number' &&
      Number.isFinite(p.left) &&
      typeof p.right === 'number' &&
      Number.isFinite(p.right) &&
      typeof p.bottom === 'number' &&
      Number.isFinite(p.bottom)
    ) {
      this.padding$.next({
        top: p.top,
        bottom: p.bottom,
        left: p.left,
        right: p.right,
      });
    }
  }

  // === Hash/Initialization ===
  private renewInitialization(itemValues: T[]) {
    this.itemSubject$.complete();
    this.itemSubject$ = new BehaviorSubject(itemValues);
    this.itemStreamChanged$.next(this.itemSubject$);
  }
  private executeSilentValueUpdates(itemValues: T[], hash: number) {
    this.itemSubject$.next(itemValues);
    this.silentValueUpdates$.next(hash);
    this.rerenderScrollView();
  }
  private createSimpleHash(
    values: T[],
    trackByFn: (item: T) => string | boolean | number
  ): number {
    let hash = 5381;
    for (let v = 0; v < values.length; v++) {
      const data = trackByFn(values[v]);
      let val: number;
      if (typeof data === 'number') {
        val = data | 0;
      } else if (typeof data === 'boolean') {
        val = data ? 1 : 0;
      } else if (typeof data === 'string') {
        for (let i = 0; i < data.length; i++) {
          hash = ((hash << 5) + hash) ^ data.charCodeAt(i);
        }
        continue;
      } else {
        val = 0;
      }
      hash = ((hash << 5) + hash) ^ val;
    }
    return hash >>> 0;
  }

  // === DOM/Scroll ===
  rerenderScrollView = () => {
    this._cdr.markForCheck();
    this._zone.run(() => {
      /**noop*/
    });
  };

  getScrollTop = () => this._elem.nativeElement.scrollTop;
  setScrollTop = (scrollTop: number) => {
    this._elem.nativeElement.scrollTop = scrollTop;
  };

  // === Lifecycle ===
  ngOnInit() {
    this.setupTrackByHashInit();
    this.itemStreamChanged$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((itemStream) => {
        this.initialize(itemStream);
        this.rerenderScrollView();
      });
  }
  ngOnDestroy() {
    this._subs.forEach((sub) => sub.unsubscribe());
    this.resizeObserver.unobserve(this._elem.nativeElement);
    this.resizeObserver.disconnect();
    this.hostResize$.complete();
    this.actualColumns$.complete();
    this.itemWidth$.complete();
    this.itemHeight$.complete();
    this.numAdditionalRows$.complete();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.vsUserCmd.complete();
    this.scrollWindow$.complete();
    this.numLimitColumns$.complete();
    this.type$.complete();
    this.itemGap$.complete();
    this.padding$.complete();
    this.trackByFn$.complete();
    this.itemSubject$.complete();
    this.silentValueUpdates$.complete();
  }

  // === Private helpers ===
  private setupTrackByHashInit() {
    combineLatest({
      itemStream: this.itemStreamChanged$,
      trackByFn: this.trackByFn$,
    })
      .pipe(takeUntil(this.unsubscribe$), take(1))
      .subscribe(({ itemStream, trackByFn }) => {
        if (itemStream instanceof BehaviorSubject && trackByFn) {
          const hash = this.createSimpleHash(
            (itemStream as BehaviorSubject<T[]>).value,
            trackByFn
          );
          this.previousTrackByHash = hash;
        }
      });
  }

  // === Main initialization logic (not refactored for brevity, but should be extracted for clarity) ===
  initialize(dataObservable: Observable<T[]>) {
    //reset all
    if (this._subs.length > 0) {
      this._subs.forEach((sub) => sub.unsubscribe());
      this._subs = [];
      this._elem.nativeElement.scrollTop = 0;
      this._viewContainer.clear();
    }

    this._subs.push(
      this.actualColumns$.pipe(distinctUntilChanged()).subscribe((columns) => {
        this.columnCountChange.emit(columns);

        setTimeout(async () => {
          const index = this.lastFocusedItem?.index;
          this.rerenderScrollView();

          const win = this.scrollWindow$.value;

          if (this.autoScrollOnResize && index !== undefined && win !== null) {
            const newRowIndex = Math.max(
              0,
              Math.floor((index + 1) / (columns || 1))
            );

            if (
              !(
                newRowIndex > win.visibleStartRow &&
                newRowIndex < win.visibleEndRow
              )
            ) {
              await lastValueFrom(
                this._obsService.scrollWin$.pipe(debounceTime(20), take(1))
              );
              this.vsUserCmd.next(new FocusItemCmd(index));
            }
          }
        });
      })
    );

    const getContainerRect = () =>
      this._elem.nativeElement.getBoundingClientRect();

    const initData: any[] = [];

    const data$ = connectable(dataObservable.pipe(startWith(initData)), {
      connector: () => new Subject(),
      resetOnDisconnect: false,
    });

    const dataMeta$ = data$.pipe(
      map((data) => [new Date().getTime(), data.length])
    );

    const options$ = connectable(
      this.vsOptions.pipe(
        tap((options) => {
          this.marginTop = options.padding.top;
          this.marginBottom = Math.max(
            0,
            options.itemGap
              ? options.padding.bottom - options.itemGap
              : options.padding.bottom
          );

          setTimeout(() => {
            this.rerenderScrollView();
          });
        })
      ),
      {
        connector: () => new Subject(),
        resetOnDisconnect: false,
      }
    );

    const rect$ = merge(fromEvent(window, 'resize'), this.hostResize$).pipe(
      debounceTime(20, animationScheduler),
      map(() => getContainerRect()),
      startWith(getContainerRect()),
      map(({ width, height }) => ({ width, height }))
    );

    const scroll$ = new Subject<void>();
    this._zone.runOutsideAngular(() => {
      this._subs.push(
        fromEvent(this._elem.nativeElement, 'scroll').subscribe(() => {
          this._zone.run(() => scroll$.next());
        })
      );
    });

    const scrollTop$ = scroll$.pipe(
      map(() => this.getScrollTop()),
      startWith(0)
    );

    const measure$ = connectable(
      combineLatest({ rect: rect$, options: options$ }).pipe(
        map(({ rect, options }) => calcMeasure(rect, options))
      ),
      {
        connector: () => new Subject(),
        resetOnDisconnect: false,
      }
    );

    const scrollWinObs$ = combineLatest([
      scrollTop$,
      measure$,
      dataMeta$,
      options$,
    ]).pipe(
      map(([scrollTop, measurement, [dataTimestamp, dataLength], options]) => {
        return calcScrollWindow(
          scrollTop,
          measurement,
          dataLength,
          dataTimestamp,
          options
        );
      }),
      distinctUntilChanged((prevWin, curWin) => {
        return (
          prevWin.visibleStartRow === curWin.visibleStartRow &&
          prevWin.visibleEndRow === curWin.visibleEndRow &&
          prevWin.numActualColumns === curWin.numActualColumns &&
          prevWin.numVirtualItems === curWin.numVirtualItems &&
          prevWin.dataTimestamp === curWin.dataTimestamp
        );
      })
    );

    const scrollWin$ = connectable(scrollWinObs$, {
      connector: () => new Subject(),
      resetOnDisconnect: false,
    });

    const dScrollWin$ = scrollWin$.pipe(pairwise());

    const renderCmdObs$ = combineLatest({
      dScrollWin: dScrollWin$,
    }).pipe(
      concatMap(({ dScrollWin }) => {
        const [prevWin, curWin] = dScrollWin;
        let rowsDiffCmd$ = of(new NoopCmd());
        let rowsUpdateCmd$ = of(new NoopCmd());

        const prevIndexMap = {};
        const curIndexMap = {};

        // abs: prevent iterating when prevWin has -1 -> -1
        forRowsIn(
          Math.abs(prevWin.visibleStartRow),
          prevWin.visibleEndRow,
          prevWin.numActualRows,
          (row, index) => {
            (prevIndexMap as any)[index] = row;
          }
        );

        // abs: prevent iterating when curWin has -1 -> -1
        forRowsIn(
          Math.abs(curWin.visibleStartRow),
          curWin.visibleEndRow,
          curWin.numActualRows,
          (row, index) => {
            (curIndexMap as any)[index] = row;
          }
        );

        const removeRowsMap = difference(prevIndexMap, curIndexMap);
        const createRowsMap = difference(curIndexMap, prevIndexMap);

        if (!isEmpty(removeRowsMap)) {
          const removeRowCmds: RemoveRowCmd[] = [];
          const removeItemCmds: RemoveItemCmd[] = [];

          for (const key in removeRowsMap) {
            const rowIndex = parseInt(key, 10);
            const row = (removeRowsMap as any)[key];
            removeRowCmds.push(new RemoveRowCmd(row, rowIndex));

            forColumnsIn(
              0,
              prevWin.numActualColumns - 1,
              row,
              prevWin.numActualColumns,
              prevWin.numVirtualItems,
              (c, dataIndex) => {
                removeItemCmds.push(
                  new RemoveItemCmd(row, rowIndex, c, dataIndex)
                );
              }
            );
          }

          rowsDiffCmd$ = concat(
            from(removeItemCmds.reverse()),
            from(removeRowCmds)
          );
        } else if (!isEmpty(createRowsMap)) {
          const createRowCmds: CreateRowCmd[] = [];
          const createItemCmds: CreateItemCmd[] = [];

          for (const key in createRowsMap) {
            const rowIndex = parseInt(key, 10);
            const row = (createRowsMap as any)[key];

            createRowCmds.push(
              new CreateRowCmd(row, rowIndex, row * curWin.itemHeight)
            );

            forColumnsIn(
              0,
              curWin.numActualColumns - 1,
              row,
              curWin.numActualColumns,
              curWin.numVirtualItems,
              (c, dataIndex) => {
                createItemCmds.push(
                  new CreateItemCmd(row, rowIndex, c, dataIndex)
                );
              }
            );
          }

          rowsDiffCmd$ = concat(from(createRowCmds), from(createItemCmds));
        }

        const existingRows = intersection(prevIndexMap, curIndexMap);

        if (!isEmpty(existingRows)) {
          const shiftRowCmds: ShiftRowCmd[] = [];
          const createItemCmds: CreateItemCmd[] = [];
          const removeItemCmds: RemoveItemCmd[] = [];
          const updateItemCmds: UpdateItemCmd[] = [];
          const columnDiffCreateItemCmds: CreateItemCmd[] = [];
          const columnDiffRemoveItemCmds: RemoveItemCmd[] = [];

          const columnsDiffStart = Math.min(
            prevWin.numActualColumns,
            curWin.numActualColumns
          );
          const numColumns = curWin.numActualColumns - prevWin.numActualColumns;

          for (const key in existingRows) {
            const rowIndex = parseInt(key, 10);
            const prevRow = (existingRows as any)[key].left;
            const row = (existingRows as any)[key].right;

            if (row !== prevRow) {
              shiftRowCmds.push(
                new ShiftRowCmd(row, rowIndex, row * curWin.itemHeight)
              );
            }

            if (
              row !== prevRow ||
              numColumns !== 0 ||
              prevWin.numVirtualItems <= getMaxIndex(prevWin) ||
              curWin.numVirtualItems <= getMaxIndex(curWin) ||
              prevWin.dataTimestamp !== curWin.dataTimestamp
            ) {
              forColumnsInWithPrev(
                0,
                columnsDiffStart - 1,
                row,
                curWin.numActualColumns,
                prevRow,
                prevWin.numActualColumns,
                (c, dataIndex, prevDataIndex) => {
                  if (
                    dataIndex >= curWin.numVirtualItems &&
                    prevDataIndex < prevWin.numVirtualItems
                  ) {
                    removeItemCmds.push(
                      new RemoveItemCmd(row, rowIndex, c, prevDataIndex)
                    );
                  } else if (
                    dataIndex < curWin.numVirtualItems &&
                    prevDataIndex >= prevWin.numVirtualItems
                  ) {
                    createItemCmds.push(
                      new CreateItemCmd(row, rowIndex, c, dataIndex)
                    );
                  } else if (
                    dataIndex < curWin.numVirtualItems &&
                    prevDataIndex < prevWin.numVirtualItems &&
                    !this.vsEqualsFunc(prevDataIndex, dataIndex)
                  ) {
                    updateItemCmds.push(
                      new UpdateItemCmd(row, rowIndex, c, dataIndex)
                    );
                  }
                }
              );
            }

            if (numColumns > 0) {
              forColumnsIn(
                columnsDiffStart,
                curWin.numActualColumns - 1,
                row,
                curWin.numActualColumns,
                curWin.numVirtualItems,
                (c, dataIndex) => {
                  columnDiffCreateItemCmds.push(
                    new CreateItemCmd(row, rowIndex, c, dataIndex)
                  );
                }
              );
            } else if (numColumns < 0) {
              forColumnsIn(
                columnsDiffStart,
                prevWin.numActualColumns - 1,
                prevRow,
                prevWin.numActualColumns,
                prevWin.numVirtualItems,
                (c, dataIndex) => {
                  columnDiffRemoveItemCmds.push(
                    new RemoveItemCmd(prevRow, rowIndex, c, dataIndex)
                  );
                }
              );
            }
          }

          rowsUpdateCmd$ = concat(
            merge(
              from(removeItemCmds.reverse()),
              from(createItemCmds),
              from(updateItemCmds),
              from(shiftRowCmds)
            ),
            merge(
              from(columnDiffRemoveItemCmds.reverse()),
              from(columnDiffCreateItemCmds)
            )
          );
        }

        return merge(rowsDiffCmd$, rowsUpdateCmd$);
      })
    );

    const renderCmd$ = connectable(renderCmdObs$, {
      connector: () => new Subject(),
      resetOnDisconnect: false,
    });

    const updateScrollWinFunc$ = scrollWin$.pipe(
      map((scrollWindow) => (state: IVirtualScrollState) => {
        state.scrollWindow = scrollWindow;

        this._obsService.emitScrollWin([scrollWindow]);

        state.needsCheck = true;
        return state;
      })
    );

    const createRowFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.CreateRow),
      map((cmd) => (state: IVirtualScrollState) => {
        const newRow = this._viewContainer.createComponent(VirtualRowComponent);

        newRow.instance.setSizeObservables(
          this.actualColumns$,
          this.itemHeight$,
          this.type$,
          this.itemGap$,
          this.padding$
        );

        newRow.instance.scrollItemFocused$
          .pipe(takeUntil(this.unsubscribe$))
          .subscribe((res) => {
            this.lastFocusedItem = res;
          });

        newRow.instance.setTransform((cmd as CreateRowCmd).initShift);
        (state.rows as any)[(cmd as CreateRowCmd).actualIndex] = newRow;

        this._obsService.emitCreateRow([cmd as CreateRowCmd, newRow]);

        state.needsCheck = false;
        return state;
      })
    );

    const removeRowFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.RemoveRow),
      map((cmd) => (state: IVirtualScrollState) => {
        const rowComp = (state.rows as any)[(cmd as RemoveRowCmd).actualIndex];
        rowComp.destroy();
        delete (state.rows as any)[(cmd as RemoveRowCmd).actualIndex];

        this._obsService.emitRemoveRow([cmd as RemoveRowCmd, rowComp]);

        state.needsCheck = false;
        return state;
      })
    );

    const shiftRowFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.ShiftRow),
      map((cmd) => (state: IVirtualScrollState) => {
        const shift = cmd as ShiftRowCmd;
        const row = (state.rows as any)[shift.actualIndex];
        row.instance.updateRow(shift.virtualIndex);
        row.instance.setTransform(shift.shift);

        this._obsService.emitShiftRow([shift, row]);

        state.needsCheck = false;
        return state;
      })
    );

    const createItemFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.CreateItem),
      withLatestFrom(data$),
      map(([cmd, data]) => (state: IVirtualScrollState) => {
        const createItem = cmd as CreateItemCmd;
        const item = new ScrollItem(
          data[createItem.dataIndex],
          createItem.virtualIndex,
          createItem.columnIndex
        );
        const viewRef = (state.rows as any)[
          createItem.actualIndex
        ].instance.addItem(this._templateRef, item);

        this._obsService.emitCreateItem([createItem, item, viewRef]);

        state.needsCheck = false;
        return state;
      })
    );

    const updateItemFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.UpdateItem),
      withLatestFrom(data$),
      map(([cmd, data]) => (state: IVirtualScrollState) => {
        const update = cmd as UpdateItemCmd;
        const item = data[update.dataIndex];
        const viewRef = (state.rows as any)[
          update.actualIndex
        ].instance.updateItem(update.columnIndex, item);

        this._obsService.emitUpdateItem([update, item, viewRef]);

        state.needsCheck = false;
        return state;
      })
    );

    const removeItemFunc$ = renderCmd$.pipe(
      filter((cmd) => cmd.cmdType === CmdOption.RemoveItem),
      map((cmd) => (state: IVirtualScrollState) => {
        const comp = (state.rows as any)[(cmd as RemoveItemCmd).actualIndex];
        comp.instance.removeItem((cmd as RemoveItemCmd).columnIndex);

        this._obsService.emitRemoveItem([cmd as RemoveItemCmd]);

        state.needsCheck = false;
        return state;
      })
    );

    const userCmd$ = connectable(this.vsUserCmd, {
      connector: () => new Subject(),
      resetOnDisconnect: false,
    });

    const userSetScrollTop$ = userCmd$.pipe(
      filter((cmd) => cmd.cmdType === UserCmdOption.SetScrollTop)
    );

    const focusRowSetScrollTop$ = userCmd$.pipe(
      filter((cmd) => cmd.cmdType === UserCmdOption.FocusRow),
      withLatestFrom(scrollWin$),
      map(([cmd, scrollWin]) => {
        const focusRow = cmd as FocusRowCmd;
        return new SetScrollTopCmd(focusRow.rowIndex * scrollWin.itemHeight);
      })
    );

    const focusItemSetScrollTop$ = userCmd$.pipe(
      filter((cmd) => cmd.cmdType === UserCmdOption.FocusItem),
      withLatestFrom(scrollWin$),
      map(([cmd, scrollWin]) => {
        const focusItem = cmd as FocusItemCmd;

        return new SetScrollTopCmd(
          Math.floor(focusItem.itemIndex / scrollWin.numActualColumns) *
            scrollWin.itemHeight
        );
      })
    );

    const setScrollTopFunc$ = merge(
      userSetScrollTop$,
      focusRowSetScrollTop$,
      focusItemSetScrollTop$
    ).pipe(
      map((cmd) => (state: IVirtualScrollState) => {
        this.executesAutomaticScroll = true;
        this.setScrollTop((cmd as SetScrollTopCmd).value);

        setTimeout(() => {
          this.executesAutomaticScroll = false;
        }, 200);

        state.needsCheck = false;
        return state;
      })
    );

    let main$: Observable<IVirtualScrollState> | undefined = undefined;

    if (dataObservable instanceof BehaviorSubject) {
      const silentUpdateFunc$ = this.silentValueUpdates$.pipe(
        withLatestFrom(data$),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        map(([_, data]) => (state: IVirtualScrollState) => {
          const win = state.scrollWindow;
          const trackByFn = this.trackByFn$.value;
          if (
            !win ||
            !trackByFn ||
            !state.scrollWindow ||
            typeof state.rows !== 'object'
          ) {
            state.needsCheck = false;
            return state;
          }

          const compValues = Object.values(state.rows) as {
            instance?: VirtualRowComponent;
          }[];

          if (compValues.length === 0) {
            state.needsCheck = false;
            return state;
          }

          const items = data as T[];
          const trackByValueIndexMap = new Map<
            string | boolean | number,
            number
          >();

          const {
            visibleStartRow,
            visibleEndRow,
            numActualColumns,
            numActualRows,
          } = state.scrollWindow;

          const rowPadding = numActualRows; //take the actual rows as padding to prevent errors when scrolling fast
          const startIndex = Math.max(
            0,
            (visibleStartRow - rowPadding) * numActualColumns
          );
          const endIndex = Math.min(
            data.length,
            (visibleEndRow + rowPadding) * numActualColumns
          );

          for (let itemIndex = startIndex; itemIndex < endIndex; itemIndex++) {
            const item = items[itemIndex];
            if (item) {
              trackByValueIndexMap.set(trackByFn(items[itemIndex]), itemIndex);
            }
          }

          compValues.forEach((rowComp) => {
            if (rowComp?.instance?.updateItem) {
              const rowComponent = rowComp.instance;

              const contexts = rowComponent.getAllContextOfRow() as T[];
              for (
                let columnIndex = 0;
                columnIndex < contexts.length;
                columnIndex++
              ) {
                const context = contexts[columnIndex];
                const searchVal = trackByFn(context);
                if (searchVal !== undefined && searchVal !== null) {
                  const dataIndex = trackByValueIndexMap.get(searchVal);
                  if (typeof dataIndex === 'number') {
                    rowComponent.updateItem(columnIndex, data[dataIndex]);
                  }
                }
              }
            }
          });
          trackByValueIndexMap.clear();
          state.needsCheck = false;
          return state;
        })
      );

      const scanFunc = (
        state: IVirtualScrollState,
        changeFn: (state: IVirtualScrollState) => IVirtualScrollState
      ): IVirtualScrollState => changeFn(state);

      // Update store
      main$ = merge(
        createRowFunc$,
        removeRowFunc$,
        shiftRowFunc$,
        createItemFunc$,
        removeItemFunc$,
        updateItemFunc$,
        updateScrollWinFunc$,
        setScrollTopFunc$,
        silentUpdateFunc$
      ).pipe(
        scan(scanFunc, {
          measurement: null,
          scrollWindow: null,
          rows: {},
          needsCheck: false,
        })
      );
    } else {
      const scanFunc = (
        state: IVirtualScrollState,
        changeFn: (state: IVirtualScrollState) => IVirtualScrollState
      ): IVirtualScrollState => changeFn(state);

      // Update store
      main$ = merge(
        createRowFunc$,
        removeRowFunc$,
        shiftRowFunc$,
        createItemFunc$,
        removeItemFunc$,
        updateItemFunc$,
        updateScrollWinFunc$,
        setScrollTopFunc$
      ).pipe(
        scan(scanFunc, {
          measurement: null,
          scrollWindow: null,
          rows: {},
          needsCheck: false,
        })
      );
    }

    this._subs.push(
      scroll$
        .pipe(throttleTime(100), takeUntil(this.unsubscribe$))
        .subscribe(() => {
          if (this.executesAutomaticScroll) return;

          const win = this.scrollWindow$.value;
          if (this.lastFocusedItem !== null && win) {
            if (
              !(
                this.lastFocusedItem.row >= win.visibleStartRow &&
                this.lastFocusedItem.row <= win.visibleEndRow
              )
            ) {
              this.lastFocusedItem = null;
            }
          }
        })
    );

    this._subs.push(
      main$
        .pipe(
          filter((state) => state.needsCheck && state.scrollWindow !== null)
        )
        .subscribe((state) => {
          /**
           * reset the last focused item, if it has left the current scroll view port
           */

          if (state.scrollWindow) {
            this.scrollWindow$.next(state.scrollWindow);
            if (this.type$.value === 'grid') {
              this.actualColumns$.next(state.scrollWindow.numActualColumns);
            }
          }

          if (state.scrollWindow?.virtualHeight === undefined) return;
          this.height = state.scrollWindow?.virtualHeight;

          if (state.scrollWindow?.itemWidth === undefined) {
            this.width = '100%';
          } else {
            this.width = `${
              state.scrollWindow.itemWidth * state.scrollWindow.numActualColumns
            }px`;
          }

          this._cdr.markForCheck();
        })
    );

    // Order is important
    this._subs.push(userCmd$.connect());
    this._subs.push(renderCmd$.connect());
    this._subs.push(scrollWin$.connect());
    this._subs.push(measure$.connect());
    this._subs.push(options$.connect());
    this._subs.push(data$.connect());
  }
}
