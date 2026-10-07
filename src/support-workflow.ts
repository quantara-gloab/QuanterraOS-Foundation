/**
 * QuanterraOS Beta Support & Problem Routing Engine
 *
 * Implements:
 * 1. Problem Ingestion: Routes reported problems from mobile runtime and web into a unified founder queue.
 * 2. Structured Severity & Categorization:
 *    - Severity: P0_BLOCKER (crashes/breaks flow), P1_DEGRADED (calculations impaired), P2_USABILITY (confusing UI), P3_FEEDBACK (suggestions).
 *    - Category: DATA_FEED, CALCULATION, AUTH_PERSISTENCE, UI_MOBILE, OTHER.
 * 3. Clear Ownership & Lifecycle Tracking:
 *    - Owner: "founder" (or assigned operator).
 *    - Status: OPEN -> INVESTIGATING -> RESOLVED / WONT_FIX with documented resolution notes.
 * 4. Privacy: Reporter reference is pseudonymized by default, avoiding unconsented PII exposure.
 */

import { randomUUID } from "node:crypto";
import { db } from "./db.ts";
import { supportTickets } from "./schema.ts";
import { eq, desc, sql } from "drizzle-orm";
import { pseudonymizeUserIdentifier } from "./beta-invitations.ts";

export type SupportSeverity = "P0_BLOCKER" | "P1_DEGRADED" | "P2_USABILITY" | "P3_FEEDBACK";
export type SupportCategory = "DATA_FEED" | "CALCULATION" | "AUTH_PERSISTENCE" | "UI_MOBILE" | "OTHER";
export type SupportStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "WONT_FIX";

export interface CreateSupportTicketInput {
  reporterRef: string;
  source?: string;
  severity?: SupportSeverity;
  category?: SupportCategory;
  summary: string;
  details: string;
  deviceInfo?: string;
}

