# Driver Discovery Demo - Beckn CDS

A demonstration app showcasing Beckn Gen2 + Catalogue Discovery Service (CDS) capabilities for the driver/job matching use case.

## Features

- **NLP-based Discovery**: Natural language search via `message.text_search`
- **JSONPath-based Discovery**: Machine-generated filters via `message.filters.expression`
- **GeoJSON-based Discovery**: Location + radius search via `message.spatial[]`
- **Role Toggle**: Search as Provider (finding drivers) or Driver (finding jobs)
- **Interactive Map**: OpenStreetMap visualization with Leaflet
- **Sample Data Generator**: 200 driver candidates + 200 job postings
- **Debug Panel**: View exact request/response payloads

## Architecture

- **Frontend**: Vite + React
- **Map**: Leaflet + OpenStreetMap
- **CDS Integration**: Direct browser calls to `https://34.93.141.21.sslip.io`
- **Output**: Static build (`npm run build` → `dist/`)

## Beckn Protocol Mapping

### Discover API (GET /beckn/discover)
- **NLP**: `message.text_search` → CDS NLP engine
- **JSONPath**: `message.filters.expression` → RFC 9535 JSONPath
- **Geo**: `message.spatial[].op='s_dwithin'` → GeoJSON Point + distanceMeters

### Publish API (POST /beckn/v2/catalog/publish)
- Publishes 2 catalogues (drivers + jobs) with 400 items total

## Quick Start

### 1. Install Dependencies
```bash
cd driver-discovery-demo
npm install
```

### 2. Start Proxy Server (Required for CORS)
The CDS server doesn't allow direct browser requests due to CORS restrictions. Start the proxy server first:

```bash
npm run proxy
```

This starts a local proxy at `http://localhost:3100` that forwards requests to the CDS.

### 3. Start Dev Server
In a **new terminal**, start the Vite dev server:

```bash
npm run dev
```

Open http://localhost:3000 (or the port shown in the terminal)

### 4. Enter CDS API Key
Paste your `x-api-key` value in the header input.

### 4. Load Sample Data (optional)
- Click **"Load Sample Catalogue"** tab
- Click **"Generate & Publish Sample Data"**
- Wait for ACK

### 5. Run Discovery Queries
Switch to **"Discover"** tab and try the example queries below.

---

## 2-Minute Demo Script (for Partner Onboarding)

### Demo Preparation
1. Open app at http://localhost:3000
2. Ensure API key is entered
3. (Optional) Pre-publish sample catalogues

### Demo Flow

#### **Step 1: Role Context (15 sec)**
> "This demo shows how Beckn CDS enables discovery across two roles:
> - **Provider** searches for driver candidates
> - **Driver** searches for job opportunities
>
> We'll use the same unified CDS endpoint for both."

#### **Step 2: NLP Discovery (45 sec)**
- **Role**: Provider → Drivers
- **Query**: `drivers in Koramangala, Bengaluru, with <30000 salary expectation`
- Click **Search**
- **Show**:
  - Results list (cards with driver details)
  - Map with pins
  - Click **Debug panel** → show `message.text_search` payload

> "The CDS NLP engine parsed natural language and returned matching drivers. Notice the request shows `text_search` field—this is pure NLP, no manual filter building."

#### **Step 3: JSONPath Discovery (30 sec)**
- Click **Show Advanced Filters**
- **JSONPath**: `$[?(@['beckn:itemAttributes']['driver:policeVerificationStatus'] == 'VERIFIED' && @['beckn:itemAttributes']['driver:experienceYears'] > 8)]`
- Click **Search**
- **Show**: filtered results + request payload with `message.filters.expression`

> "Here we use a machine-generated JSONPath expression for precise filtering—useful for automated matching systems."

#### **Step 4: Geo Discovery (30 sec)**
- **Lat**: `12.9352`
- **Lon**: `77.6245`
- **Radius**: `5` (km)
- Click **Search**
- **Show**: map centered on Koramangala with nearby drivers

> "GeoJSON-based discovery uses `message.spatial` with `s_dwithin` operator—perfect for proximity-based matching."

#### **Step 5: Switch Role (10 sec)**
- Toggle to **Driver → Jobs**
- **Query**: `bus driving jobs in Bellary with 4+ star rating`
- Click **Search**
- **Show**: job results on map

> "Same CDS, different role—drivers can discover job opportunities using the exact same discovery modes."

---

## Example Queries

### Provider → Drivers (Find Driver Candidates)

#### NLP Queries
```
drivers in Koramangala, Bengaluru, with <30000 salary expectation
drivers with valid police verification status
drivers with more than 8 years of experience in operating public buses
```

#### JSONPath Filters
```jsonpath
$[?(@['beckn:itemAttributes']['driver:salaryExpectation'] < 30000)]
$[?(@['beckn:itemAttributes']['driver:policeVerificationStatus'] == 'VERIFIED')]
$[?(@['beckn:itemAttributes']['driver:busExperienceYears'] > 5)]
```

