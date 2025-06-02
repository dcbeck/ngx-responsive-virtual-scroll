import { Directive, TemplateRef } from '@angular/core';

@Directive({
  standalone: false,
  selector: '[ngxResponsiveVirtualScrollItemPlaceholder]',
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class VirtualPlaceholder<T> {
  constructor(
    public readonly templateRef: TemplateRef<VirtualPlaceholder.ViewContext<T>>
  ) {}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace VirtualPlaceholder {
  export type ViewContext<T> = { $implicit: T; index: number };
}
