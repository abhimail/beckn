# VerificationContract Schema

**Container:** `Contract.contractAttributes`
**Protocol Version:** 2.0
**Semantic Model:** generalised
**Use Cases:** Driver licence verification for employment onboarding, identity KYC, bank account verification for payroll, skill certificate verification for job matching, background checks
**Tag:** verification contract consent subject PII

## Overview

The VerificationContract schema captures the transaction-level metadata for a verification
request. It binds the subject (who is being verified), the purpose (why), the consent
reference (under what authorization), and the aggregate result (what was the outcome).

## Attachment Points

This schema extends `beckn:contractAttributes` on the core `Contract` object. The Contract
also uses core `participants` to list the REQUESTER, VERIFIER, and SUBJECT parties.

## Design Rationale

- **SubjectReference is minimal**: The subject reference carries only the name and typed
  identifiers needed by the verification provider. Full PII exchange happens during
  init/confirm under consent, not during discovery or select.

- **ConsentReference is external**: The schema references a consent artifact by ID and
  mechanism rather than embedding consent terms. This allows integration with external
  consent management systems (e.g., DigiLocker, Account Aggregator consent framework).

- **aggregateResult at Contract level**: When a contract covers multiple verification
  types (e.g., both identity and driving licence), the aggregate result summarizes the
  overall outcome. Individual verification results are in `performanceAttributes`.

- **purpose as CodedValue**: Verification purpose affects both regulatory compliance
  and provider processing. Making it machine-readable enables automated policy matching.

## Non-Goals

- Individual verification check results (→ `VerificationPerformance`)
- Pricing and payment (→ core `Consideration` / `Settlement`)
- Consent management UI or consent collection (external system)
- Credential issuance or storage

## Upstream Candidates

- `ConsentReference` pattern — applicable to any PII-handling contract
- `SubjectReference` pattern — applicable to any person-centric service
- `aggregateResult` with status enum — applicable to any multi-check contract
