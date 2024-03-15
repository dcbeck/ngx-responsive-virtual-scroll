import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ResponsiveVirtualScrollModule } from 'ngx-responsive-virtual-scroll';

@Component({
  standalone: true,
  imports: [RouterModule, ResponsiveVirtualScrollModule, CommonModule],
  selector: 'ngx-responsive-virtual-scroll-demo',
  templateUrl: './app.component.html',
  styleUrl: './app.component.less',
})
export class AppComponent {
  data$ = Array.from({ length: 1000 }).map((_, i) => i);

  expandSidebar = false;

  handleClick() {
    console.log('clicked');
  }
}
