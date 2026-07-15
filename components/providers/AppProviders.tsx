"use client";

import { useEffect, useState } from "react";
import { ToastViewport } from "@/components/ui/Toast";

/**
 * Gates rendering until zustand-persist rehydrates from localStorage so the
 * server-rendered shell never mismatches with persisted client state.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
              <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" />
            </svg>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <ToastViewport />
    </>
  );
}
