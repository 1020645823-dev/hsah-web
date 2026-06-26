import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { LocaleSwitcher } from "./locale-switcher";

const mockReplace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/assets",
  useRouter: () => ({ replace: mockReplace }),
}));

afterEach(cleanup);

describe("LocaleSwitcher", () => {
  it("shows 中文 button when current locale is en", () => {
    render(<LocaleSwitcher locale="en" />);
    expect(screen.getByText("中文")).toBeTruthy();
  });

  it("shows EN button when current locale is zh", () => {
    render(<LocaleSwitcher locale="zh" />);
    expect(screen.getByText("EN")).toBeTruthy();
  });

  it("calls router.replace with zh when clicking from en", () => {
    render(<LocaleSwitcher locale="en" />);
    fireEvent.click(screen.getByText("中文"));
    expect(mockReplace).toHaveBeenCalledWith("/assets", { locale: "zh" });
  });
});
