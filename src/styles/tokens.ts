import fs from "node:fs";
import path from "node:path";

/**
 * Loads the unified design system CSS (public/index.css).
 */
export function getUnifiedDesignTokensCss(): string {
  const cssPath = path.resolve(process.cwd(), "public/index.css");
  return fs.readFileSync(cssPath, "utf-8");
}
