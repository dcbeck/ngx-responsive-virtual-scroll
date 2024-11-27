import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'ngx-responsive-virtual-scroll-random-photo',
  standalone: true,
  template: ` <img
    [src]="imageUrl()"
    alt="Random Image"
    class="w-full h-full min-h-0 min-w-0 max-w-full max-h-full object-cover"
    loading="lazy"
  />`,
})
export class RandomPhotoComponent {
  seed = input.required<string>();

  imageUrl = computed(
    () => 'assets/img/' + this.selectRandomImage(this.seed(), this.images)
  );

  readonly images = [
    '1-300x200.jpg',
    '1015-300x200.jpg',
    '186-300x200.jpg',
    '210-300x200.jpg',
    '328-300x200.jpg',
    '415-300x200.jpg',
    '484-300x200.jpg',
    '57-300x200.jpg',
    '766-300x200.jpg',
    '784-300x200.jpg',
    '939-300x200.jpg',
    '1001-300x200.jpg',
    '1028-300x200.jpg',
    '192-300x200.jpg',
    '231-300x200.jpg',
    '342-300x200.jpg',
    '417-300x200.jpg',
    '515-300x200.jpg',
    '598-300x200.jpg',
    '772-300x200.jpg',
    '863-300x200.jpg',
    '967-300x200.jpg',
    '1004-300x200.jpg',
    '1061-300x200.jpg',
    '202-300x200.jpg',
    '315-300x200.jpg',
    '35-300x200.jpg',
    '436-300x200.jpg',
    '531-300x200.jpg',
    '642-300x200.jpg',
    '774-300x200.jpg',
    '918-300x200.jpg',
    '988-300x200.jpg',
  ];

  private selectRandomImage(input: string, images: string[]): string {
    const stringValue = this.calculateStringValue(input);
    const index = stringValue % images.length;
    return images[index];
  }

  private calculateStringValue(input: string): number {
    return input.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }
}
