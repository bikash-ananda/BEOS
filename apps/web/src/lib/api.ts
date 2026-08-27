import type { paths } from "./generated/api-schema";

const API_ROOT = "/api/v1";

type ReplacePathParameters<Value extends string> =
  Value extends `${infer Start}{${string}}${infer End}`
    ? `${Start}${string}${ReplacePathParameters<End>}`
    : Value;
type ContractPath = keyof paths & string;
type ClientPathFor<Value extends string> = Value extends `/api/v1${infer Path}`
  ? ReplacePathParameters<Path>
  : never;
type ClientPath = ClientPathFor<ContractPath>;
export type ApiPath = ClientPath | `${ClientPath}?${string}`;

interface ApiErrorBody {
  message?: string | string[];
  error?: { message?: string | string[] };
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
  const value = body?.message ?? body?.error?.message;
  return Array.isArray(value)
    ? value.join(". ")
    : (value ?? "The request could not be completed");
}

export async function apiFetch<T>(
  path: ApiPath,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const cannotRefresh = [
    "/auth/login",
    "/auth/refresh",
    "/auth/accept-invite",
    "/auth/complete-password-reset",
  ].includes(path);
  if (response.status === 401 && retry && !cannotRefresh) {
    const refreshed = await fetch(`${API_ROOT}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) return apiFetch<T>(path, init, false);
  }
  if (!response.ok)
    throw new ApiError(await parseError(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function jsonBody(value: unknown): Pick<RequestInit, "body"> {
  return { body: JSON.stringify(value) };
}
