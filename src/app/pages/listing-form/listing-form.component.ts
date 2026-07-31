import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalCategory } from '../../models';
import { GeolocationService } from '../../services/geolocation.service';
import { ListingService } from '../../services/listing.service';

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './listing-form.component.html'
})
export class ListingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly listings = inject(ListingService);
  private readonly geo = inject(GeolocationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly listingId = this.route.snapshot.paramMap.get('id');
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly locating = signal(false);

  readonly categories: RentalCategory[] = ['BIKE', 'CAR', 'PROPERTY'];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: [''],
    category: ['BIKE' as RentalCategory, [Validators.required]],
    pricePerDay: [0, [Validators.required, Validators.min(0)]],
    areaName: ['', [Validators.required]],
    city: [''],
    addressLine: [''],
    latitude: [null as number | null, [Validators.required]],
    longitude: [null as number | null, [Validators.required]],
    contactPhone: [''],
    available: [true]
  });

  constructor() {
    if (this.listingId) {
      this.listings.get(this.listingId).subscribe({
        next: (listing) => this.form.patchValue(listing),
        error: (err) => this.error.set(err?.error?.message ?? 'Could not load listing')
      });
    }
  }

  async captureLocation(): Promise<void> {
    this.error.set(null);
    this.locating.set(true);
    try {
      const coords = await this.geo.current();
      this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.locating.set(false);
    }
  }

  async locateArea(): Promise<void> {
    const area = [this.form.getRawValue().areaName, this.form.getRawValue().city]
      .filter(Boolean)
      .join(', ');
    if (!area) {
      this.error.set('Enter an area name first');
      return;
    }
    this.locating.set(true);
    const coords = await this.geo.geocode(area).catch(() => null);
    this.locating.set(false);
    if (!coords) {
      this.error.set('Could not find that area. Enter latitude and longitude manually.');
      return;
    }
    this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Fill all required fields, including the location.');
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      ...value,
      latitude: value.latitude as number,
      longitude: value.longitude as number
    };
    this.saving.set(true);
    this.error.set(null);
    const request$ = this.listingId
      ? this.listings.update(this.listingId, payload)
      : this.listings.create(payload);
    request$.subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? 'Could not save the listing');
      }
    });
  }
}
