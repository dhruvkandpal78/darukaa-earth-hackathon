/** One request helper handles real API authentication and readable errors for all forms. */
let token: string | null = null;
/** Keep credentials in memory so a shared browser does not retain access after closing. */
export function setToken(value: string | null) {
  token = value;
}
/** Translate server validation errors into text instead of leaking implementation details to the interface. */
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || ""}/api${path}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth"))
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(
      typeof result?.detail === "string"
        ? result.detail
        : Array.isArray(result?.detail)
          ? result.detail.map((e: { msg: string }) => e.msg).join(" ")
          : "The service is unavailable. Please try again.",
    );
  }
  return result;
}
