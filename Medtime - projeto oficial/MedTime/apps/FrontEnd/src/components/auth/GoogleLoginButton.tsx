"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthProvider";

const windowWidth = 800;
const windowHeight = 400;

export function GoogleLoginButton({ onSuccess }: { onSuccess?: () => void }) {
  const { googleLogin } = useAuth();

  const handleClick = () => {
    if (typeof window === "undefined") {
      return;
    }
    const url = `${process.env.NEXT_PUBLIC_ZOER_HOST}/auth/google/v1/login?fromUrl=${window.location.href}&appCode=${process.env.NEXT_PUBLIC_APP_CODE}`;

    const left = Math.floor((window.screen.width - windowWidth) / 2);
    const top = Math.floor((window.screen.height - windowHeight) / 2);
    const popupWindow = window.open(
      url,
      "_blank",
      `width=${windowWidth},height=${windowHeight},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popupWindow) {
      return;
    }

    let closedCheckTimer: number | null = null;

    const cleanup = () => {
      window.removeEventListener("message", onMessage as EventListener);
      if (closedCheckTimer) {
        window.clearInterval(closedCheckTimer);
        closedCheckTimer = null;
      }
      try {
        popupWindow.close();
      } catch {}
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== popupWindow) return;

      const data = event.data || {};
      const messageType = data.type || data.event || "";
      if (messageType !== "zoer-google-login") return;

      googleLogin(data.access_token).then(() => {
        onSuccess?.();
      });

      cleanup();
      try {
        window.focus();
      } catch {}
    };

    window.addEventListener("message", onMessage as EventListener);

    closedCheckTimer = window.setInterval(() => {
      if (popupWindow.closed) {
        cleanup();
      }
    }, 500);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={`w-full`}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-sm font-medium">Continue with Google</span>
    </Button>
  );
}
