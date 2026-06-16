import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "@/lib/api/client";
import type { User } from "@/lib/api/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: { email: string; password: string; name: string }) => Promise<User>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(api.currentUser());
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await api.signIn(email, password);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (input: { email: string; password: string; name: string }) => {
    const u = await api.signUp(input);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{ user, loading, signIn, signUp, signOut, isAdmin: user?.role === "admin" }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
