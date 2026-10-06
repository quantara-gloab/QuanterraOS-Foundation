# TrustOS Pilot Offer

**Date:** October 5, 2026  
**Author:** Michael Quantara, Founder & CEO, Quantara Global LLC · [quanterraos.com](https://quanterraos.com/)  
**Document Classification:** Commercial Proposal & Regulatory Blueprint  

---

## Executive Summary
In six weeks, for a fixed **$20,000**, TrustOS tells you whether one of your AI decision models is as confident as it should be, and gives you the audit evidence to prove it to a regulator, examiner, or bank partner.

---

## Why Now: The Regulatory Drivers

Regulators now expect you to show that automated decisions keep working after launch, not only that they were validated once.

1. **Insurers (NAIC Model Bulletin):**  
   25 states had adopted the [NAIC Model Bulletin on AI](https://www.openlayer.com/blog/naic-model-bulletin-ai-governance) as of July 2026, with 8 more in progress. It requires ongoing monitoring of AI used in underwriting, claims, and pricing, and explicitly holds carriers responsible for third-party vendor models.
2. **Lenders (ECOA & Regulation B):**  
   ECOA and Regulation B require specific, verifiable, and accurate reasons on every adverse-action notice. If a model's confidence scores drift, its stated adverse-action reasons drift with them.
3. **Colorado AI Law (SB 26-189):**  
   Requires plain-language notices within 30 days of an adverse automated decision in lending and insurance (effective January 1, 2027). Enforcement is currently stayed pending *xAI v. Weiser*, so market participants treat it as coming and inevitable, not settled.

> *Most model validation happens once a year. Calibration drift happens in between. TrustOS covers that gap.*

---

## Deliverables & 6-Week Timeline

One production model, audited end to end, with a written report your risk committee can file:

| Week | Work | You Receive |
|---|---|---|
| **Week 1** | **Scoping:** Select target model, decision domain (e.g. credit approval, claims triage), and actual outcome metric. | One-page audit plan & protocol definition |
| **Week 2** | **Data Intake & Integrity:** Ingest 12 to 24 months of de-identified scored decisions; Draco integrity & outlier checks. | Data quality memo |
| **Weeks 3–4** | **Calibration Audit:** Brier score with Murphy decomposition, reliability curve by score band, drift by month and demographic segment. | Calibration findings & reliability curves |
| **Week 5** | **Decision Trace:** Attribute stated reasons against realized outcomes across each score band; test counterfactual stability. | Rule attribution & adverse-action findings |
| **Week 6** | **Executive Readout:** Formal presentation with your risk committee, compliance officers, and model owners. | Audit report & live monitoring dashboard |

*The report states plainly where the model is well calibrated and where it is not. We do not tune results to look good.*

---

## What We Need from You

* **Data:** A de-identified extract of past decisions, each containing the model's score/probability, the decision taken, and the actual outcome observed (default, fraud confirmed, claim paid). **Zero PII:** no names, SSNs, or account numbers.
* **Access:** Read-only extract. We can run inside your VPC or cloud tenant (AWS/GCP/Azure) if your security policy requires it.
* **Personnel:** One model owner for ~2 hours/week, and one compliance contact for the kickoff and final readout.
* **Agreements:** Mutual NDA and a standard Data Processing Agreement (DPA) prior to data transfer.

---

## Why QuanterraOS

We built our audit engine in the hardest place to fake results: live prediction markets.

Across **1,316 settled 15-minute Kalshi Bitcoin markets**, we scored the market's own prices at a Brier score of **0.2001** against a coin-flip baseline of **0.2500**, and we published the result even though it proved our own models did not beat the market. Every backtest is public and reproducible at [quanterraos.com/calibration](https://quanterraos.com/calibration).

That is the standard we bring to your model: every finding traced to an auditable record, including the conclusions nobody wants to hear.

---

## Commercial Terms

| Item | Terms |
|---|---|
| **Pilot Fee** | **$20,000 fixed** for one production model (50% at kickoff, 50% at readout). |
| **Additional Models** | **$7,500 each**, audited concurrently during the same six-week engagement. |
| **Success Criteria** | Agreed in Week 1 (e.g., calibration measured on ≥ 12 months of decisions; all drift findings segmented by month and protected class). |
| **Fail-Safe Guarantee** | If TrustOS fails to meet an agreed success criterion, **the second 50% payment is waived**. |
| **Annual Credit** | **100% of the pilot fee ($20,000)** is credited toward an annual TrustOS monitoring subscription executed within 60 days of readout. |

*Introductory pricing strictly limited to the first five design partners.*

---

## Immediate Next Step
Book a 30-minute scoping call. Bring one decision model you would like an independent calibration check on, and we will tell you on the call whether a pilot can answer your question.

**Direct Contact:**  
Michael Quantara, Founder & CEO  
Quantara Global LLC  
Email: `compliance@quanterraos.com` / `hello@quanterraos.com`  
Web: [https://quanterraos.com/trustos](https://quanterraos.com/trustos)
