# Verification Service Schema Pack

**Domain:** People Verification / Trust Infrastructure
**Protocol Version:** 2.0
**Semantic Model:** generalised
**Schema Pack Version:** 2.1.0

## Overview

This schema pack models a **Verification Service Network** on the Beckn Protocol v2.1 generalised core.
It enables discovery, selection, and execution of identity, credential, and eligibility verification
services across a decentralized network of verification providers.

The primary use case is **driver licence verification** for transport operators, but the model
generalises to any person-centric verification: identity (Aadhaar, PAN), bank account, skill
certificates, educational credentials, health worker licences, and more.

## Network Roles

| Role | Beckn Entity | Description |
|------|-------------|-------------|
| Requesting Platform | Requesting NP | Employers, platforms, or organisations that need to verify individuals |
| Verification Provider | Provider NP | Entities that perform verification against authoritative sources |
| Subject | Referenced in Contract as a Participant (role: SUBJECT) | The individual being verified |

## Schemas in this Pack

| Schema | Container | Purpose |
|--------|-----------|---------|
| `VerificationResource` | `resourceAttributes` | Describes a verification service type (what can be verified, input requirements, jurisdiction) |
| `VerificationOffer` | `offerAttributes` | Commercial terms: pricing, SLA/turnaround, validity period |
| `VerificationContract` | `contractAttributes` | Verification request metadata: subject reference, consent, overall result |
| `VerificationPerformance` | `performanceAttributes` | Verification execution: processing steps, result output, evidence |

## Transaction Lifecycle

```
discover  → on_discover    (Browse available verification services)
select    → on_select      (Get quote for specific verification)
init      → on_init        (Submit subject details + consent)
confirm   → on_confirm     (Confirm verification request, receive result or processing status)
status    → on_status      (Poll for async verification result)
```

## Design Rationale

1. **Resource = Verification Service Type**: Each resource represents a distinct verification
   capability (e.g., "Driving Licence Verification", "Aadhaar Identity Verification"). The
   resource describes *what* is verified and *what inputs* are required — not pricing or terms.

2. **Offer = Provider's Commercial Terms**: Pricing, turnaround time, result validity, and
   eligibility constraints live in the offer. This allows multiple providers to offer the same
   verification type with different terms.

3. **Contract = Verification Request**: The contract binds the requester, verifier, and subject.
   Contract-level attributes capture consent reference, purpose of verification, and aggregate
   result status.

4. **Performance = Verification Execution**: The actual verification process — which checks
   were performed, what the result was, evidence/artifacts produced. This is where the
   structured verification output lives.

5. **Commitment/Consideration/Settlement**: Left to core defaults. Each contract typically
   covers a single verification service (commitment is straightforward), payment is monetary
   (consideration is simple), and settlement is immediate.

## Non-Goals

- **Credential storage**: This schema models the *verification act*, not the storage or
  issuance of verifiable credentials (VCs). Integration with VC standards is out of scope.
- **Multi-step identity proofing**: Complex identity proofing workflows with multiple
  sequential checks are modelled as separate contracts, not a single multi-step contract.
- **Consent management infrastructure**: The schema references consent tokens but does not
  model the consent collection UI or consent management system.

## Upstream Candidates

- `verificationType` (CodedValue) — generic enough for any verification network
- `verificationResult` status codes — VERIFIED / NOT_VERIFIED / INCONCLUSIVE / EXPIRED
- `consentReference` pattern — applicable to any privacy-sensitive service
