# QuanterraOS 10-User Usability Pilot: Standardized Observation Protocol

**Target Audience:** Founder / Usability Operator  
**Session Count:** 10 Real Human Participants (`P-01` through `P-10`)  
**Pilot Window:** Tomorrow (October 7, 2026)  
**Governing Governance:** HANDOFF.md Rule B4, Rule B5 & Pilot Audit Standards  

---

## 1. Operating Principle & Integrity Guardrail

> [!IMPORTANT]
> **Strict Empirical Integrity:**
> Never generate synthetic or AI-created user observation logs. If an AI or testing script generates scenarios, they must be labeled *"Simulated usability scenarios"* and excluded from customer metrics.
> 
> Only real human interactions observed unassisted qualify as customer observation evidence.

---

## 2. Participant Recruitment & Consent Intake

1. **Target Segments (Minimum 2 per bucket):**
   - Active Kalshi / Polymarket crypto prediction market traders.
   - Retail crypto/equities active traders.
   - Quantitative finance or economics students / researchers.
2. **Consent Requirement:**
   - Record participant consent for anonymous telemetry and note capture.
   - Assign identifier `P-01` through `P-10`. Do not store personal identifying information (PII) on the public audit log.

---

## 3. The Unassisted Task Execution (Silent Observation)

1. **The Task Script (Read Verbatim without coaching):**
   > *"Please visit quanterraos.com. Evaluate any live contract using the tools available, save your check, and find it in your personal journal."*
2. **Rules for the Operator:**
   - **Do NOT** point to buttons, sliders, or menus.
   - **Do NOT** explain how Kalshi's fee formula works.
   - **Do NOT** explain what the breakeven probability means in advance.
   - **Start the stopwatch** when the participant opens the homepage.
   - **Stop the stopwatch** when they locate their saved entry in `/journal`.
3. **Record in `/audit/pilot`:**
   - `Participant Ref`: e.g., `P-01`
   - `Device & Browser`: e.g., `iPhone 16 Safari` or `MacBook Chrome`
   - `Task Duration`: Recorded in mm:ss
   - `Unassisted`: Select `YES` if completed without intervention, or `NO` with specific assistance notes.
   - `Hesitation / Friction Notes`: Exact UI elements where the user paused or appeared confused.

---

## 4. The 4 Comprehension Verification Questions

Immediately after the user finds their saved check in `/journal`, ask the following four questions and record verbatim responses:

1. **Question 1: Purchase Cost vs. Total Outlay**
   - *"What was your initial cost to enter this check, and how much did the fee add?"*
   - *Passing criterion:* Identifies purchase price ($P \times \text{count}$) and separate exchange fee ($\lceil 0.07 \times \text{count} \times P \times (1-P) \rceil$).
2. **Question 2: Maximum Financial Loss**
   - *"If this contract expires out of the money (at $0), what is your maximum possible loss?"*
   - *Passing criterion:* Stated as cost + fee (100% loss of outlay), not just cost.
3. **Question 3: Breakeven Win Probability**
   - *"Why is the breakeven probability higher than the contract price?"*
   - *Passing criterion:* Explains that transaction fees create a required hurdle above the purchase price.
4. **Question 4: Zero Predictive Advantage Confirmation**
   - *"Does this calculation give you an edge or guarantee you will beat the market?"*
   - *Passing criterion:* Emphatic NO. Confirms that the tool is an independent measurement and risk companion, not a forecasting guarantee.

---

## 5. Persistence Check (Sign-Out & Sign-In)

1. Instruct participant: *"Please sign out of your account, sign back in, and navigate back to your journal."*
2. Verify that the saved decision check appears in the journal list.
3. Record status in `/audit/pilot`: `VERIFIED` or `FAILED`.

---

## 6. Audit Trail Logging & Submission

1. Submit the session in the **Founder Pilot Console (`/audit/pilot`)**.
2. The session is written directly to SQLite (`pilot_observation_sessions`) and synchronized to the local buffer.
3. After all 10 sessions are logged:
   - Click **`Export Complete Audit JSON`** (`/api/audit/pilot/export`).
   - Archive the timestamped JSON manifest as the auditable proof required prior to expanding to the 100-user beta.
