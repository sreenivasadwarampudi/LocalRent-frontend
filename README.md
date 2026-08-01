# LocalRent Frontend

Angular 18 (standalone components) frontend for LocalRent — local rentals for bikes, cars and properties.

## Requirements

- Node.js 18.19+, 20.11+ or 22 (see `.nvmrc`). Node 23/24 are **not** supported by Angular 18 and
  will fail with "The current version of Node is not supported by Angular".
- The [LocalRent backend](https://github.com/sreenivasadwarampudi/LocalRent-backend) running on http://localhost:8080

## Run

```bash
npm install
npm start
```

Run `npm start` (or `npx ng serve`) rather than a globally installed `ng`: the project pins Angular CLI
18 locally, and an older global CLI (e.g. 17) reports its own version and can fail to build this project.

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
