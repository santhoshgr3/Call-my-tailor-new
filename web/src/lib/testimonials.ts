/** Setting key for the general Google reviews link used on the Testimonials page. */
export const GOOGLE_REVIEWS_KEY = "google_reviews_url";

/** Fallback when no Google reviews link has been set in admin: Google's results (with the business panel). */
export const GOOGLE_REVIEWS_FALLBACK = "https://www.google.com/search?q=Call+My+Tailor+reviews";

export const isGoogleLink = (url: string | null | undefined) => /google\.|g\.page|goo\.gl/i.test(url ?? "");

/** YouTube video id from a URL (watch, youtu.be, shorts, embed) or a bare id. */
export function youtubeId(url: string | null | undefined): string | null {
  const s = (url ?? "").trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
