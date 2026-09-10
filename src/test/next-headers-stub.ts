// Stand-in for `next/headers` under Vitest (aliased in vitest.config.ts).
// Lets a test control what the Server Action sees for `headers()`.

let current = new Headers();

export function __setHeaders(init?: HeadersInit): void {
  current = new Headers(init);
}

export async function headers(): Promise<Headers> {
  return current;
}

export async function cookies(): Promise<{
  get: () => undefined;
  getAll: () => [];
  set: () => void;
}> {
  return { get: () => undefined, getAll: () => [], set: () => {} };
}
