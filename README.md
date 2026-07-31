# LocalRent Frontend

Angular 18 (standalone components) frontend for LocalRent — local rentals for bikes, cars and properties.

## Requirements

- Node.js 18.19+ / 20+
- The [LocalRent backend](https://github.com/sreenivasadwarampudi/LocalRent-backend) running on http://localhost:8080

## Run

```bash
npm install
npm start
```

App runs on http://localhost:4200. The API base URL lives in `src/environments/environment.ts`.

## Features

- Sign up as **owner** (post rentals) or **seeker** (find rentals); JWT stored in `localStorage`.
- Owners: post/edit/delete listings, set location by capturing browser geolocation, geocoding the typed
  area (OpenStreetMap Nominatim), or entering latitude/longitude manually.
- Seekers: search by category, price and either "Use my location" (default 20 km radius, adjustable) or a
  typed area name. Results show distance in km, nearest first.

## Build

```bash
npm run build
```
