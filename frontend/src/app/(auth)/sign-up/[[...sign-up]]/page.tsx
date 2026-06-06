"use client";

import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="flex justify-center">
      <SignUp
        fallbackRedirectUrl="/feed"
        signInUrl="/sign-in"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-card border border-border shadow-2xl shadow-black/20 rounded-2xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "border-border bg-muted hover:bg-muted/80 text-foreground",
            formFieldLabel: "text-muted-foreground",
            formFieldInput:
              "bg-input border-border text-foreground focus:ring-2 focus:ring-[#40E0D0]/50",
            formButtonPrimary:
              "bg-gradient-to-r from-[#40E0D0] to-[#00CED1] hover:opacity-90 shadow-lg shadow-[#40E0D0]/20",
            footerActionLink: "text-[#40E0D0] hover:text-[#40E0D0]/80",
            dividerLine: "bg-border",
            dividerText: "text-muted-foreground",
          },
        }}
      />
    </div>
  );
}
