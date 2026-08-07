import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORY_GROUPS, CATEGORY_OPTIONS, categoryLabel } from '../../categories';
import { Listing, RentalCategory } from '../../models';
import { GeolocationService } from '../../services/geolocation.service';
import { ListingService } from '../../services/listing.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  private readonly listings = inject(ListingService);
  private readonly geo = inject(GeolocationService);

  readonly categoryGroups = CATEGORY_GROUPS;
  readonly popularCategories = CATEGORY_OPTIONS;
  readonly categoryLabel = categoryLabel;

  category: RentalCategory | '' = '';
  area = '';
  radiusKm = 20;
  maxPrice: number | null = null;
  latitude: number | null = null;
  longitude: number | null = null;

  readonly results = signal<Listing[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly error = signal<string | null>(null);
  readonly locationLabel = signal<string | null>(null);

  constructor() {
    void this.search();
  }

  async useMyLocation(): Promise<void> {
    this.error.set(null);
    try {
      const coords = await this.geo.current();
      this.latitude = coords.latitude;
      this.longitude = coords.longitude;
      this.locationLabel.set(
        `Using your location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
      );
      this.search();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  selectCategory(category: RentalCategory | ''): void {
    this.category = category;
    void this.search();
  }

  clearLocation(): void {
    this.latitude = null;
    this.longitude = null;
    this.locationLabel.set(null);
  }

  async search(): Promise<void> {
    this.error.set(null);
    this.loading.set(true);

    let lat = this.latitude;
    let lng = this.longitude;

    // Manually typed area is geocoded so the same 20km radius rule applies.
    if (lat == null && this.area.trim()) {
      const coords = await this.geo.geocode(this.area.trim()).catch(() => null);
      if (coords) {
        lat = coords.latitude;
        lng = coords.longitude;
      }
    }

    this.listings
      .search({
        category: this.category,
        area: this.area.trim() || undefined,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radiusKm: this.radiusKm,
        maxPrice: this.maxPrice ?? undefined
      })
      .subscribe({
        next: (listings) => {
          this.results.set(listings);
          this.loading.set(false);
          this.searched.set(true);
        },
        error: (err) => {
          this.loading.set(false);
          this.searched.set(true);
          this.error.set(err?.error?.message ?? 'Search failed');
        }
      });
  }
}
