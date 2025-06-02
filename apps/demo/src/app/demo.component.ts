import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  TrackByFunction,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ResponsiveVirtualScrollModule } from 'ngx-responsive-virtual-scroll';
import { debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GridItemComponent } from './grid-item';
import { RandomPhotoComponent } from './random-photo.component';
import { DemoStateService } from './demo.state.service';
import { StarIconComponent } from './star-icon.component';
import { ScrollGridItem } from './types';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    ResponsiveVirtualScrollModule,
    GridItemComponent,
    CommonModule,
    RandomPhotoComponent,
    FormsModule,
    StarIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'demo-app',
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.less',
})
export class DemoComponent implements OnInit {
  constructor(
    public readonly state: DemoStateService,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute
  ) {
    this.state.gridData$
      .pipe(takeUntilDestroyed(), debounceTime(50))
      .subscribe(() => {
        this.state.isGridVisible.set(true);
        this.cdr.markForCheck();
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed())
      .subscribe((paramMap) => {
        this.state.updateDataByParmMap(paramMap);
      });
  }

  isMobileView = false;
  isSettingsMenuShownInMobile = false;
  private mobileBreakpoint = 768 + 200;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setMobileView(event);
  }

  ngOnInit() {
    // Initial check on component initialization
    this.setMobileView();
  }

  setFavored(favored: boolean, itemId: string) {
    this.state.setFavored(favored, itemId);
  }

  setMobileView(event?: Event) {
    if (event) {
      const width = (event.target as Window).innerWidth;
      this.isMobileView = width < this.mobileBreakpoint;
    } else {
      this.isMobileView = window.innerWidth < this.mobileBreakpoint;
    }
    this.cdr.markForCheck();
  }

  selectItem(item: ScrollGridItem) {
    this.state.selectedItem.set(item);
    this.cdr.markForCheck();
  }

  trackByFn: TrackByFunction<ScrollGridItem> = (index: number, item: ScrollGridItem) => `${item.id}_${item.isFavored}`;
}
