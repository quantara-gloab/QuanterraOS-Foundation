# TrustOS Pilot Target Accounts & Research Dossier

**Campaign:** TrustOS Pilot ($20,000 / 6 Weeks)  
**Target Universe:** 25 US AI Lenders, Insurtechs, and Algorithmic Credit Originators  
**Primary Regulatory Hooks:**
1. **NAIC Model Bulletin on AI:** Ongoing monitoring of AI underwriting, pricing, and claims models (25 states adopted, 8 pending).
2. **ECOA / Regulation B (12 CFR Part 1002):** Required specific adverse-action reason accuracy; model drift invalidates stated reasons.
3. **Colorado SB 26-189:** 30-day plain language notice requirement for automated adverse decisions (Effective Jan 1, 2027; currently stayed in *xAI v. Weiser*).

---

## Priority A Targets (13 Core Accounts)

Fast-moving AI-native lenders and insurtechs with public machine-learning decision models under immediate regulatory scrutiny:

| # | Company | Domain | Priority Role Titles | Target Model / Use Case | Regulatory Driver & Evidence Note |
|---|---|---|---|---|---|
| **1** | **Happy Money** | AI Lending | Chief Risk Officer, VP Credit Model Risk | Personal loan approval & credit tiering | Uses Zest AI for ML underwriting; ECOA/Reg B reason attribution critical. |
| **2** | **OppFi** | Subprime Lending | Chief Risk Officer, Head of Decision Science | High-volume automated credit scoring | Algorithmic credit scoring subject to state usury & adverse action compliance. |
| **3** | **Mission Lane** | Credit Cards | Chief Risk Officer, VP Credit Underwriting | Machine learning card issuance & credit lines | High-growth card issuer using ML risk models; ECOA adverse action oversight. |
| **4** | **Avant** | Consumer Lending | Chief Risk Officer, Head of Model Governance | Consumer installment loan scoring | Pioneer in ML credit decisioning; bank-partner model validation requirements. |
| **5** | **Root Insurance** | Auto Insurtech | Chief Risk Officer, Chief Actuary | Telematics driving score & automated pricing | Public telematics carrier; direct subject of NAIC Model Bulletin ongoing monitoring. |
| **6** | **Kin Insurance** | Home Insurtech | Chief Risk Officer, VP Underwriting Analytics | Automated home & catastrophe risk quoting | Direct-to-consumer automated underwriting; NAIC bulletin vendor risk. |
| **7** | **Steadily** | Landlord Insurtech | Chief Risk Officer, Head of Automated Underwriting | Rental property automated rating & inspection AI | High-speed automated quoting; must prove confidence calibration across score bands. |
| **8** | **Upstart** | AI Lending Platform | Head of Model Risk Management, Chief Risk Officer | Cross-lender AI credit decision engine | Subject to CFPB guidance on AI credit underwriting; model validation gold standard. |
| **9** | **Pagaya Technologies** | AI Credit Partner | Chief Risk Officer, Head of Credit Underwriting | Bank-partner algorithmic credit underwriting | Operates underwriting engines on behalf of major bank partners; bank examiner scrutiny. |
| **10** | **Oportun** | CDFI Lending | Chief Risk Officer, VP Model Validation | Alternative data credit scoring engine | CDFI license requires strict proof of fairness and non-discriminatory calibration. |
| **11** | **Hippo Insurance** | Property Insurtech | Chief Underwriting Officer, Chief Risk Officer | Aerial imagery & automated underwriting engine | Automated property inspection models subject to state insurance market conduct exams. |
| **12** | **Lemonade** | Multi-line Insurtech | VP Regulatory Affairs, Chief Underwriting Officer | AI Maya (quoting) & AI Jim (claims triage) | Fully automated underwriting & claims resolution; prime audit candidate under NAIC. |
| **13** | **Best Egg (Marlette)** | Personal Loans | Head of Credit Risk, Head of Decision Science | Algorithmic personal lending & credit lines | Cross River Bank partner; bank model risk management (SR 11-7) compliance. |

---

## Priority B Targets (12 Accounts)

Fintechs, regional credit unions, and specialty automation providers with expanding AI footprints:

| # | Company | Domain | Priority Role Titles | Target Model / Use Case | Regulatory Driver & Evidence Note |
|---|---|---|---|---|---|
| **14** | **Blue Federal Credit Union** | Credit Union | Chief Lending Officer, VP Risk Management | Automated consumer loan underwriting | *Verification Note:* Implemented Zest AI in 2024; verify current ML model deployment before outreach. |
| **15** | **Kashable** | Employment Lending | Head of Underwriting, Chief Compliance Officer | Employer-sponsored consumer credit | *Verification Note:* Verify whether current scoring uses pure rule-based tables vs trained ML models. |
| **16** | **Clearcover** | Auto Insurtech | VP Insurance Analytics, Chief Actuary | API-first automated claims processing | Claims settlement algorithms subject to fair-claims settlement practices acts. |
| **17** | **Branch Insurance** | Bundled Insurance | Head of Underwriting Strategy, Chief Risk Officer | Instant-bind home and auto pricing engine | Rapid growth with embedded partners; NAIC compliance across partner states. |
| **18** | **Petal Card** | Cashflow Credit | Head of Credit & Risk, VP Compliance | Cashflow-based underwriting engine (Prism Data) | Cashflow scoring alternative to FICO; ECOA adverse action validation essential. |
| **19** | **Blend Labs** | Banking Tech | Head of Compliance Solutions, VP Product Risk | Automated mortgage & deposit decisioning | Vendor model used by hundreds of banks; banks demand third-party validation reports. |
| **20** | **Enova International** | Digital Lending | Head of Analytics & Risk, Chief Risk Officer | Colossus automated credit analytics | Established subprime algorithmic engine; requires continuous calibration auditing. |
| **21** | **Prosper Marketplace** | Peer-to-Peer / Bank | VP Credit Policy, Head of Model Risk | Peer and institutional credit risk models | Bank partnership with WebBank; OCC/FDIC third-party model risk guidance applies. |
| **22** | **Upgrade Inc.** | Consumer Credit | Head of Credit & Risk Operations | Credit card & personal loan risk tiering | Cross River Bank issuance; subject to federal bank model risk examination standards. |
| **23** | **Figure Technology** | Blockchain HELOC | Chief Compliance Officer, VP Credit Engineering | 5-minute automated HELOC underwriting | Speed of automated title and credit decisioning requires counterfactual adverse-action audit. |
| **24** | **Doma Holdings** | Title Insurtech | VP Title Underwriting Technology | Machine learning title clearance & risk analysis | Algorithmic title underwriting; state insurance commissioner compliance. |
| **25** | **Next Insurance** | Commercial Insurtech | Head of Automated Underwriting | Small business risk categorization & rating | Commercial lines automation; expanding across state jurisdictions. |

---

## Execution Workflow

1. **LinkedIn Contact Verification:** Look up the exact current individual holding the specified role title at each company.
2. **Scout Ingestion:** Ingest via `npm run growth:import -- data/trustos-targets.csv "trustos-q4-2026"`.
3. **Outreach Cadence:** Maximum 3 touches per prospect, personalized to their specific regulatory hook (NAIC Model Bulletin for insurers; ECOA/Reg B for lenders).
4. **Scoping Call Deliverable:** Send the 1-page [TrustOS Pilot Offer](file:///c:/Users/enseg/OneDrive/Desktop/quanterraos-foundation/quanterraos-foundation/docs/trustos-pilot-offer.md) and point them to the public calibration proof at [quanterraos.com/calibration](https://quanterraos.com/calibration).
