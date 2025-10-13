# EV Charging — Charging Service Attribute Pack (v1)

This pack defines **attributes only** (no Beckn core objects) for:
- `ChargingServiceAttributes` → attach to Item.attributes
- `ChargingOfferAttributes` → attach to Offer.attributes
- `ChargingSessionAttributes` → attach to Order/Fulfillment attributes
- `ChargingProviderAttributes` → attach to Provider.attributes

## Local Namespace Mapping
The `ev` namespace is mapped **locally**:
```json
{ "ev": "./ev#" }
```
Vocabulary files live in `v1/vocab/` and use the same local mapping.
When publishing, replace `./ev#` with an absolute URL (e.g., `https://schemas.example.org/ev#`).

## Files
- `context.jsonld` — JSON-LD mappings to schema.org & local `ev` namespace
- `attributes.yaml` — OpenAPI 3.1.1 attribute schemas with `x-jsonld`
- `profile.json`, `renderer.json`
- `rules/` — Spectral + JSON Schema (AJV) shims
- `enums/` — unit maps & normalization/default policies
- `tools/` — jq adapters (stubs)
- `examples/` — working examples
- `vocab/` — EV vocabulary (YAML + JSON-LD)