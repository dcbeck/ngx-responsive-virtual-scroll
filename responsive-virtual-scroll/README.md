# NgxResponsiveVirtualScroll

## Overview

This library provides efficient rendering of large datasets in a list or grid layout within Angular applications.
It utilizes virtual scrolling techniques to only render the visible portion of the grid, improving performance and reducing memory consumption.

## Features

- **Virtual scrolling:** Render only the visible portion of the grid for improved performance.
- **Support for large datasets:** Efficiently handle rendering of large datasets without performance degradation.
- **Customizable grid layout:** Configure the grid layout according to your application's requirements.
- **Responsive design:** Automatically adjust grid layout based on the viewport size.

## Installation

To install the NgxResponsiveVirtualScroll Library, you can use npm:

```bash
npm install angular-virtual-scroll-grid
```

## Usage

### 1. Import the module

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ResponsiveVirtualScrollModule } from 'ngx-responsive-virtual-scroll';

@NgModule({
  imports: [BrowserModule, ResponsiveVirtualScrollModule],
  // Other declarations and providers...
})
export class YourAppModule {}
```

### 2. Use the component

```html
<ngx-responsive-virtual-scroll 
    [items]="data$" 
    [type]="'grid'" 
    [itemGap]="24" 
    [stretchItems]="true" 
    [scrollViewPadding]="24" 
    [autoScrollOnResize]="true" 
    [gridMaxColumns]="4" 
    [gridItemWidth]="200" 
    [rowHeight]="200"
    [renderAdditionalRows]="1"
    (columnCountChange)="handleChange($event)"
>
  <ng-template let-item let-row="row" let-column="column">
    <!-- Define your cell here -->
    <!-- Access data item properties with {{item}}  -->
    <!-- Access row and column index of current item -->
  </ng-template>
</ngx-responsive-virtual-scroll>
```

### Inputs

#### `[rowHeight]`

- **Type:** number (required)
- **Default value:** `undefined`
- **Description:** Height of each row in the grid layout.

#### `[items]`

- **Type:** Observable<Array<any[]>> | Array<any[]> (required)
- **Description:** An Array or Observable of items to be rendered in the virtual scroll.

#### `[type]`

- **Type:** 'list' | 'grid' (optional)
- **Default value:** `'grid'`
- **Description:** Type of layout for the virtual scroll. Can be `'list'` or `'grid'`.

#### `[itemGap]`

- **Type:** number (optional)
- **Default value:** `0`
- **Description:** Gap in pixel between each item in the grid layout.

#### `[stretchItems]`

- **Type:** boolean (optional)
- **Default value:** `false`
- **Description:** Whether to stretch items to fill the available space in the grid layout. Note: Items can vary in size due to stretching even if their item width is set

#### `[scrollViewPadding]`

- **Type:** number | {x: number, y: number} | {top: number, bottom: number, left: number, right: number}
- **Default value:** `0`
- **Description:** Padding for the scroll view.

#### `[autoScrollOnResize]`

- **Type:** boolean (optional)
- **Default value:** `false`
- **Description:** Whether to automatically scroll to the last focused item when the viewport is resized.

#### `[gridMaxColumns]`

- **Type:** number (optional)
- **Default value:** `undefined`
- **Description:** Maximum number of columns in the grid layout. Undefined, when you don't want to limit the max number of columns

#### `[gridItemWidth]`

- **Type:** number (optional)
- **Default value:** `200`
- **Description:** Width of each grid item.

#### `[renderAdditionalRows]`

- **Type:** number (optional)
- **Default value:** `1`
- **Description:** Number of rows which are rendered before offscreen to improve lazy loading.

### Template

#### `<ng-template let-item let-row="row" let-column="column">`

- **Description:** Define the template for each item in the virtual scroll.
- **Access data item properties:** Use `{{item}}`.
- **Access row and column index of current item:** Use `let-row="row"` and `let-column="column"` respectively.



### Outputs

#### `(columnCountChange)`

- **Type:** event: number
- **Description:** Outputs when the number of columns change (for example when the viewport was resized)


