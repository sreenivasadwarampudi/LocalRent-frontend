import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { PHONE_PATTERN } from '../../validators';

declare const google: any;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('termsContainer') termsContainer!: ElementRef<HTMLDivElement>;

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  // Signals to control the Terms & Conditions Modal
  readonly showTermsModal = signal(false);
  readonly hasScrolledToBottom = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    acceptTerms: [false, [Validators.requiredTrue]]
  });

  // Intercept direct checkbox clicks when not accepted yet
  onCheckboxClick(event: MouseEvent): void {
    if (!this.form.controls.acceptTerms.value) {
      event.preventDefault();
      this.openTermsModal();
    }
  }

  openTermsModal(): void {
    this.showTermsModal.set(true);
    this.hasScrolledToBottom.set(false);

    // Check if the terms text container has no scrollbar (fits completely)
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
    // Set scrolled state true when scroll reaches within 5px of the bottom
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

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.auth.signup(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/listings/new']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Sign up failed');
      }
    });
  }

  signupWithGoogle(): void {
    const termsControl = this.form.controls.acceptTerms;

    // Trigger modal if terms aren't accepted yet
    if (!termsControl.value) {
      this.error.set('Please accept the Terms & Conditions before signing up with Google.');
      this.openTermsModal();
      return;
    }

    if (typeof google === 'undefined' || !google.accounts?.id) {
      this.error.set('Google SDK not loaded. Please refresh the page.');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleCredentialResponse(response),
      use_fedcm_for_prompt: false
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: environment.googleClientId,
          scope: 'email profile openid',
          callback: (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              this.handleGoogleAccessToken(tokenResponse.access_token);
            }
          }
        });
        client.requestAccessToken();
      }
    });
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response.credential;
    if (!idToken) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.googleLogin(idToken).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/listings/new']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google Sign Up failed');
      }
    });
  }

  private handleGoogleAccessToken(accessToken: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.googleLogin(accessToken).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/listings/new']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google Sign Up failed');
      }
    });
  }
}