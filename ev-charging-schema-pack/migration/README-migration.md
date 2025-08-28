# EV Charging → Beckn V2 Item (Migration)

## Goal
Keep the API bound to core **Item**; move EV specifics into **`beckn:attributes`** with JSON-LD context. Maintain semantic equivalence via JSON-LD (e.g., `ev:stationId` ≡ `beckn:id`).

## Steps
1. **Prepare inputs**
   - Old EV Charging network payloads (search/discover responses or provider catalogs).
   - Convert YAML → JSON if needed.

2. **Run transform (jq)**
   ```bash
   # Requires yq (for YAML→JSON) and jq
   yq -oj old-ev.yaml | jq -f migration/jq/transform_ev_old_to_item_v2.jq > new-items.json
   ```

3. **Quick checks (jq)**
   ```bash
   jq -f migration/jq/basic_validate_ev_item_attributes.jq new-items.json
   ```

4. **Schema validation (AJV)**
   ```bash
   npx ajv-cli validate      -s item-attributes.schema.json      -d 'new-items.json#/catalogs/0/beckn:items/0/beckn:attributes'      --config validation/ajv-config.json
   ```

5. **OAS lint (Spectral)**
   ```bash
   npx @stoplight/spectral-cli lint openapi/discover-api-openapi.yaml -r validation/spectral.yaml
   ```

## Mapping Highlights
- `StationId` → `Item.beckn:id`. Also declared equivalence in `schema-context.jsonld` (`ev:stationId` ≡ `beckn:id`).
- Station geodata → `Item.beckn:locations[]` (core).
- EV specifics (connector/current/power/tariff/availability) → `Item.beckn:attributes`.

## Notes
- Keep `additionalProperties: true` initially; tighten after a few iterations.
- JSONPath filters use **RFC 9535**. Document any geo/regex extensions separately.
