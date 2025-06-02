/* eslint-disable @typescript-eslint/no-namespace */
import { Directive, TemplateRef } from '@angular/core';

@Directive({
  standalone: false,
  selector: '[ngxResponsiveVirtualScrollItem]',
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class VirtualItem<T> {
  constructor(
    public readonly templateRef: TemplateRef<VirtualItem.ViewContext<T>>
  ) {}
}

export namespace VirtualItem {
  export type ViewContext<T> = { $implicit: T; index: number };
}


