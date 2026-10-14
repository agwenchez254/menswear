/** VITE_* variables are baked into the public bundle: names that look like secrets must never be set. */
export function forbiddenEnvNames(env) {
  return Object.keys(env).filter((k) => k.startsWith("VITE_") && /SECRET|PASSWORD|PRIVATE/i.test(k));
}
