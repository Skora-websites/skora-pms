# ABDM interop spike — validated (2026-11-10)

> Deliverable for AUDIT_2026-11-09 §7.3 / roadmap item "ABDM interop spike
> (P2→P3)". No code shipped — this is the research + decision doc the item
> was gated on. No vendor pricing was researched or reported, per the
> engagement's standing restriction.

## What ABDM asks of a system like SkoraCare

ABDM (Ayushman Bharat Digital Mission) is India's health-record
interoperability stack: ABHA ids, facility/doctor registries (HFR/HPR), and a
consent-gated record exchange. A clinic PMS integrates through the ABDM
sandbox across **three milestones** (there is no M4 in the sandbox — vendor
material calling "M4" refers to NHCX insurance claims, a separate track):

| Milestone | What the software does | Who needs it | Fit to SkoraCare |
|---|---|---|---|
| **M1 — ABHA** | Create an ABHA (Aadhaar/OTP), verify an existing one, show card/QR, receive **Scan and Share** at the registration desk | Every system that registers patients | High — receptionist desk flow maps directly onto Scan-and-Share (queue/token UX already exists) |
| **M2 — HIP** | Link each visit (care context) to the patient's ABHA, answer discovery + consent callbacks, push encrypted FHIR (NRCeS profiles) when consent is granted | Anyone holding patient records | High for consultations/prescriptions/test reports — our record types are exactly the profiles NHA defines (OP consultation, prescription, diagnostic report) |
| **M3 — HIU** | Raise consent requests, fetch and decrypt records held elsewhere, purge on revoke/expiry | Systems that want external history | Low priority — valuable, but patient demand must be proven first |

Sandbox exit requires **any two milestones** (NHA Integration Support, quoted
in the reference below); M1 alone cannot go to production. The path to
credentials ends in: functional testing with NHA → security audit (WASA) →
NHA demo → exit form.

## Why this matters *now* (pressure points validated)

- **DPDP is operational**: the Consent Manager deadline is **November 2026**,
  full enterprises-compliance **May 2027**. ABDM's consent architecture is
  the healthcare expression of those obligations — clinics will be asked to
  align.
- ABHA/ABDM presence is a competitive checkmark (Eka.Care, Practo ecosystem
  are ABDM-aligned; the audit's §6 gap matrix already scored us "No"
  against them on interop).
- Scan-and-Share at the desk is an M1 *test case* AND an immediately
  usable front-desk feature — rare for a regulatory item.

## What integration actually costs (engineering, not rupees)

Validated against a delivery team that took an HMIS through all three
milestones (nirmitee.io guide, updated Nov 2026) and the NHA docs:

1. **Async-by-default**: every ABDM call returns `202` and answers later on a
   registered **bridge URL** callback. Lost callback = lost record. This
   interacts badly with our **documented single-instance constraint**:
   the durable-queue path (Redis R6) or at minimum robust in-process
   retry/ack logging becomes a *prerequisite*, not a nice-to-have.
2. **FHIR packaging for M2**: OP consultation / prescription / diagnostic
   report bundles on NRCeS profiles. Mappable from our `consultations` /
   `prescriptions` / test reports — real work, medium-sized.
3. **Fidelius encryption** + key purge on consent revoke/expiry (an M3
   certification-failure trap; also applies to stored M2 consents).
4. **Registry mapping**: every clinic → HFR id, every doctor → HPR id.
   Onboarding surface needed in the owner shell.
5. **SMS provider with approved templates** — patient-initiated linking
   sends OTPs by SMS; we currently have no SMS sender at all (diagnosed in
   session 10).
6. One care context per link call; batched links were reported to lose
   records in production. Fits our per-consultation record shape.

## Recommendation (spike verdict: PROCEED STAGED)

- **Phase 0 (now, cheap):** register the sandbox entity account
  (sandbox.abdm.gov.in), start HFR facility + HPR doctor mapping with the
  owner as data entry. No code.
- **Phase 1 (M1+M2 — the exit set):** ABHA create/verify + Scan-and-Share at
  reception, care-context linking per consultation/test report, discovery +
  consent callback handlers, FHIR bundle mapper. Est. 6–10 weeks of
  engineering per the same reference — call it 8–12 realistic for our codebase
  with the callback infra built first.
- **Prerequisite gate before Phase 1 code:** decide the callback
  infrastructure story (durable queue vs acceptable in-instance risk) —
  pull the R6 Redis decision forward. Skipped milestones are recoverable;
  a lost consent notification is not resent.
- **Phase 2 (M3/HIU):** defer until patient-driven demand or a clinic chain
  customer requests it. The purge-on-revoke machinery is the only part with
  certification risk; everything else is additive.

## Sources (checked 2026-11-10)

- nirmitee.io — "ABDM Integration Step by Step (2026): Sandbox Login to
  Go-Live with M1, M2 and M3 on V3 APIs" (delivery-validated; updated
  Nov 2026) — primary.
- abdm.gov.in — sandbox + building blocks overview. NHA.
- openiam.com — DPDP timeline (Consent Manager Nov 2026, compliance May 2027).
- vcdoctor.com / claimslens.com — milestone milestone cross-checks
  (secondary, concordant with the primary on M1/M2/M3 scope and 6–10 weeks).
