import { Injectable } from '@angular/core';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /** Requests the browser location (works on phone and desktop). */
  current(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Location is not supported by this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (error) => reject(new Error(this.describe(error))),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    });
  }

  /** Free-form area name to coordinates via OpenStreetMap Nominatim. */
  async geocode(area: string): Promise<Coordinates | null> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(area)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      return null;
    }
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (!results.length) {
      return null;
    }
    return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
  }

  private describe(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Enter your area manually instead.';
      case error.POSITION_UNAVAILABLE:
        return 'Location unavailable. Enter your area manually instead.';
      case error.TIMEOUT:
        return 'Timed out getting your location. Try again or enter your area.';
      default:
        return 'Could not get your location.';
    }
  }
}
