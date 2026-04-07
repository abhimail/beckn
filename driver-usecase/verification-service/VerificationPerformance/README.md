# VerificationPerformance Schema

**Container:** `Performance.performanceAttributes`
**Protocol Version:** 2.0
**Semantic Model:** generalised
**Use Cases:** Driving licence verification result, identity verification output, bank account verification confirmation, skill certificate validation, background check results
**Tag:** verification performance result evidence audit

## Overview

The VerificationPerformance schema captures the execution details and results of a single
verification check. Each Performance unit in a contract corresponds to one verification
type being executed — for example, one driving licence check or one identity check.

This is where the actual verification output lives: the result status, the verified data
fields extracted from the authoritative source, processing steps for audit transparency,
evidence artifacts, and confidence scoring.

## Attachment Points

This schema extends `beckn:performanceAttributes` on the core `Performance` object.

## Design Rationale

- **verifiedData as open object**: The shape of verified data varies significantly across
  verification types. A driving licence returns holder name, vehicle classes, expiry date;
  an identity check returns name, date of birth, address. The open object pattern allows
  each verification type to return its specific fields without schema changes.

- **processingSteps for transparency**: Listing each processing step (input validation,
  source query, data comparison) with timestamps enables audit trails and helps requesters
  understand where in the process a failure occurred.

- **evidence for trust**: Signed certificates, source response hashes, and API logs provide
  cryptographic and documentary proof of the verification. This supports the use case's
  goal of portable, reusable trust.

- **confidenceScore for fuzzy methods**: When verification uses OCR, name matching, or
  biometric comparison, the result may not be binary. The confidence score lets requesters
  apply their own thresholds.

- **failureReason for diagnostics**: Machine-readable failure codes enable automated retry
  logic (e.g., retry on SOURCE_UNAVAILABLE) and human escalation (e.g., alert on
  FRAUD_SUSPECTED).

## Non-Goals

- Subject PII management (→ `VerificationContract`)
- Pricing or payment for the verification (→ core `Consideration` / `Settlement`)
- Verification service description (→ `VerificationResource`)

## Upstream Candidates

- `VerificationResult` with status enum — applicable to any compliance/trust domain
- `ProcessingStep` pattern — applicable to any multi-step service execution
- `EvidenceArtifact` pattern — applicable to any domain requiring audit trails
- `confidenceScore` — applicable to any fuzzy-matching or ML-based service
