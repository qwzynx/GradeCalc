/**
 * Single source of truth for the facts the legal pages (Terms, Privacy,
 * Accessibility) state about who runs GradeMatrix and how. Edit these values
 * rather than the page copy so every document stays consistent.
 *
 * Bump TERMS_VERSION whenever the Terms or Privacy Policy change materially:
 * signed-in users whose accepted version differs are asked to re-accept.
 */
export const LEGAL = {
  siteName: "GradeMatrix",
  /** Who operates the service: your legal name, or a business name if registered. */
  operatorName: "the GradeMatrix developer",
  /** Where people send privacy requests, accessibility feedback and legal notices. */
  contactEmail: "mahan207gh@gmail.com",
  /** The person accountable for privacy compliance (PIPEDA Principle 1). */
  privacyOfficer: "the GradeMatrix developer",
  /** Governing law and courts for the Terms. */
  jurisdiction: "the Province of Ontario and the federal laws of Canada applicable therein",
  courts: "Toronto, Ontario",
  minimumAge: 16,
  /** Date the current documents took effect (ISO). */
  effectiveDate: "2026-09-26",
  /**
   * Google's Gemini API terms let Google use prompts and files sent through
   * its UNPAID tier to improve its products (human reviewers may read them).
   * Paid-tier traffic is not used that way. Set this to match the API key the
   * deployment actually uses — the Privacy Policy wording follows it.
   */
  aiProviderUsesDataForTraining: true,
  /** Business days within which we aim to answer privacy / accessibility requests. */
  responseDays: 30,
  accessibilityResponseDays: 5,
} as const;

export const TERMS_VERSION = "2026-09-26";

export function formatLegalDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
