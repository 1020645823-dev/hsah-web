"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("RouteGuard");

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      const nextPath = pathname || "/admin";
      router.replace(`/auth/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [isLoading, pathname, requireAuth, router, user]);

  if (isLoading) {
    return (
      <AuthRedirectPanel message={t("checkingMessage")} />
    );
  }

  if (requireAuth && !user) {
    return <AuthRedirectPanel message={t("signinRequired")} />;
  }

  return <>{children}</>;
}
