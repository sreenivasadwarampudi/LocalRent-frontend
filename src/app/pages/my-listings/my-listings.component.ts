import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Listing } from '../../models';
import { ListingService } from '../../services/listing.service';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './my-listings.component.html'
})
export class MyListingsComponent {
  private readonly listings = inject(ListingService);

  readonly items = signal<Listing[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.listings.myListings().subscribe({
      next: (items) => this.items.set(items),
      error: (err) => this.error.set(err?.error?.message ?? 'Could not load your listings')
    });
  }

  remove(listing: Listing): void {
    if (!confirm(`Delete "${listing.title}"?`)) {
      return;
    }
    this.listings.delete(listing.id).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(err?.error?.message ?? 'Delete failed')
    });
  }
}
