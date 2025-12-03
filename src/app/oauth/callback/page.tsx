// pages/oauth/callback.tsx or similar
"use client";
import { Loader } from "@/components/ai-elements/loader";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    console.log("code", code);
    console.log("error", error);
    if (code) {
      // Store the authorization code
      sessionStorage.setItem("oauth_code", code);
      // Redirect back to your app
      router.push("/");
    } else if (error) {
      // Handle error - show message or redirect with error
      console.error("OAuth error:", error);
      router.push("/?error=auth_failed");
    }
  }, []);

  return (
    <div className="w-full flex h-screen items-center justify-center">
      <div className="flex flex-col gap-2">
        <Loader />
        <Shimmer className="text-sm text-muted-foreground font-mono">
          Connecting to MCP...
        </Shimmer>
      </div>
    </div>
  );
}
