type Entry = { count: number; resetAt: number };

const attempts = new Map<string, Entry>();
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (entry.resetAt <= Date.now()) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearFailures(key: string): void {
  attempts.delete(key);
}