export interface SupportTicketRecord {
  id: string;
  ticketNumber: number;
  reporterRef: string;
  source: string;
  severity: SupportSeverity;
  category: SupportCategory;
  summary: string;
  details: string;
  deviceInfo: string | null;
  owner: string;
  status: SupportStatus;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportQueueMetrics {
  totalTickets: number;
  openCount: number;
  investigatingCount: number;
  resolvedCount: number;
  p0BlockersCount: number;
  p1DegradedCount: number;
  p2UsabilityCount: number;
  p3FeedbackCount: number;
  avgResolutionTimeHours: number | null;
}

/**
 * Creates and routes a new problem report into the founder queue.
 */
export function submitSupportTicket(input: CreateSupportTicketInput): SupportTicketRecord {
  const now = new Date().toISOString();
  const id = `tick_${randomUUID().slice(0, 12)}`;
  
  // Pseudonymize reporter reference if it looks like an email or raw ID
  const safeReporterRef = input.reporterRef.includes("@") || input.reporterRef.length > 20
    ? pseudonymizeUserIdentifier(input.reporterRef)
    : input.reporterRef.trim();

  // Get next sequential ticket number
  const maxTicket = db
    .select({ maxNum: sql<number>`MAX(${supportTickets.ticketNumber})` })
    .from(supportTickets)
    .get();

  const nextNumber = (maxTicket?.maxNum || 100) + 1;

  const severity: SupportSeverity = input.severity || "P2_USABILITY";
  const category: SupportCategory = input.category || "UI_MOBILE";

  db.insert(supportTickets)
    .values({
      id,
      ticketNumber: nextNumber,
      reporterRef: safeReporterRef,
      source: input.source || "mobile_app",
      severity,
      category,
      summary: input.summary.slice(0, 255),
      details: input.details.slice(0, 2000),
      deviceInfo: input.deviceInfo ? input.deviceInfo.slice(0, 300) : null,
      owner: "founder",
      status: "OPEN",
      resolutionNotes: null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return {
    id,
    ticketNumber: nextNumber,
    reporterRef: safeReporterRef,
    source: input.source || "mobile_app",
    severity,
    category,
    summary: input.summary,
    details: input.details,
    deviceInfo: input.deviceInfo || null,
    owner: "founder",
    status: "OPEN",
    resolutionNotes: null,
    resolvedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Lists tickets in the founder queue with optional filters.
 */
export function listSupportTickets(filters?: {
  status?: SupportStatus;
  severity?: SupportSeverity;
  limit?: number;
}): SupportTicketRecord[] {
  let query = db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  const records = query.all() as SupportTicketRecord[];

  return records
    .filter((t) => (!filters?.status || t.status === filters.status))
    .filter((t) => (!filters?.severity || t.severity === filters.severity))
    .slice(0, filters?.limit || 100);
}

/**
 * Updates a ticket's status, assignment, or resolution notes.
 */
export function updateSupportTicket(
  ticketId: string,
  updates: {
    status?: SupportStatus;
    owner?: string;
    resolutionNotes?: string;
  }
): SupportTicketRecord | null {
  const existing = db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .get() as SupportTicketRecord | undefined;

  if (!existing) return null;

  const now = new Date().toISOString();
  const nextStatus = updates.status || existing.status;
  const isResolving = nextStatus === "RESOLVED" && existing.status !== "RESOLVED";

  db.update(supportTickets)
    .set({
      status: nextStatus,
      owner: updates.owner || existing.owner,
      resolutionNotes: updates.resolutionNotes !== undefined ? updates.resolutionNotes : existing.resolutionNotes,
      resolvedAt: isResolving ? now : (nextStatus === "RESOLVED" ? existing.resolvedAt : null),
      updatedAt: now,
    })
    .where(eq(supportTickets.id, ticketId))
    .run();

  return {
    ...existing,
    status: nextStatus,
    owner: updates.owner || existing.owner,
    resolutionNotes: updates.resolutionNotes !== undefined ? updates.resolutionNotes : existing.resolutionNotes,
    resolvedAt: isResolving ? now : (nextStatus === "RESOLVED" ? existing.resolvedAt : null),
    updatedAt: now,
  };
}

/**
 * Calculates current queue metrics for the founder dashboard.
 */
export function getSupportQueueMetrics(): SupportQueueMetrics {
  const tickets = db.select().from(supportTickets).all() as SupportTicketRecord[];

  let openCount = 0;
  let investigatingCount = 0;
  let resolvedCount = 0;
  let p0BlockersCount = 0;
  let p1DegradedCount = 0;
  let p2UsabilityCount = 0;
  let p3FeedbackCount = 0;
  let totalResolutionDurationHours = 0;
  let resolvedWithDuration = 0;

  for (const t of tickets) {
    if (t.status === "OPEN") openCount++;
    if (t.status === "INVESTIGATING") investigatingCount++;
    if (t.status === "RESOLVED") {
      resolvedCount++;
      if (t.resolvedAt && t.createdAt) {
        const diffMs = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime();
        if (diffMs > 0) {
          totalResolutionDurationHours += diffMs / (1000 * 60 * 60);
          resolvedWithDuration++;
        }
      }
    }

    if (t.severity === "P0_BLOCKER") p0BlockersCount++;
    if (t.severity === "P1_DEGRADED") p1DegradedCount++;
    if (t.severity === "P2_USABILITY") p2UsabilityCount++;
    if (t.severity === "P3_FEEDBACK") p3FeedbackCount++;
  }

  const avgResolutionTimeHours = resolvedWithDuration > 0
    ? Math.round((totalResolutionDurationHours / resolvedWithDuration) * 10) / 10
    : null;

  return {
    totalTickets: tickets.length,
    openCount,
    investigatingCount,
    resolvedCount,
    p0BlockersCount,
    p1DegradedCount,
    p2UsabilityCount,
    p3FeedbackCount,
    avgResolutionTimeHours,
  };
}

/**
 * Generates the HTML for the Founder Support Queue card.
 */
export function renderSupportQueueHtml(tickets: SupportTicketRecord[], metrics: SupportQueueMetrics): string {
  const severityBadge = (sev: SupportSeverity) => {
    switch (sev) {
      case "P0_BLOCKER":
        return `<span style="background: rgba(244, 63, 94, 0.2); color: #FDA4AF; border: 1px solid #F43F5E; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">P0 BLOCKER</span>`;
      case "P1_DEGRADED":
        return `<span style="background: rgba(245, 158, 11, 0.2); color: #FCD34D; border: 1px solid #F59E0B; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">P1 DEGRADED</span>`;
      case "P2_USABILITY":
        return `<span style="background: rgba(59, 130, 246, 0.2); color: #93C5FD; border: 1px solid #3B82F6; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.68rem;">P2 USABILITY</span>`;
      case "P3_FEEDBACK":
        return `<span style="background: rgba(148, 163, 184, 0.2); color: #E2E8F0; border: 1px solid #64748B; padding: 2px 6px; border-radius: 4px; font-size: 0.68rem;">P3 FEEDBACK</span>`;
    }
  };

  const statusBadge = (st: SupportStatus) => {
    switch (st) {
      case "OPEN":
        return `<span style="color: #F43F5E; font-weight: 700;">● OPEN</span>`;
      case "INVESTIGATING":
        return `<span style="color: #F59E0B; font-weight: 700;">◐ INVESTIGATING</span>`;
      case "RESOLVED":
        return `<span style="color: #10B981; font-weight: 700;">✔ RESOLVED</span>`;
      case "WONT_FIX":
        return `<span style="color: #94A3B8;">○ WONT FIX</span>`;
    }
  };

  return `
  <div class="evidence-card" id="support-queue-card" style="margin-top: 24px;">
    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2); padding-bottom: 12px; margin-bottom: 16px;">
      <h3 style="margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 1.15rem; color: #F8FAFC;">
        🛡️ Founder Support Queue
      </h3>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: #94A3B8;">
        Active: <strong style="color: #F43F5E;">${metrics.openCount} Open</strong> · 
        <strong style="color: #F59E0B;">${metrics.investigatingCount} Investigating</strong> · 
        <strong style="color: #10B981;">${metrics.resolvedCount} Resolved</strong>
      </div>
    </div>

    <!-- Quick Stats Grid -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px;">
      <div style="background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 0.7rem; color: #94A3B8; font-family: 'IBM Plex Mono', monospace;">P0 BLOCKERS</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: ${metrics.p0BlockersCount > 0 ? '#F43F5E' : '#10B981'};">${metrics.p0BlockersCount}</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 0.7rem; color: #94A3B8; font-family: 'IBM Plex Mono', monospace;">P1 DEGRADED</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #F59E0B;">${metrics.p1DegradedCount}</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 0.7rem; color: #94A3B8; font-family: 'IBM Plex Mono', monospace;">P2 USABILITY</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #93C5FD;">${metrics.p2UsabilityCount}</div>
      </div>
      <div style="background: rgba(15, 23, 42, 0.6); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06);">
        <div style="font-size: 0.7rem; color: #94A3B8; font-family: 'IBM Plex Mono', monospace;">AVG RESOLUTION</div>
        <div style="font-size: 1.3rem; font-weight: 700; color: #DFB843;">${metrics.avgResolutionTimeHours !== null ? metrics.avgResolutionTimeHours + 'h' : 'N/A'}</div>
      </div>
    </div>

    <!-- Ticket Table -->
    ${tickets.length === 0 ? `
      <div style="text-align: center; padding: 24px; color: #94A3B8; font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem;">
        No active support tickets reported. System operational.
      </div>
    ` : `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #94A3B8;">
              <th style="padding: 8px 10px;">ID</th>
              <th style="padding: 8px 10px;">SEVERITY</th>
              <th style="padding: 8px 10px;">SUMMARY</th>
              <th style="padding: 8px 10px;">REPORTER</th>
              <th style="padding: 8px 10px;">OWNER</th>
              <th style="padding: 8px 10px;">STATUS</th>
              <th style="padding: 8px 10px;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${tickets.map((t) => `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 10px; color: #DFB843; font-weight: 600;">#${t.ticketNumber}</td>
                <td style="padding: 10px;">${severityBadge(t.severity)}</td>
                <td style="padding: 10px; max-width: 260px;">
                  <div style="color: #F8FAFC; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t.summary)}</div>
                  <div style="color: #64748B; font-size: 0.68rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(t.details)}</div>
                </td>
                <td style="padding: 10px; color: #94A3B8;">${escapeHtml(t.reporterRef)}</td>
                <td style="padding: 10px; color: #CBD5E1;">${escapeHtml(t.owner)}</td>
                <td style="padding: 10px;">${statusBadge(t.status)}</td>
                <td style="padding: 10px;">
                  ${t.status !== "RESOLVED" ? `
                    <button type="button" onclick="resolveTicketPrompt('${t.id}')" style="
                      background: rgba(16, 185, 129, 0.15);
                      border: 1px solid #10B981;
                      color: #A7F3D0;
                      padding: 3px 8px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 0.68rem;
                    ">Resolve</button>
                  ` : `<span style="color: #64748B;">Done</span>`}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `}
  </div>

  <script>
    function resolveTicketPrompt(ticketId) {
      var note = prompt("Enter resolution notes for ticket:", "Fixed in release update and verified on mobile.");
      if (note !== null) {
        fetch('/api/admin/support/ticket/' + ticketId + '/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: note })
        }).then(function(r) { return r.json(); })
          .then(function() { window.location.reload(); })
          .catch(function(err) { alert('Failed to update ticket: ' + err.message); });
      }
    }
  </script>
  `;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
