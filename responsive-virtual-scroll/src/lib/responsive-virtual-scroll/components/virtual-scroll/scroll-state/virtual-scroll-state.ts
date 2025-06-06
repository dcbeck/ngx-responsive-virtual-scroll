import { EmbeddedViewRef, TemplateRef, TrackByFunction, ViewContainerRef } from "@angular/core";
import { VirtualItem } from "../../../directives/virtual-item.directive";
import { VirtualPlaceholder } from "../../../directives/virtual-placeholder.directive";

export interface VirtualScrollState<T> {

    readonly items: T[];
    readonly renderedItems: T[];
    readonly viewCache: number | boolean;
    readonly minIndex: number;
    readonly maxIndex: number;
    readonly lastScrollOffset: VirtualScrollState.Point;
    readonly trackBy: TrackByFunction<T>;
    readonly gridList: boolean;

    readonly virtualItem: VirtualItem<T>;
    readonly viewContainerRef: ViewContainerRef;
    readonly placeholderTemplate: TemplateRef<VirtualPlaceholder.ViewContext<T>>;
    readonly cachedViews: VirtualScrollState.ViewInfo<T>[];
    readonly renderedViews: VirtualScrollState.ViewInfo<T>[];
    
    getCachedView(index: number, item: T): VirtualScrollState.ViewInfo<T> | undefined;
    getRenderedView(index: number, item: T): VirtualScrollState.ViewInfo<T> | undefined;

    deleteCachedView(index: number, item: T): boolean;
    deleteRenderedView(index: number, item: T): boolean;

    setCachedView(view: VirtualScrollState.ViewInfo<T>): void;
    setRenderedView(view: VirtualScrollState.ViewInfo<T>): void;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VirtualScrollState {

    export interface Point {
        x: number;
        y: number;
    }

    export interface ViewInfo<T> {
        viewRef: EmbeddedViewRef<VirtualItem.ViewContext<T>>;
        item: T;
        itemIndex: number;
        placeholder?: boolean;
    }

    export type ViewRecord<T> = Map<unknown, ViewInfo<T>>;
}