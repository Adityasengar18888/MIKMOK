"use client";

import { ClerkProvider } from "@clerk/nextjs";

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_c21vb3RoLWJlYWdsZS03Ny5jbGVyay5hY2NvdW50cy5kZXYk";

export default function ClerkClientProvider({
  children,
  appearance,
}: {
  children: React.ReactNode;
  appearance?: any;
}) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={appearance}>
      {children}
    </ClerkProvider>
  );
}
