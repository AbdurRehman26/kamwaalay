# Database Seed Data

This directory contains JSON files used for seeding the database.

## File Structure

- `cities.json` - List of cities with coordinates (filters for Pakistan cities with country code "PK")
- `locations/areas/karachi_locations.json` - List of Karachi areas/locations

## Usage

These files are automatically loaded by the seeders:
- `CitySeeder` - Loads cities from `cities.json`
- `KarachiLocationsSeeder` - Loads Karachi locations from `karachi_locations.json`

## File Formats

### cities.json
```json
[
  {
    "name": "Karachi",
    "lat": "24.8607",
    "lng": "67.0011",
    "country": "PK",
    "admin1": "05",
    "admin2": "10300608"
  }
]
```

### karachi_locations.json
```json
[
  {
    "name": "DHA Phase 6",
    "latitude": 24.9056,
    "longitude": 67.0822,
    "address": "Optional address"
  }
]
```

## Notes

- These files are tracked in git and should be committed
- The seeders will automatically find these files in this directory
- Files in `storage/app/data/` are not tracked in git and are for local development only

