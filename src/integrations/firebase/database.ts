const FIREBASE_DB_URL = import.meta.env.VITE_FIREBASE_DB_URL?.replace(/\/$/, "");

if (!FIREBASE_DB_URL) {
  throw new Error("Missing VITE_FIREBASE_DB_URL environment variable.");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type Query =
  | Record<string, string | number | boolean | undefined>
  | URLSearchParams
  | undefined;

const cleanPath = (path: string) => path.replace(/^\//, "");

const buildUrl = (path: string, query: Query) => {
  const url = new URL(`${FIREBASE_DB_URL}/${cleanPath(path)}.json`);

  if (query instanceof URLSearchParams) {
    url.search = query.toString();
  } else if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    url.search = params.toString();
  }

  return url.toString();
};

const request = async <T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  query?: Query,
): Promise<T> => {
  const url = buildUrl(path, query);

  const response = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Firebase request failed (${response.status} ${response.statusText}): ${message || "empty response"}`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("Failed to parse Firebase response:", error);
    throw new Error("Unexpected response from Firebase.");
  }
};

export const firebaseDb = {
  get: async <T>(path: string, query?: Query): Promise<T | null> =>
    request<T | null>("GET", path, undefined, query),
  set: async <T>(path: string, value: T): Promise<T> => request<T>("PUT", path, value),
  update: async <T extends object>(path: string, value: T): Promise<T> =>
    request<T>("PATCH", path, value),
  push: async <T>(path: string, value: T): Promise<{ name: string }> =>
    request<{ name: string }>("POST", path, value),
  remove: async (path: string): Promise<void> => {
    await request("DELETE", path);
  },
};
