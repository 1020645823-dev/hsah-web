import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Global cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation for next-intl and components that use useRouter/usePathname
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/",
  useParams: () => ({ locale: "en" }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock localStorage for tests that rely on getStoredAdminToken
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
} as unknown as Storage;
