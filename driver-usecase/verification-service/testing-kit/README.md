# Verification Service — Testing Kit

Everything an implementer needs to build, test, and validate a BAP or BPP integration with the Beckn Verification Service Network.

## What's in this kit

| Artifact | File | Purpose |
|----------|------|---------|
| **E2E Flows** | `Verification_Service_E2E_Flows.md` | Complete end-to-end scenarios for all 4 use cases with full request/response JSON payloads. UC2 (Identity/KYC) is the deep reference implementation; UC1, UC3, UC4 are lighter. Includes a Common Integration Mistakes section and Validation Checklist. |
| **Postman Collection** | `Verification_Service_Postman_Collection.json` | Import into Postman for immediate testing. Two folders: BAP outbound requests and BPP callback responses. 28 requests total across 4 use cases. Pre-configured variables for local testing. |
| **Sequence Diagrams** | `sequence-diagrams/*.mermaid` | Mermaid sequence diagrams for each use case showing the full message flow between BAP, Gateway, and BPP. Render in any Mermaid-compatible viewer (GitHub, VS Code, mermaid.live). |

## Quick start

### 1. Read the reference flow
Open `Verification_Service_E2E_Flows.md` and walk through UC2 (Identity Verification) end-to-end. This is the most detailed flow and covers every API call with complete payloads.

### 2. Import Postman collection
1. Open Postman → Import → Upload `Verification_Service_Postman_Collection.json`
2. Edit collection variables to match your environment:
   - `gateway_url` — your Beckn gateway endpoint (default: `http://localhost:5001`)
   - `bap_callback_url` — your BAP's callback endpoint (default: `http://localhost:5002`)
   - `bpp_callback_url` — your BPP's callback endpoint (default: `http://localhost:5003`)
3. Start with the BAP folder if you're building a BAP, or the BPP folder if you're building a BPP

### 3. View sequence diagrams
Open the `.mermaid` files in any Mermaid renderer:
- **GitHub**: renders natively in markdown preview
- **VS Code**: install the Mermaid Preview extension
- **Online**: paste into [mermaid.live](https://mermaid.live)

## Use cases covered

| UC | Name | Depth | Scenario |
|----|------|-------|----------|
| UC2 | Identity Verification (Aadhaar KYC) | **Deep** — all 10 API calls | Priya Sharma joins a gig platform, needs Aadhaar-based KYC |
| UC1 | Driving Licence Verification | Lighter — key calls | Ravi Kumar applies for bus operator job in Delhi |
| UC3 | Bank Account Verification | Lighter — key calls | Ravi Kumar's bank account verified for payroll setup |
| UC4 | Skill Certificate Verification | Lighter — key calls | Ankit Patel's ITI electrician certificate verified for staffing platform |

## Related documents

- **Implementation Guide**: `Verification_Service_Implementation_Guide.docx` — the formal IG with network roles, information model, schema definitions
- **Schema Pack**: `verification-service/` — the actual v2.1 schema pack (attributes.yaml, context.jsonld, vocab.jsonld, profile.json, renderer.json, examples)
- **Use Case Document**: `Use Case - Verification Service.docx` — the original domain use case description
