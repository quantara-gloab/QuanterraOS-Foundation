/**
 * QuanterraOS Route Map & Retired URL 301 Redirect Engine
 *
 * Implements Phase 3 Task 3.4:
 * "Route map (2.1) + 301s for every retired URL. Accept: old sitemap crawl -> 0 x 404."
 *
 * Maps every retired URL from the v1 architecture to its canonical v2 destination:
 * - /calculator, /compare -> /check
 * - /paper, /predictions, /autopilot, /journal, /mobile, /wallet -> /deck
 * - /spread, /matrix, /flow, /settlement, /corridors, /divergence, /index -> /radar
 * - /calibration*, /study, /methodology, /research, /transparency, /council, /why -> /proof
 * - /educators -> /learn
 * - /mcp -> /developers
 * - /radar/audio -> /proof#sonification
 * - /growth -> /
 */

import type { Request, Response, NextFunction } from "express";

export const RETIRED_URL_REDIRECTS: Record<string, string> = {
  // Check / Cost
  "/calculator": "/check",
  "/compare": "/check",
  "/cost": "/check",
  "/fee-calculator": "/check",

  // Radar / Microstructure
  "/spread": "/radar",
  "/matrix": "/radar",
  "/flow": "/radar",
  "/settlement": "/radar",
  "/corridors": "/radar",
  "/divergence": "/radar",
  "/index": "/radar",
  "/scanner": "/radar",

  // Proof / Calibration / Methodology
  "/calibration": "/proof",
  "/calibration/explorer": "/proof",
  "/calibration-surface": "/proof",
  "/study": "/proof",
  "/methodology": "/proof",
  "/research": "/proof",
  "/transparency": "/proof",
  "/council": "/proof",
  "/why": "/proof",
  "/vs": "/proof",
  "/trustos": "/proof",
  "/pilot": "/proof",
  "/radar/audio": "/proof#sonification",

  // Deck / Stations
  "/paper": "/deck",
  "/predictions": "/deck",
  "/autopilot": "/deck",
  "/journal": "/deck",
  "/mobile": "/deck",
  "/wallet": "/deck",

  // Other Public Canonical Routes
  "/educators": "/learn",
  "/mcp": "/developers",
  "/growth": "/",
};

/**
 * Resolves a redirect destination for any retired URL, supporting exact and prefix matching.
 */
export function getRetiredRouteRedirect(urlPath: string): string | null {
  const normalized = urlPath.toLowerCase().replace(/\/+$/, "") || "/";

  // 1. Direct match
  if (RETIRED_URL_REDIRECTS[normalized]) {
    return RETIRED_URL_REDIRECTS[normalized];
  }

  // 2. Prefix matching for /calibration/*
  if (normalized.startsWith("/calibration/") || normalized.startsWith("/calibration-")) {
    return "/proof";
  }

  return null;
}

/**
 * Express middleware for executing 301 Permanent Redirects on retired URLs.
 */
export function retiredRouteRedirectMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const destination = getRetiredRouteRedirect(req.path);
  if (destination) {
    res.redirect(301, destination);
    return;
  }
  next();
}
