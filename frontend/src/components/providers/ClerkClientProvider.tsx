"use client";

import { ClerkProvider } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

export default function ClerkClientProvider({
  children,
  publishableKey,
  appearance,
}: {
  children: React.ReactNode;
  publishableKey: string;
  appearance?: any;
}) {
  const router = useRouter();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={appearance}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
    >
      {children}
    </ClerkProvider>
  );
}
