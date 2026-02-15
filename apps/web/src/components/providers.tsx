"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { env } from "@DUST/env/web";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMutation } from "convex/react";
import { api } from "@DUST/backend/convex/_generated/api";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

function UserSync() {
  const { isSignedIn, user } = useUser();
  const syncUser = useMutation(api.users.sync);

  useEffect(() => {
    if (isSignedIn && user) {
      syncUser({
        clerkId: user.id,
        username: user.username ?? user.firstName ?? "Archivist",
        avatarUrl: user.imageUrl,
      });
    }
  }, [isSignedIn, user, syncUser]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <UserSync />
        {children}
      </ConvexProviderWithClerk>
      <Toaster richColors />
    </ThemeProvider>
  );
}
