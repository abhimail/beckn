# VerificationResource Schema

**Container:** `Resource.resourceAttributes`
**Protocol Version:** 2.0
**Semantic Model:** generalised
**Use Cases:** Driving licence verification, identity verification (Aadhaar/PAN), bank account verification, skill certificate verification, education credential verification, health licence verification, address verification, employment history verification, criminal record check
**Tag:** verification trust identity credentials people

## Overview

The VerificationResource schema describes a verification service as a discoverable resource
on the Beckn Verification Service Network. Each resource represents a distinct verification
capability offered by a verification provider (Provider NP).

A resource answers the question: *"What can this provider verify, and what do I need to provide?"*

## Attachment Points

This schema extends `beckn:resourceAttributes` on the core `Resource` object. No other
containers are extended by this schema.

## Design Rationale

- **verificationType as CodedValue**: Verification types are an extensible enumeration.
  Using a code + name pattern allows networks to define their own verification types without
  schema changes.

- **supportedDocumentTypes as array**: A single verification service may accept multiple
  document types as input (e.g., driving licence verification may accept both a licence
  number or a scanned document).

- **requiredInputFields as self-describing contract**: By listing input fields with their
  types and validation patterns, the resource enables Requesting NPs to build dynamic forms without
  hardcoding field knowledge.

- **authoritativeSource for transparency**: Knowing which authoritative database backs a
  verification service helps requesters assess trust and reliability.

## Non-Goals

- Pricing and commercial terms (→ `VerificationOffer`)
- Subject PII or verification results (→ `VerificationContract` / `VerificationPerformance`)
- Provider authentication or API credentials

## Upstream Candidates

- `verificationType` CodedValue pattern — applicable to any trust/compliance network
- `InputFieldDescriptor` / `OutputFieldDescriptor` — generic form-schema pattern useful
  across domains requiring structured input/output contracts
