export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TOKEN_KEY = "art-gallery-token";

export type UserRole = "artist" | "regular";

export interface UserPublic {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface UserMe extends UserPublic {
  email: string;
}

export interface ArtistProfile extends UserPublic {
  follower_count: number;
  gallery_count: number;
  is_followed: boolean;
}

export interface Gallery {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  owner: UserPublic;
  artwork_count: number;
  follower_count: number;
  is_followed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArtworkImage {
  id: string;
  url: string;
  position: number;
  is_primary: boolean;
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  is_for_sale: boolean;
  price_cents: number | null;
  images: ArtworkImage[];
  gallery: { id: string; title: string };
  artist: UserPublic;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  artwork_id: string;
  body: string;
  author: UserPublic;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: UserMe;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable (private mode); the session just won't persist.
  }
}

function errorMessage(status: number, body: unknown): string {
  const detail = (body as { detail?: unknown })?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors: [{ loc, msg }, ...]
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((d: { msg?: string }) => (d.msg ?? "Invalid value").replace(/^Value error, /, ""))
      .join(". ");
  }
  return `Request failed (${status})`;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, body));
  return body as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  put: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: data === undefined ? undefined : JSON.stringify(data) }),
  delete: <T = void>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const { url } = await apiFetch<{ url: string }>("/uploads", { method: "POST", body: form });
  return url;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function primaryImage(artwork: Artwork): ArtworkImage | undefined {
  return artwork.images.find((i) => i.is_primary) ?? artwork.images[0];
}
