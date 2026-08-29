/** Remove a trailing "| Call My Tailor" (or with · / -) so the metadata
 *  template can re-append the brand consistently. */
export function pageTitle(raw: string): string {
  return raw.replace(/\s*[|·—-]\s*Call My Tailor\s*$/i, "").trim() || raw;
}
