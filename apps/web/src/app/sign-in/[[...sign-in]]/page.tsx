"use client";

import { SignIn } from "@clerk/nextjs";
import { ScanlineOverlay } from "@/components/ui/scanline-overlay";
import { ParticleField } from "@/components/ui/particle-field";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-void">
      <ParticleField particleCount={40} />
      <ScanlineOverlay />
      <div className="relative z-10">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/play"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-surface border border-white/10 rounded-none shadow-[0_0_30px_rgba(0,255,136,0.1)]",
              headerTitle: "font-mono text-text-primary",
              headerSubtitle: "font-sans text-text-secondary",
              socialButtonsBlockButton:
                "bg-elevated border border-white/10 rounded-none text-text-primary hover:bg-white/5",
              formButtonPrimary:
                "bg-archive/20 border border-archive/40 text-archive rounded-none hover:bg-archive/30 font-mono uppercase tracking-wider",
              formFieldInput:
                "bg-elevated border border-white/10 rounded-none text-text-primary font-sans",
              formFieldLabel: "font-sans text-text-secondary",
              footerActionLink: "text-archive hover:text-archive/80",
              identityPreview: "bg-elevated border border-white/10 rounded-none",
              formFieldAction: "text-scan",
            },
          }}
        />
      </div>
    </div>
  );
}
