import { Routes } from '@angular/router';
import { ownerGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'search' },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then((m) => m.SignupComponent)
  },
  {
    path: 'my-listings',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/my-listings/my-listings.component').then((m) => m.MyListingsComponent)
  },
  {
    path: 'listings/new',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/listing-form/listing-form.component').then((m) => m.ListingFormComponent)
  },
  {
    path: 'listings/:id/edit',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./pages/listing-form/listing-form.component').then((m) => m.ListingFormComponent)
  },
  {
    path: 'listings/:id',
    loadComponent: () =>
      import('./pages/listing-detail/listing-detail.component').then((m) => m.ListingDetailComponent)
  },
  { path: '**', redirectTo: 'search' }
];
