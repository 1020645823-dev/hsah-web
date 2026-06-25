"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { me } from "@/lib/api";
import {
  ADMIN_AUTH_CHANGED_EVENT,
  clearStoredAdminToken,
  getStoredAdminToken,
} from "@/lib/admin";

export type AuthUser = {
  id: string;
  email: string;
  is_active: boolean;
  two_factor_enabled: boolean;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return getStoredAdminToken();
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const didInitRef = useRef(false);

  useEffect(() => {
    function handleAuthChanged() {
      if (getToken()) return;
      setUser(null);
      setIsLoading(false);
    }

    window.addEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(ADMIN_AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

  useLayoutEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const token = getToken();
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    me(token).then((res) => {
      if (res.ok) {
        setUser(res.data);
      } else {
        setUser(null);
        if (res.status === 401) {
          clearStoredAdminToken();
        }
      }
      setIsLoading(false);
    });
  }, []);

  return { user, isLoading };
}
