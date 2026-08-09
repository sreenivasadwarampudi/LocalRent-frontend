import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CATEGORY_GROUPS } from '../../categories';
import { RentalCategory } from '../../models';
import { AuthService, UserResponse } from '../../services/auth.service';
import { GeolocationService } from '../../services/geolocation.service';
import { ListingService } from '../../services/listing.service';
import { PHONE_PATTERN } from '../../validators';

@Component({
  selector: 'app-listing-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './listing-form.component.html',
  styleUrl: './listing-form.component.css'
})
export class ListingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly listings = inject(ListingService);
  private readonly geo = inject(GeolocationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('termsContainer') termsContainer!: ElementRef<HTMLDivElement>;

  readonly listingId = this.route.snapshot.paramMap.get('id');
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);
  readonly locating = signal(false);

  // Phone Modal Signals
  readonly showPhoneModal = signal(false);
  readonly phoneLoading = signal(false);
  readonly phoneError = signal<string | null>(null);

  // Terms & Conditions Modal Signals
  readonly showTermsModal = signal(false);
  readonly hasScrolledToBottom = signal(false);

  readonly categoryGroups = CATEGORY_GROUPS;

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
    available: [true],
    acceptTerms: [false, [Validators.requiredTrue]]
  });

  readonly phoneForm = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
  });

  constructor() {
    if (this.listingId) {
      this.listings.get(this.listingId).subscribe({
        next: (listing) => this.form.patchValue(listing),
        error: (err) => this.error.set(err?.error?.message ?? 'Could not load listing')
      });
    }
  }

  // Intercept direct checkbox click if terms aren't accepted yet
  onCheckboxClick(event: MouseEvent): void {
    if (!this.form.controls.acceptTerms.value) {
      event.preventDefault();
      this.openTermsModal();
    }
  }

  openTermsModal(): void {
    this.showTermsModal.set(true);
    this.hasScrolledToBottom.set(false);

    setTimeout(() => {
      if (this.termsContainer?.nativeElement) {
        const el = this.termsContainer.nativeElement;
        if (el.scrollHeight <= el.clientHeight) {
          this.hasScrolledToBottom.set(true);
        }
      }
    }, 100);
  }

  onTermsScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const isBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 5;
    if (isBottom) {
      this.hasScrolledToBottom.set(true);
    }
  }

  acceptAndClose(): void {
    this.form.controls.acceptTerms.setValue(true);
    this.form.controls.acceptTerms.markAsTouched();
    this.showTermsModal.set(false);
  }

  closeTermsModal(): void {
    this.showTermsModal.set(false);
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
      this.error.set('Fill all required fields, accept terms, and provide location.');
      return;
    }

    this.auth.getCurrentUser().subscribe({
      next: (user: UserResponse) => {
        if (!user?.phone) {
          this.phoneError.set(null);
          this.showPhoneModal.set(true);
        } else {
          this.executeSave();
        }
      },
      error: () => {
        this.executeSave();
      }
    });
  }

  private executeSave(): void {
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
        const errorMsg = err?.error?.message ?? '';
        if (errorMsg.includes('PHONE_REQUIRED')) {
          this.phoneError.set(null);
          this.showPhoneModal.set(true);
        } else {
          this.error.set(errorMsg || 'Could not save the listing');
        }
      }
    });
  }

  savePhoneAndProceed(): void {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    this.phoneLoading.set(true);
    this.phoneError.set(null);

    const newPhone = this.phoneForm.controls.phone.value;

    this.auth.updatePhone(newPhone).subscribe({
      next: () => {
        this.phoneLoading.set(false);
        this.showPhoneModal.set(false);
        this.executeSave();
      },
      error: (err) => {
        this.phoneLoading.set(false);
        this.phoneError.set(err?.error?.message ?? 'Failed to save mobile number');
      }
    });
  }

  closePhoneModal(): void {
    this.showPhoneModal.set(false);
  }
}