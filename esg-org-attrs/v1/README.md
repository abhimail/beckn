# Provider + ESG Metric — Attribute Schema Pack (v1)

This pack contains:
- `context.jsonld` — JSON-LD terms/IRIs for both Provider and ESG Metric attributes
- `attributes.yaml` — OpenAPI 3.1 schemas for `org:ProviderAttributes` and `esg:MetricAttributes`
  - Uses vendor extensions `x-jsonld` and **x-jsonild** (alias) for environments expecting either
  - Includes `x-beckn-constraints.equals` hint on `metricId`
- `rules/` — Spectral linters and SHACL shapes
  - `spectral-item.yaml` + `functions/matchItemId.js`
  - `spectral-provider.yaml`
  - `item-equality.shacl.ttl`
- `tools/` — `jq` transforms for legacy ⇄ v1 conversions
- `examples/` — Canonical examples

## Mounting
- Under **core Provider**: `beckn:providerAttributes` → `ProviderAttributes`
- Under **core Item**: `beckn:itemAttributes` → `ESGMetricAttributes`

## Validation layers
- **Spectral (CI)**: run on Items/Providers to lint context/type and check `metricId == beckn:id`
- **SHACL (RDF)**: validate equality after JSON-LD expansion to RDF
- (Optional) **Ajv (runtime)**: add a JSON Schema with `$data` if enforcing at API boundary
