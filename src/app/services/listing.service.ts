import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Listing, ListingRequest, SearchParams } from '../models';

@Injectable({ providedIn: 'root' })
export class ListingService {
  constructor(private readonly http: HttpClient) {}

  search(params: SearchParams): Observable<Listing[]> {
    let httpParams = new HttpParams();
    if (params.category) {
      httpParams = httpParams.set('category', params.category);
    }
    if (params.lat != null && params.lng != null) {
      httpParams = httpParams
        .set('lat', params.lat)
        .set('lng', params.lng)
        .set('radiusKm', params.radiusKm ?? environment.defaultRadiusKm);
    } else if (params.area) {
      httpParams = httpParams.set('area', params.area);
    }
    if (params.maxPrice != null) {
      httpParams = httpParams.set('maxPrice', params.maxPrice);
    }
    return this.http.get<Listing[]>(`${environment.apiBaseUrl}/listings/search`, { params: httpParams });
  }

  myListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${environment.apiBaseUrl}/listings/mine`);
  }

  get(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${environment.apiBaseUrl}/listings/${id}`);
  }

  create(payload: ListingRequest): Observable<Listing> {
    return this.http.post<Listing>(`${environment.apiBaseUrl}/listings`, payload);
  }

  update(id: string, payload: ListingRequest): Observable<Listing> {
    return this.http.put<Listing>(`${environment.apiBaseUrl}/listings/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/listings/${id}`);
  }
}
