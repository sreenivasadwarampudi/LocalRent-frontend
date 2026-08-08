import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { PHONE_PATTERN } from '../../validators';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required]]
  });

  submit(): void {
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
        this.error.set(err?.error?.message ?? 'Login failed');
      }
    });
  }

  loginWithGoogle(): void {
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
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google Login failed');
      }
    });
  }

  private handleGoogleAccessToken(accessToken: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.auth.googleLogin(accessToken).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Google Login failed');
      }
    });
  }
}