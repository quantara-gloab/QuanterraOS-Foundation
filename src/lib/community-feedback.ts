/**
 * QuanterraOS Community, Discord Launch & Feature Voting Board (Task 7.3)
 *
 * Implements QUANTERRAOS_ANTIGRAVITY_HANDOFF_V2.md (Part 3.7 & Task 7.3):
 * - Discord launch specification with structured channels and strict moderation rules:
 *     - #bridge-general, #flight-school, #feature-requests, #bug-reports
 *     - Strict rule: NO trade-calling channels or buy/sell picks.
 * - Public feature voting board (replicates Oddpool's feedback board):
 *     - Upvoting mechanism, categorized feature roadmap, and pilot submissions.
 * - Seamless integration with /changelog and Flight Deck.
 */

import {
  renderPublicHeader,
  renderPublicFooter,
  PUBLIC_LAYOUT_CSS,
} from "../components/public-layout.ts";
import { ASSISTANT_WIDGET_HTML } from "../assistant-widget.ts";

export interface DiscordChannelMeta {
  name: string;
  topic: string;
  isPrivateToRanks?: boolean;
}

export const DISCORD_COMMUNITY_CONFIG = {
  serverName: "QuanterraOS Flight Crew",
  inviteUrl: "https://discord.gg/quanterraos",
  channels: [
    {
      name: "#bridge-general",
      topic: "General platform discussion, product announcements, and spacecraft flight deck telemetry.",
    },
    {
      name: "#flight-school",
      topic: "Probability calibration, Brier score decomposition, Murphy reliability, and educational debriefs.",
    },
    {
      name: "#feature-requests",
      topic: "Community suggestions and feature discussions linked directly to the public voting board.",
    },
    {
      name: "#bug-reports",
      topic: "Direct engineering defect reports and feed health observation logs.",
    },
  ] as DiscordChannelMeta[],
  moderationRules: [
    {
      number: 1,
      rule: "Zero Trade-Calling or Speculative Picks",
      description: "QuanterraOS is a discipline, calibration, and fee-reduction platform. Posting trade calls, buy/sell recommendations, or speculative signals is strictly prohibited.",
    },
    {
      number: 2,
      rule: "Mathematical Rigor & Grounded Telemetry",
      description: "Discussions must center on base rates, true net costs after friction, and empirical TWAP settlement math rather than hype or emotional P&L bragging.",
    },
    {
      number: 3,
      rule: "Cockpit Discipline & Pilot Courtesy",
      description: "Maintain professional decorum. Harassment, spam, solicitation, or unsolicited promotional DMs result in immediate ejection from the server.",
    },
    {
      number: 4,
      rule: "Anti-Degeneracy & Responsible Boundaries",
      description: "Do not encourage revenge trading or tilt behavior. We reward taking cooldowns and standing down from flagged coin-flip hazard entries.",
    },
  ],
};

export type FeedbackStatus = "UNDER_REVIEW" | "PLANNED" | "IN_PROGRESS" | "SHIPPED";
export type FeedbackCategory = "radar" | "fees" | "cockpit" | "mobile" | "apis";

export interface FeedbackItem {
  id: string;
  title: string;
  category: FeedbackCategory;
  categoryLabel: string;
  description: string;
  votes: number;
  status: FeedbackStatus;
  statusLabel: string;
  authorCallsign: string;
  createdAt: string;
}

