## EV Attributes Validator (AJV)

Validate instances against EV charging attribute pack classes defined in `attributes.yaml` (OpenAPI 3.1). Supports remote `$ref` dereferencing and JSON/YAML inputs.

### Install

From the repo root (already bootstrapped here):

```bash
cd validator
npm install
```

### CLI Usage

```bash
node bin/validate \
  --attributes ../profiles/charging_service/v1/attributes.yaml \
  --class ChargingServiceAttributes \
  --data ../profiles/charging_service/v1/examples/item-example.json
```

Exits with code 0 when valid, 1 when invalid, 2 on errors.

### Programmatic API

```js
import { validateInstance } from '@beckn/ev-attributes-validator/src/index.js';

const result = await validateInstance({
  attributesPath: '../profiles/charging_service/v1/attributes.yaml',
  className: 'ChargingOfferAttributes',
  instance: { /* your object */ }
});

console.log(result.valid, result.errors);
```

### Notes
- JSON-LD files (`context.jsonld`, `ev.jsonld`, `evp.jsonld`) are not required at runtime; the OpenAPI schemas already reference their IDs via `x-jsonld` for downstream RDF tooling.
- Remote `$ref` in schemas (e.g., Beckn `Location`) are dereferenced before AJV compilation.

