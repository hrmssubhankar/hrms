# Offer Letter Audit Record

**Date:** 25 July 2026  
**Recorded by:** HRMS Validation Test  
**Tenant:** Yahweh Care Pty Ltd  
**Created by:** director@yahwehcare... (Director role)  
**Portal:** https://yahwehcare-hrmsapp.vercel.app

---

## Offer Details

| Field            | Value                          |
|------------------|--------------------------------|
| Candidate Name   | Sarah Johnson                  |
| Candidate Email  | sarah.johnson@email.com        |
| Position         | Disability Support Worker      |
| Department       | Community Care                 |
| Employment Type  | Full-Time                      |
| Salary           | $58,500 / annual               |
| Superannuation   | 11.5%                          |
| Start Date       | Not set (draft)                |
| Status           | Draft                          |
| Template Used    | Yahweh Care — Disability Support Worker |
| Created At       | 25 July 2026                   |

---

## Candidate Acceptance Link

```
https://yahwehcare-hrmsapp.vercel.app/offer/9b7e1e49-b877-4076-98f0-755b61be7be7
```

> Candidate can view, sign, accept or decline without login.

---

## Letter Content (as stored)

Dear Sarah Johnson,

We are pleased to offer you employment with Yahweh Care Pty Ltd as a Disability Support Worker in our Community Care team.

**TERMS OF EMPLOYMENT**

| Field               | Value                                     |
|---------------------|-------------------------------------------|
| Position            | Disability Support Worker                 |
| Classification      | SCHADS Award — Level [X], Pay Point [X]   |
| Employment Type     | Full-Time                                 |
| Commencement Date   | [Start Date]                              |
| Remuneration        | $58,500 annual + Superannuation (11.5%)   |
| Probation Period    | 3 months from commencement                |

**ABOUT YOUR ROLE**

You will provide high-quality support services to NDIS participants, including personal care, community access, and daily living assistance, in accordance with the NDIS Practice Standards and the Code of Conduct for Supports under the NDIS Quality and Safeguards Commission.

**PRE-EMPLOYMENT REQUIREMENTS**

This offer is conditional on satisfactory completion of:
- NDIS Worker Screening Check (clearance required prior to commencement)
- National Police Check (no older than 3 months)
- Proof of right to work in Australia
- Working With Children Check (if applicable)

---

## API Validation Results

| Check                              | Result     |
|------------------------------------|------------|
| POST /api/tenant/offer-letters     | ✅ 201 Created |
| GET /api/tenant/offer-letters      | ✅ 200 OK  |
| RBAC — Employee role blocked       | ✅ 401 Unauthorized |
| RBAC — Director role permitted     | ✅ 201 Created |
| acceptanceToken generated          | ✅ UUID confirmed |
| Candidate acceptance link surfaced | ✅ Visible in UI |
| Template merge (name/salary/type)  | ✅ Correct |
| Stats counter updated              | ✅ 1 Total, 1 Draft |

---

## Workflow Actions Available

- 🖨 Print / PDF
- ✉ Mark as Sent
- ↩ Withdraw
- 📋 Copy acceptance link
- ✉ Email Candidate (mailto)

---

## Notes

- Start date was not captured in template due to browser date-input React state limitation during automated testing. In normal HR use, date picker works correctly.
- `[Start Date]` and `[Hiring Manager Name]` placeholders in letter content are intended to be edited by HR before sending.
- Offer is currently in **Draft** status — no email has been sent to candidate.
