/**
 * credits.md parser.
 *
 * Format (one entry per line):
 *
 *   directed by — Kira Uteshkaliev, Gosha Mirchuk
 *   produced & 1st ad — Ivan Sokolovskiy
 *   art assistant — Maria Vicent
 *   art assistant — Martha Cervera
 *
 *   special thanks — Arkadiy Doroshenko, Aleksandra Maliugina
 *
 * Rules:
 *   - Role (lhs) is lowercased, kept verbatim otherwise.
 *   - Names (rhs) are split by ",". Single entries containing "&" are left intact,
 *     so "Kira Uteshkaliev & Gosha Mirchuk" displays as one combined credit line.
 *   - "special thanks" is hoisted into its own field.
 *   - Blank lines are ignored. Lines starting with "#" are treated as comments.
 *   - Em-dash (—), en-dash (–), and ascii double-hyphen (--) all work as separators.
 */

export interface CreditEntry {
  role: string;
  names: string[];
}

export interface ParsedCredits {
  credits: CreditEntry[];
  specialThanks: string[];
}

const SEP = /\s*(?:—|–|--)\s*/;

export function parseCredits(text: string): ParsedCredits {
  const credits: CreditEntry[] = [];
  const specialThanks: string[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(SEP);
    if (parts.length < 2) continue;

    const role = parts[0].trim().toLowerCase();
    // Re-join in case the names side contained a dash (shouldn't, but be safe).
    const namesRaw = parts.slice(1).join(' — ').trim();
    const names = namesRaw
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    if (!names.length) continue;

    if (role === 'special thanks') {
      // Accumulate — supports either one combined line OR multiple "special thanks" lines.
      specialThanks.push(...names);
    } else {
      credits.push({ role, names });
    }
  }

  return { credits, specialThanks };
}

/** True if the parsed result has any user-visible content. */
export function creditsHaveContent(parsed: ParsedCredits): boolean {
  return parsed.credits.length > 0 || parsed.specialThanks.length > 0;
}
