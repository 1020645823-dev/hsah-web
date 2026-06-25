"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AuthRedirectPanel } from "@/components/auth/auth-redirect-panel";

export function RouteGuard({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      const nextPath = pathname || "/admin";
      router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isLoading, pathname, requireAuth, router, user]);

  if (isLoading) {
    return (
      <AuthRedirectPanel message="Checking your session before loading admin tools." />
    );
  }

  if (requireAuth && !user) {
    return <AuthRedirectPanel message="You need to sign in before accessing admin routes." />;
  }

  return <>{children}</>;
}
