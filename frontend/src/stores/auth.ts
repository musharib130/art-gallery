import { create } from "zustand";

import { api, getToken, setToken, type TokenOut, type UserMe } from "@/lib/api";

interface SignupData {
  email: string;
  password: string;
  username: string;
  display_name: string;
}

interface AuthState {
  user: UserMe | null;
  /** False until the stored token has been checked. */
  ready: boolean;
  /** Validate the stored token; called once on the client by <AuthBootstrap>. */
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  setUser: (user: UserMe) => void;
}

function applyToken(res: TokenOut) {
  setToken(res.access_token);
  return { user: res.user };
}

export const useAuth = create<AuthState>()((set) => ({
  user: null,
  ready: false,

  init: async () => {
    // The token lives in localStorage, so it can only be checked in the browser.
    if (getToken()) {
      try {
        set({ user: await api.get<UserMe>("/auth/me") });
      } catch {
        setToken(null);
      }
    }
    set({ ready: true });
  },

  login: async (email, password) => {
    set(applyToken(await api.post<TokenOut>("/auth/login", { email, password })));
  },

  signup: async (data) => {
    set(applyToken(await api.post<TokenOut>("/auth/signup", data)));
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));
