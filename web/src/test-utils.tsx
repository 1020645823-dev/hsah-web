import { NextIntlClientProvider } from "next-intl";
import { render as rtlRender } from "@testing-library/react";
import type { ReactElement } from "react";

import enMessages from "../messages/en.json";

export function renderWithIntl(ui: ReactElement, locale = "en") {
  return rtlRender(
    <NextIntlClientProvider locale={locale} messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

export * from "@testing-library/react";
export { renderWithIntl as render };
