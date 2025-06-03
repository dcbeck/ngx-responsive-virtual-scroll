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
npm install ngx-responsive-virtual-scroll
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
<ngx-responsive-virtual-scroll [items]="data$" [type]="'grid'" [itemGap]="24" [stretchItems]="true" [scrollViewPadding]="24" [autoScrollOnResize]="true" [gridMaxColumns]="4" [gridItemWidth]="200" [rowHeight]="200" [renderAdditionalRows]="1" (columnCountChange)="handleChange($event)">
  <div *ngxResponsiveVirtualScrollItem="let item">
    Item: {{item.name}}
    <!-- Define your cell here -->
    <!-- Access data item properties with {{item}}  -->
    <!-- Access row and column index of current item -->
  </div>
</ngx-responsive-virtual-scroll>
```

### Inputs

#### `[rowHeight]`

- **Type:** number (required)
- **Default value:** `undefined`
- **Description:** Height of each row in the grid or list layout.

#### `[items]`

- **Type:** Array<any> (required)
- **Description:** The array of items to be rendered in the virtual scroll.

#### `[type]`

- **Type:** 'list' | 'grid' (optional)
- **Default value:** `'grid'`
- **Description:** Layout type for the virtual scroll. Can be `'list'` or `'grid'`.

#### `[itemGap]`

- **Type:** number (optional)
- **Default value:** `0`
- **Description:** Gap in pixels between each item in the grid layout.

#### `[stretchItems]`

- **Type:** boolean (optional)
- **Default value:** `false`
- **Description:** Whether to stretch items to fill the available space in the grid layout. Items may vary in size due to stretching even if their width is set.

#### `[scrollViewPadding]`

- **Type:** number | {x: number, y: number} | {top: number, bottom: number, left: number, right: number} (optional)
- **Default value:** `0`
- **Description:** Padding for the scroll view. Accepts a single number, an object with x/y, or an object with top/left/bottom/right.

#### `[autoScrollOnResize]`

- **Type:** boolean (optional)
- **Default value:** `false`
- **Description:** Whether to automatically scroll to the last focused item when the viewport is resized.

#### `[gridMaxColumns]`

- **Type:** number (optional)
- **Default value:** `undefined`
- **Description:** Maximum number of columns in the grid layout. Leave undefined for no limit.

#### `[gridItemWidth]`

- **Type:** number (optional)
- **Default value:** `200`
- **Description:** Width of each grid item in pixels.


#### `[bufferLength]`

- **Type:** number (optional)
- **Default value:** `1`
- **Description:** Number of viewport heights to buffer before and after the visible area.

#### `[viewCache]`

- **Type:** number | boolean (optional)
- **Default value:** `false`
- **Description:** Number of views to cache, or `true` for unlimited, or `false` for no cache.

#### `[trackBy]`

- **Type:** TrackByFunction<any> (optional)
- **Default value:** identity function
- **Description:** Custom trackBy function for item identity.

#### `[scrollDebounceMs]`

- **Type:** number (optional)
- **Default value:** `50`
- **Description:** Debounce time in ms for scroll events.

### Outputs

#### `(renderedItemsChange)`

- **Type:** event: any[]
- **Description:** Emits the currently rendered items whenever they change.

#### `(itemsPerRowChange)`

- **Type:** event: number
- **Description:** Emits when the number of items per row changes (e.g., on resize).

### Directive

#### ` <div *ngxResponsiveVirtualScrollItem="let item"></div>`

- **Description:** Define the template for each item in the virtual scroll.
- **Access data item properties:** Use `{{item}}`.
- **Access row, column, and index of the current item:** Use `let-row="row"`, `let-column="column"`, and `let-index="index"` respectively.

Example:

```html
<ngx-responsive-virtual-scroll [items]="data" [rowHeight]="200" [gridItemWidth]="200" [type]="'grid'">
  <div *ngxResponsiveVirtualScrollItem="let item">Item: {{item.name}}</div>
</ngx-responsive-virtual-scroll>
```

### Notes

- The component supports both list and grid layouts.
- All inputs are reactive and can be changed at runtime.
- The template context provides `item`, `row`, `column`, and `index` for each rendered item.
- For advanced use, see the source code and additional examples.
