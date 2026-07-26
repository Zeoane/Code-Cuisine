/** Safely reads and JSON-parses a localStorage entry, falling back on any error. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Writes a value to localStorage as JSON, ignoring quota/serialisation errors. */
export function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full - data simply stays in memory for this session */
  }
}
