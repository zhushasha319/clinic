"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";

type Props = {
  messages: Record<string, unknown>;
  locale: string;
  timeZone: string;
  children: ReactNode;
};

export function IntlProvider({ messages, locale, timeZone, children }: Props) {
  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone={timeZone}
    >
      {children}
    </NextIntlClientProvider>
  );
}
