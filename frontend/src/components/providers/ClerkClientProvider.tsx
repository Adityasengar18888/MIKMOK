"use client";

import { ClerkProvider } from "@clerk/nextjs";

export default function ClerkClientProvider({
  children,
  appearance,
}: {
  children: React.ReactNode;
  appearance?: any;
}) {
  return (
    <ClerkProvider appearance={appearance}>
      {children}
    </ClerkProvider>
  );
}
