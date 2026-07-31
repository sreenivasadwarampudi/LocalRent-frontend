import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Listing } from '../../models';
import { ListingService } from '../../services/listing.service';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './listing-detail.component.html'
})
export class ListingDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly listings = inject(ListingService);

  readonly listing = signal<Listing | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.listings.get(id).subscribe({
        next: (listing) => this.listing.set(listing),
        error: (err) => this.error.set(err?.error?.message ?? 'Listing not found')
      });
    }
  }

  mapUrl(listing: Listing): string {
    return `https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=15/${listing.latitude}/${listing.longitude}`;
  }
}