#### Geo Filters
- **Koramangala**: Lat `12.9352`, Lon `77.6245`, Radius `5` km
- **Bangalore City**: Lat `12.9716`, Lon `77.5946`, Radius `10` km

### Driver → Jobs (Find Job Opportunities)

#### NLP Queries
```
bus driving jobs in Bellary with 4+ star rating
jobs requiring 8+ years of experience and paying more than 25000
jobs in Bangalore requiring police verification cleared drivers
```

#### JSONPath Filters
```jsonpath
$[?(@['beckn:itemAttributes']['job:salaryOffered'] > 25000)]
$[?(@['beckn:itemAttributes']['job:requiresPoliceVerification'] == true)]
$[?(@['beckn:itemAttributes']['job:minExperienceYears'] >= 8)]
```

#### Geo Filters
- **Bellary**: Lat `15.1394`, Lon `76.9214`, Radius `10` km

---

## Domain Schema

See `schemas/driver-attributes.yaml` for complete OpenAPI schema definitions.

### DriverCandidateAttributes
Attached to Beckn Item via `beckn:itemAttributes`:
- `driver:salaryExpectation` (number)
- `driver:policeVerificationStatus` (VERIFIED | NOT_VERIFIED | EXPIRED)
- `driver:experienceYears` (number)
- `driver:vehicleCategory` (BUS | TAXI | TRUCK)
- `driver:busExperienceYears` (number)
- `driver:homeLocation` (geo: GeoJSON Point + addressLocality)

### DriverJobDescriptionAttributes
- `job:salaryOffered` (number)
- `job:requiresPoliceVerification` (boolean)
- `job:minExperienceYears` (number)
- `job:vehicleCategoryRequired` (BUS | TAXI | TRUCK)
- `job:jobLocation` (geo: GeoJSON Point + addressLocality)
- `job:employerRating` (0-5)

---

## Build for Production

```bash
npm run build
```

Output: `dist/` folder containing static HTML/CSS/JS files.

You can host these on any static server or open `dist/index.html` directly in a browser (note: CDS API calls will only work if CORS is enabled on the CDS endpoint).

---

## File Structure

```
driver-discovery-demo/
├── README.md                          # This file
├── package.json                       # Dependencies
├── vite.config.js                     # Vite config
├── index.html                         # Entry HTML
├── schemas/
│   └── driver-attributes.yaml         # OpenAPI attribute schemas
├── src/
│   ├── main.jsx                       # React entry
│   ├── App.jsx                        # Main app component
│   ├── index.css                      # Styles
│   └── utils/
│       ├── cdsClient.js               # CDS API client
│       └── sampleDataGenerator.js     # Generate 200+200 items
```

---

## CDS Integration Details

### Discover Request Structure
```json
{
  "context": {
    "version": "2.0.0",
    "action": "discover",
    "message_id": "uuid",
    "transaction_id": "uuid",
    "bap_id": "driver-discovery-demo.app",
    "bap_uri": "https://demo.app/callbacks",
    "ttl": "PT30S"
  },
  "message": {
    "text_search": "drivers in Koramangala with <30000 salary",
    "filters": {
      "type": "jsonpath",
      "expression": "$[?(@['beckn:itemAttributes']['driver:salaryExpectation'] < 30000)]"
    },
    "spatial": [{
      "op": "s_dwithin",
      "targets": "$['beckn:itemAttributes']['driver:homeLocation']['geo']",
      "geometry": {
        "type": "Point",
        "coordinates": [77.6245, 12.9352]
      },
      "distanceMeters": 5000
    }]
  }
}
```

### Publish Request Structure
```json
{
  "context": {
    "version": "2.0.0",
    "action": "catalog_publish",
    "message_id": "uuid",
    "transaction_id": "uuid"
  },
  "message": {
    "catalogs": [
      {
        "@context": "...",
        "@type": "beckn:Catalog",
        "beckn:id": "driver-candidates-catalog-001",
        "beckn:items": [ /* 200 drivers */ ]
      },
      {
        "@context": "...",
        "@type": "beckn:Catalog",
        "beckn:id": "driver-jobs-catalog-001",
        "beckn:items": [ /* 200 jobs */ ]
      }
    ]
  }
}
```

---

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Check if CDS allows browser origin requests
2. If not, we can add a simple proxy server (instructions available on request)

### No Results from Discover
1. Ensure catalogues are published first via "Load Sample Catalogue"
2. Check the Debug panel for CDS error responses
3. Verify API key is correct

### Map Not Rendering
1. Ensure Leaflet CSS is loaded (check browser console)
2. Verify items have valid `geo.coordinates` in response

---

## License

MIT

---

## Contact

For questions or support regarding this demo, contact the Beckn protocol team.
