export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s().-]/g, "");
  return /^\+?\d{9,15}$/.test(cleaned) ? cleaned : null;
}

// Used later for order tracking: compares the last 9 digits.
export function phoneMatchKey(phone: string): string {
  return phone.replace(/\D/g, "").slice(-9);
}