const DEFAULT_FEEDBACK_ITEMS: FeedbackItem[] = [
  {
    id: "fb_poly_cards",
    title: "Polymarket Wallet Calibration Cards with Brier Scoring",
    category: "cockpit",
    categoryLabel: "Sensors & Cockpit",
    description: "Audit on-chain Polymarket wallets by probabilistic calibration and reliability instead of misleading raw P&L, exposing the Favorite-Chaser Paradox.",
    votes: 204,
    status: "SHIPPED",
    statusLabel: "Shipped (v2-6.2)",
    authorCallsign: "Pilot-Argos",
    createdAt: "2026-10-02T10:00:00Z",
  },
  {
    id: "fb_shadow_mode",
    title: "Shadow Mode: Paper-Record Whale Flow Net of Friction",
    category: "cockpit",
    categoryLabel: "Mission Log & Sensors",
    description: "Follow public institutional prints in Mission Log with simulated slippage (+1¢) and taker fees under CFTC Rule 4.41 compliance. Zero live order routing.",
    votes: 178,
    status: "SHIPPED",
    statusLabel: "Shipped (v2-6.3)",
    authorCallsign: "Cadet-Vanguard",
    createdAt: "2026-10-04T12:00:00Z",
  },
  {
    id: "fb_push_radar",
    title: "Real-Time Push Alerts for BRTI 60-Second TWAP Divergence",
    category: "radar",
    categoryLabel: "Settlement Radar",
    description: "Browser push notifications alerting pilots when constituent spot exchange dispersion exceeds 15 bps during the critical 840–900s settlement candle.",
    votes: 142,
    status: "IN_PROGRESS",
    statusLabel: "In Progress (v2-8)",
    authorCallsign: "Pilot-71c",
    createdAt: "2026-10-05T14:30:00Z",
  },
  {
    id: "fb_mobile_pwa",
    title: "Mobile PWA Share-Sheet Intake for Kalshi & Polymarket URLs",
    category: "mobile",
    categoryLabel: "Mobile Experience",
    description: "Tap 'Share' on any contract link in mobile Safari or Chrome to open QuanterraOS Engineering with the contract parameters pre-filled for an instant pre-flight check.",
    votes: 118,
    status: "IN_PROGRESS",
    statusLabel: "In Progress (v2-8)",
    authorCallsign: "Navigator-Swift",
    createdAt: "2026-10-06T09:15:00Z",
  },
  {
    id: "fb_mcp_server",
    title: "Remote MCP Server for Claude, Antigravity, and AI Coding Agents",
    category: "apis",
    categoryLabel: "Developer Surface",
    description: "Expose real-time BRTI dispersion and Kalshi parabolic fee calculations as Model Context Protocol tools for autonomous trading research.",
    votes: 95,
    status: "PLANNED",
    statusLabel: "Planned (v2-7.5)",
    authorCallsign: "Builder-Zero",
    createdAt: "2026-10-07T11:00:00Z",
  },
  {
    id: "fb_multi_account",
    title: "Multi-Account Segregated Mission Log for Commander Desks",
    category: "cockpit",
    categoryLabel: "Mission Log",
    description: "Support multiple trading sub-accounts in the encrypted cloud journal to separate prop desk strategies from personal experimental paper trades.",
    votes: 89,
    status: "PLANNED",
    statusLabel: "Planned (v2-7)",
    authorCallsign: "Commander-Apex",
    createdAt: "2026-10-08T16:20:00Z",
  },
];

let feedbackState: FeedbackItem[] = [...DEFAULT_FEEDBACK_ITEMS];

export function getFeedbackItems(): FeedbackItem[] {
  return [...feedbackState].sort((a, b) => b.votes - a.votes);
}

export function upvoteFeedbackItem(id: string): FeedbackItem | null {
  const item = feedbackState.find(f => f.id === id);
  if (!item) return null;
  item.votes += 1;
  return item;
}

export function submitFeedbackItem(params: {
  title: string;
  category: FeedbackCategory;
  description: string;
  authorCallsign?: string;
}): FeedbackItem {
  if (!params.title || !params.title.trim()) {
    throw new Error("Feature proposal title is required.");
  }
  if (!params.description || !params.description.trim()) {
    throw new Error("Feature proposal description is required.");
  }

  const categoryLabels: Record<FeedbackCategory, string> = {
    radar: "Settlement Radar",
    fees: "True-Cost & Saver",
    cockpit: "Flight Deck Cockpit",
    mobile: "Mobile Experience",
    apis: "Developer & MCP",
  };

  const newItem: FeedbackItem = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: params.title.trim(),
    category: params.category || "cockpit",
    categoryLabel: categoryLabels[params.category] || "Flight Deck",
    description: params.description.trim(),
    votes: 1,
    status: "UNDER_REVIEW",
    statusLabel: "Under Review",
    authorCallsign: params.authorCallsign || "Cadet-Pilot",
    createdAt: new Date().toISOString(),
  };

  feedbackState.push(newItem);
  return newItem;
}

