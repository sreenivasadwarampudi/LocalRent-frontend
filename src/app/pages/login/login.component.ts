
import { Component, inject, NgZone, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { PHONE_PATTERN } from '../../validators';

declare const google: any;
declare const FB: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required]]
  });

  // Phone and password login
  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Login failed. Please try again.');
      }
    });
  }

  // Google login
  loginWithGoogle(): void {
    if (this.loading()) {
      return;
    }

    if (typeof google === 'undefined' || !google.accounts?.id) {
      this.error.set('Google SDK not loaded. Please refresh the page.');
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) =>
        this.handleGoogleCredentialResponse(response),
      use_fedcm_for_prompt: false
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: environment.googleClientId,
          scope: 'email profile openid',
          callback: (tokenResponse: any) => {
            this.zone.run(() => {
              if (tokenResponse.access_token) {
                this.handleGoogleAccessToken(
                  tokenResponse.access_token
                );
              } else {
                this.error.set('Google login was cancelled or failed.');
              }
            });
          }
        });

        client.requestAccessToken();
      }
    });
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response?.credential;

    if (!idToken || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.googleLogin(idToken).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google login failed.');
      }
    });
  }

  private handleGoogleAccessToken(accessToken: string): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.googleLogin(accessToken).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google login failed.');
      }
    });
  }

  // Facebook login
  loginWithFacebook(): void {
    if (this.loading()) {
      return;
    }

    if (typeof FB === 'undefined') {
      this.error.set('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    // Call FB.login directly from the click handler to avoid popup blockers.
    FB.login(
      (response: any) => {
        this.zone.run(() => {
          const token = response?.authResponse?.accessToken;

          if (!token) {
            this.error.set('Facebook login was cancelled.');
            return;
          }

          if (this.loading()) {
            return;
          }

          this.loading.set(true);
          this.error.set(null);

          this.auth.facebookLogin(token).subscribe({
            next: () => {
              this.loading.set(false);
              void this.router.navigate(['/my-listings']);
            },
            error: (err) => {
              this.loading.set(false);
              this.error.set(
                err?.error?.message ?? 'Facebook login failed.'
              );
            }
          });
        });
      },
      { scope: 'public_profile,email' }
    );
  }
}