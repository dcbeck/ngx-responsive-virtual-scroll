# NgxResponsiveVirtualScroll

## Overview

This library provides efficient rendering of large datasets in a list or grid layout within Angular applications.
It utilizes virtual scrolling techniques to only render the visible portion of the grid, improving performance and reducing memory consumption.

## Features

- 🚀 **Optimized Performance:** Renders only visible grid items to minimize memory usage
- 📊 **Large Dataset Support:** Efficiently handles massive data collections
- 🎨 **Flexible Grid Configuration:** Customizable layout and styling options
- 📱 **Responsive Design:** Dynamically adjusts grid based on viewport size
- 🔄 **Resize Handling:** Auto-scroll and column count change detection

## Demo Page

👉 [Live Demo](https://dcbeck.github.io/ngx-responsive-virtual-scroll-demo/)


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
    (columnCountChange)="handleChange($event)"
>
  <ng-template let-item let-row="row" let-column="column">
    <!-- Define your cell here -->
    <!-- Access data item properties with {{item}}  -->
    <!-- Access row and column index of current item -->
  </ng-template>
</ngx-responsive-virtual-scroll>
```

## API Reference

### Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `[items]` | `Observable<any[]>` or `any[]` | - | Data source for rendering |
| `[type]` | `'list'` or `'grid'` | `'grid'` | Layout type |
| `[itemGap]` | `number` | `0` | Spacing between items |
| `[gridMaxColumns]` | `number` | `undefined` | Maximum grid columns |
| `[gridItemWidth]` | `number` | `200` | Width of grid items |
| `[rowHeight]` | `number` | - | Height of each row |
| `[stretchItems]` | `boolean` | `false` | Stretch items to fill space |
| `[autoScrollOnResize]` | `boolean` | `false` | Scroll to last focused item on resize |

### Outputs

| Event | Type | Description |
|-------|------|-------------|
| `(columnCountChange)` | `number` | Triggered when column count changes |