/**
 * Render HTML for the Community & Discord Launch Page (/community and /discord)
 */
export function renderCommunityDiscordPageHtml(): string {
  const channelsHtml = DISCORD_COMMUNITY_CONFIG.channels.map(c => `
    <div style="background:rgba(13,17,32,0.85); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:18px; margin-bottom:12px;">
      <div style="font-family:var(--public-font-mono); color:var(--help-cyan, #4FD1E8); font-weight:700; font-size:1.05rem; margin-bottom:6px;">
        ${c.name}
      </div>
      <div style="font-size:0.88rem; color:#CBD5E1; line-height:1.5;">
        ${c.topic}
      </div>
    </div>
  `).join("\n");

  const rulesHtml = DISCORD_COMMUNITY_CONFIG.moderationRules.map(r => `
    <div style="background:rgba(0,0,0,0.5); border-left:3px solid var(--help-gold, #C9A24A); padding:14px 18px; margin-bottom:12px; border-radius:0 6px 6px 0;">
      <div style="font-weight:700; color:#FFF; font-size:0.95rem; margin-bottom:4px;">
        Rule ${r.number}: ${r.rule}
      </div>
      <div style="font-size:0.82rem; color:#94A3B8; line-height:1.5;">
        ${r.description}
      </div>
    </div>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Discord Community &amp; Moderation Rules — QuanterraOS</title>
  <meta name="description" content="Join the QuanterraOS Discord flight crew: probability calibration discussions, feature requests, and strict non-advisory moderation.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    body { background: #000; color: #FFF; font-family: var(--public-font-sans); }
    .community-container { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
    .hero-box {
      background: radial-gradient(circle at 50% 0%, rgba(201,162,74,0.12), transparent 70%), #05060B;
      border: 1px solid rgba(201,162,74,0.3);
      border-radius: 10px;
      padding: 36px;
      margin-bottom: 40px;
      text-align: center;
    }
    .btn-discord {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #5865F2;
      color: #FFF;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 1rem;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .btn-discord:hover { background: #4752c4; }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/community" })}

  <main class="community-container">
    <div class="hero-box">
      <div style="font-family:var(--public-font-mono); color:var(--public-accent-gold); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">
        COMMUNITY TELEMETRY // DISCORD LAUNCH
      </div>
      <h1 style="font-size:clamp(2rem, 4vw, 3rem); font-weight:700; margin-bottom:12px;">
        ${DISCORD_COMMUNITY_CONFIG.serverName}
      </h1>
      <p style="font-size:1rem; color:#94A3B8; max-width:640px; margin:0 auto; line-height:1.5;">
        Connect with pilots who focus on mathematical odds appraisal, Brier score calibration, and fee minimization across Kalshi and Polymarket.
      </p>
      <a href="${DISCORD_COMMUNITY_CONFIG.inviteUrl}" class="btn-discord" target="_blank" rel="noopener noreferrer" id="btn-join-discord">
        <span>👾</span>
        <span>Join QuanterraOS Discord &rarr;</span>
      </a>
      <div style="font-size:0.75rem; color:#64748B; margin-top:12px;">
        Strictly moderated &bull; 0 trade calls &bull; Verified Pilot rank roles
      </div>
    </div>

    <!-- Section 1: Server Channel Directory -->
    <div style="margin-bottom:40px;">
      <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:16px;">Flight Crew Channel Directory</h2>
      ${channelsHtml}
    </div>

    <!-- Section 2: Strict Moderation Rules -->
    <div style="margin-bottom:40px;">
      <h2 style="font-size:1.4rem; font-weight:700; margin-bottom:16px;">Cockpit Moderation Rules (Part 3.7)</h2>
      ${rulesHtml}
    </div>

    <!-- Section 3: Feedback Board Quick Link -->
    <div style="background:rgba(201,162,74,0.06); border:1px solid rgba(201,162,74,0.3); border-radius:8px; padding:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div>
        <h3 style="font-size:1.15rem; font-weight:700; margin-bottom:4px;">Have a Feature Suggestion?</h3>
        <p style="font-size:0.85rem; color:#94A3B8; margin:0;">
          Vote on community feature proposals or submit new ideas on our public voting board.
        </p>
      </div>
      <a href="/feedback" style="background:var(--public-accent-gold); color:#000; font-weight:700; padding:10px 20px; border-radius:4px; text-decoration:none; font-size:0.88rem;">
        Open Feedback Board &rarr;
      </a>
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}
</body>
</html>`;
}

/**
 * Render HTML for the Public Feature Feedback & Voting Board (/feedback)
 */
export function renderFeedbackBoardHtml(): string {
  const items = getFeedbackItems();

  const itemsHtml = items.map(item => `
    <div class="feedback-card" id="card-${item.id}" data-category="${item.category}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <button type="button" class="btn-upvote" onclick="upvoteFeature('${item.id}')" aria-label="Upvote feature ${item.title}">
          <span style="font-size:1.1rem; line-height:1;">▲</span>
          <span id="vote-count-${item.id}" style="font-weight:700; font-size:0.95rem;">${item.votes}</span>
        </button>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
            <span class="category-pill">${item.categoryLabel}</span>
            <span class="status-pill status-${item.status.toLowerCase()}">${item.statusLabel}</span>
          </div>
          <h2 class="feedback-title">${item.title}</h2>
          <p class="feedback-desc">${item.description}</p>
          <div style="font-family:var(--public-font-mono); font-size:0.72rem; color:#64748B;">
            Proposed by <span style="color:#FFF;">${item.authorCallsign}</span>
          </div>
        </div>
      </div>
    </div>
  `).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Public Feature Feedback &amp; Voting Board — QuanterraOS</title>
  <meta name="description" content="Vote on upcoming QuanterraOS flight deck features, settlement radar upgrades, and API tools.">
  <link rel="stylesheet" href="/index.css">
  <style>
    ${PUBLIC_LAYOUT_CSS}
    :root {
      --fb-bg: #000;
      --fb-card: #0D1120;
      --fb-border: rgba(255, 255, 255, 0.08);
      --fb-gold: #C9A24A;
      --fb-cyan: #4FD1E8;
    }
    body { background: var(--fb-bg); color: #FFF; font-family: var(--public-font-sans); }
    .feedback-container { max-width: 960px; margin: 0 auto; padding: 48px 24px 80px; }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--fb-border);
      padding-bottom: 24px;
    }
    .feedback-card {
      background: var(--fb-card);
      border: 1px solid var(--fb-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    .feedback-card:hover { border-color: rgba(201, 162, 74, 0.4); }
    .btn-upvote {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 6px;
      color: #FFF;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      min-width: 54px;
      transition: all 0.2s;
    }
    .btn-upvote:hover {
      background: rgba(201, 162, 74, 0.15);
      border-color: var(--fb-gold);
      color: var(--fb-gold);
    }
    .category-pill {
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      color: var(--fb-cyan);
      text-transform: uppercase;
      font-weight: 700;
    }
    .status-pill {
      font-family: var(--public-font-mono);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 3px;
    }
    .status-shipped { background: rgba(48,164,108,0.2); color: #30A46C; }
    .status-in_progress { background: rgba(79,209,232,0.2); color: #4FD1E8; }
    .status-planned { background: rgba(201,162,74,0.2); color: #C9A24A; }
    .status-under_review { background: rgba(255,255,255,0.1); color: #8A8F98; }

    .feedback-title { font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 6px; }
    .feedback-desc { font-size: 0.88rem; color: #CBD5E1; line-height: 1.5; margin-bottom: 12px; }

    .form-panel {
      background: rgba(13,17,32,0.9);
      border: 1px solid var(--fb-border);
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 32px;
    }
  </style>
</head>
<body>
  ${renderPublicHeader({ activePath: "/feedback" })}

  <main class="feedback-container">
    <div class="header-bar">
      <div>
        <div style="font-family:var(--public-font-mono); color:var(--fb-gold); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:6px;">
          Product Roadmap &amp; Feature Requests
        </div>
        <h1 style="font-size:clamp(1.8rem, 3.5vw, 2.5rem); font-weight:700; margin:0;">
          Feature Voting Board
        </h1>
      </div>
      <div>
        <button type="button" class="action-btn btn-pro" onclick="toggleSubmitForm()" style="padding:10px 18px; font-size:0.85rem; cursor:pointer;" id="btn-suggest-feature">
          + Propose a Feature
        </button>
      </div>
    </div>

    <!-- Propose Feature Form -->
    <div class="form-panel" id="proposal-form-container" style="display:none;">
      <h2 style="font-size:1.2rem; font-weight:700; margin-bottom:14px;">Submit a Flight Deck Proposal</h2>
      <form id="feedback-form" onsubmit="handleProposalSubmit(event)">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; margin-bottom:14px;">
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:600; margin-bottom:4px;">Feature Title</label>
            <input type="text" id="prop-title" required placeholder="e.g. CME CF BRTI Volatility Cone Overlay" style="width:100%; box-sizing:border-box; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:8px 10px; color:#FFF; font-size:0.85rem;" />
          </div>
          <div>
            <label style="display:block; font-size:0.78rem; font-weight:600; margin-bottom:4px;">Station Category</label>
            <select id="prop-category" style="width:100%; box-sizing:border-box; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:8px 10px; color:#FFF; font-size:0.85rem;">
              <option value="radar">Settlement Radar</option>
              <option value="fees">True-Cost &amp; Saver</option>
              <option value="cockpit" selected>Flight Deck Cockpit</option>
              <option value="mobile">Mobile Experience</option>
              <option value="apis">Developer &amp; MCP</option>
            </select>
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block; font-size:0.78rem; font-weight:600; margin-bottom:4px;">Description &amp; Expected Value</label>
          <textarea id="prop-desc" rows="3" required placeholder="Explain why this feature improves trader discipline, reduces fees, or sharpens calibration..." style="width:100%; box-sizing:border-box; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:8px 10px; color:#FFF; font-size:0.85rem; font-family:var(--public-font-sans);"></textarea>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <button type="submit" class="action-btn btn-pro" style="padding:8px 18px; font-size:0.85rem; cursor:pointer;" id="btn-submit-proposal">
            Submit Proposal &rarr;
          </button>
          <button type="button" onclick="toggleSubmitForm()" style="background:transparent; border:none; color:#8A8F98; cursor:pointer; font-size:0.8rem;">
            Cancel
          </button>
        </div>
      </form>
    </div>

    <!-- Feature Items List -->
    <div id="feedback-list">
      ${itemsHtml}
    </div>
  </main>

  ${renderPublicFooter()}
  ${ASSISTANT_WIDGET_HTML}

  <script>
    function toggleSubmitForm() {
      const panel = document.getElementById('proposal-form-container');
      if (panel) {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
    }

    function upvoteFeature(id) {
      fetch('/api/feedback/' + encodeURIComponent(id) + '/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      .then(res => res.json())
      .then(data => {
        if (data.item) {
          const el = document.getElementById('vote-count-' + id);
          if (el) el.textContent = data.item.votes;
        }
      })
      .catch(err => console.error('Upvote failed:', err));
    }

    function handleProposalSubmit(e) {
      e.preventDefault();
      const title = document.getElementById('prop-title').value;
      const category = document.getElementById('prop-category').value;
      const description = document.getElementById('prop-desc').value;

      fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, description }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.item) {
          alert('Proposal submitted successfully! Added to board.');
          location.reload();
        }
      })
      .catch(err => alert('Submission failed: ' + err.message));
    }
  </script>
</body>
</html>`;
}
