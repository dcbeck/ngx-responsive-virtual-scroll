import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResponsiveVirtualScrollComponent } from './responsive-virtual-scroll.component';

describe('ResponsiveVirtualScrollComponent', () => {
  let component: ResponsiveVirtualScrollComponent<unknown>;
  let fixture: ComponentFixture<ResponsiveVirtualScrollComponent<unknown>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsiveVirtualScrollComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveVirtualScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
