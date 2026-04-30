// Honeypot field name. Bots tend to fill all fields including hidden ones.
export const HONEYPOT_FIELD = "website";

// Visually-hidden style for the honeypot input. Keeps it out of the tab order
// and screen readers but still present in the DOM for naive bots.
export const HONEYPOT_STYLE = {
  position: "absolute",
  left: "-9999px",
  width: "1px",
  height: "1px",
  overflow: "hidden",
} as const;

export function isHoneypotTriggered(formData: FormData): boolean {
  const value = formData.get(HONEYPOT_FIELD);
  return typeof value === "string" && value.trim().length > 0;
}
