"use client";

import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-2">
          <a
            href="/sign-in"
            className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-text-secondary border border-white/10 hover:text-text-primary hover:border-white/20 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-archive border border-archive/30 hover:bg-archive/10 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </SignedOut>
      <SignedIn>
        <SignedInMenu />
      </SignedIn>
    </>
  );
}

function SignedInMenu() {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 border border-white/10 hover:border-white/20 transition-colors outline-none cursor-pointer">
        <img
          src={user.imageUrl}
          alt=""
          className="h-6 w-6 rounded-full"
        />
        <span className="font-mono text-xs text-text-secondary">
          {user.username ?? user.firstName ?? "Archivist"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-surface border border-white/10 min-w-[160px]">
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-text-secondary hover:text-text-primary"
          onClick={() => openUserProfile()}
        >
          <Settings className="h-3.5 w-3.5" />
          Manage Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-decay hover:text-decay"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
