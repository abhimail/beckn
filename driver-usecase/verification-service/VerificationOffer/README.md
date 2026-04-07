# VerificationOffer Schema

**Container:** `Offer.offerAttributes`
**Protocol Version:** 2.0
**Semantic Model:** generalised
**Use Cases:** Pricing and SLA terms for verification services, consent mechanism selection, eligibility-gated verification access
**Tag:** verification offer pricing SLA consent

## Overview

The VerificationOffer schema captures the commercial and operational terms under which a
verification provider offers a verification service. Multiple providers may offer the same
verification type (Resource) with different pricing, turnaround times, service levels, and
consent mechanisms.

## Attachment Points

This schema extends `beckn:offerAttributes` on the core `Offer` object.

## Design Rationale

- **turnaroundTime as ISO 8601 duration**: Enables machine-comparable SLA across providers.
  "PT30M" (30 minutes) is directly comparable to "PT24H" (24 hours).

- **supportedConsentMechanisms**: Verification inherently involves PII. The offer declares
  which consent mechanisms it supports, allowing the Requesting NP to match against the subject's
  available consent channels.

- **eligibilityConstraints**: Some verification services are restricted to certain industries
  or roles. This is an Offer-level concern, not a Resource-level concern — the same
  verification type may be offered with different eligibility constraints by different providers.

- **dataRetentionPolicy**: Privacy-critical. The requester needs to know how long input data
  and results are retained by the provider.

## Non-Goals

- Actual price amount (→ core `Consideration`)
- Verification result or execution details (→ `VerificationPerformance`)
- Subject data or consent tokens (→ `VerificationContract`)

## Upstream Candidates

- `turnaroundTime` (ISO 8601 duration) — applicable to any service-based offer
- `dataRetentionPolicy` — applicable to any privacy-sensitive service
- `supportedConsentMechanisms` — applicable to any PII-handling service
