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
  readonly activeGroup = signal<string>(CATEGORY_GROUPS[0]?.label ?? '');
  readonly priceChips = [300, 500, 1000, 2000];
  readonly descriptionMax = 500;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
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
    this.syncActiveGroup();
    if (this.listingId) {
      this.listings.get(this.listingId).subscribe({
        next: (listing) => {
          this.form.patchValue(listing);
          this.syncActiveGroup();
        },
        error: (err) => this.error.set(err?.error?.message ?? 'Could not load listing')
      });
    }
  }

  // ---------- Category picker ----------
  get visibleOptions() {
    return this.categoryGroups.find((g) => g.label === this.activeGroup())?.options ?? [];
  }

  selectGroup(label: string): void {
    this.activeGroup.set(label);
  }

  selectCategory(value: string): void {
    this.form.controls.category.setValue(value as RentalCategory);
  }

  private syncActiveGroup(): void {
    const current = this.form.controls.category.value;
    const group = this.categoryGroups.find((g) => g.options.some((o) => o.value === current));
    if (group) {
      this.activeGroup.set(group.label);
    }
  }

  iconFor(value: string): string {
    const v = (value ?? '').toLowerCase();
    if (v.includes('bike') || v.includes('scooter') || v.includes('moped')) return '🏍️';
    if (v.includes('tractor') || v.includes('harvest') || v.includes('farm')) return '🚜';
    if (v.includes('car') || v.includes('jeep') || v.includes('suv')) return '🚗';
    if (v.includes('auto') || v.includes('truck') || v.includes('van') || v.includes('bus')) return '🚚';
    if (v.includes('flat') || v.includes('house') || v.includes('room') || v.includes('apartment') || v.includes('pg')) return '🏠';
    if (v.includes('shop') || v.includes('office') || v.includes('hall')) return '🏢';
    if (v.includes('tool') || v.includes('drill') || v.includes('equipment')) return '🔧';
    if (v.includes('camera') || v.includes('photo')) return '📷';
    if (v.includes('cycle') || v.includes('bicycle')) return '🚲';
    return '📦';
  }

  get selectedCategoryLabel(): string {
    const current = this.form.controls.category.value;
    for (const g of this.categoryGroups) {
      const found = g.options.find((o) => o.value === current);
      if (found) return found.label;
    }
    return 'Category';
  }

  // ---------- Price chips ----------
  setPrice(amount: number): void {
    this.form.controls.pricePerDay.setValue(amount);
    this.form.controls.pricePerDay.markAsDirty();
  }

  // ---------- Progress & preview ----------
  get progress(): number {
    const v = this.form.getRawValue();
    const checks = [
      !!v.title?.trim(),
      Number(v.pricePerDay) > 0,
      !!v.areaName?.trim(),
      v.latitude !== null && v.longitude !== null,
      !!v.description?.trim(),
      v.acceptTerms
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  get hasLocation(): boolean {
    const v = this.form.getRawValue();
    return v.latitude !== null && v.longitude !== null;
  }

  get descriptionLength(): number {
    return this.form.controls.description.value?.length ?? 0;
  }

  // ---------- Terms modal ----------
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

  // ---------- Location ----------
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
    this.error.set(null);
    const ok = await this.geocodeTypedArea();
    if (!ok) {
      this.error.set('Could not find that area. Check the area and city, or use your current location.');
    }
  }

  /** Looks up coordinates from the typed area/city. Returns true when location was set. */
  private async geocodeTypedArea(): Promise<boolean> {
    const raw = this.form.getRawValue();
    const area = [raw.areaName, raw.city].filter(Boolean).join(', ');
    if (!area) {
      this.error.set('Enter an area name first');
      return false;
    }
    this.locating.set(true);
    const coords = await this.geo.geocode(area).catch(() => null);
    this.locating.set(false);
    if (!coords) {
      return false;
    }
    this.form.patchValue({ latitude: coords.latitude, longitude: coords.longitude });
    return true;
  }

  clearLocation(): void {
    this.form.patchValue({ latitude: null, longitude: null });
  }

  // ---------- Submit ----------
  async submit(): Promise<void> {
    // Auto-detect location from the typed area so users never see lat/long
    if (!this.hasLocation && this.form.controls.areaName.value.trim()) {
      await this.geocodeTypedArea();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(
        this.hasLocation
          ? 'Please fill all required fields and accept the terms.'
          : 'We could not pin your location. Tap "Use my current location" or check the area name.'
      );
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