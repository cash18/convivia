/** Sostituisce segnaposti `{{chiave}}` in stringhe di traduzione. */
export function formatMessage(template: string, vars: Record<string, string | number> = {}): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{{${key}}}`).join(String(value));
  }
  return out;
}
