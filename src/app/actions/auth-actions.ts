"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signInWithGoogleAction({
  redirectTo = "/",
}: {
  redirectTo?: string;
}) {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    console.error("Missing origin header");
    return redirect("/login?error=OriginMissing");
  }

  // Get the redirect path from form data

  // Build the callback URL with optional "next" parameter
  let callbackUrl = `${origin}/auth/callback`;
  if (redirectTo) {
    callbackUrl += `?next=${redirectTo}`;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "OAuthSigninFailed");
    errorUrl.searchParams.set("message", error.message);
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    return redirect(errorUrl.toString());
  }

  if (data.url) {
    return redirect(data.url);
  } else {
    console.error("signInWithOAuth did not return a URL");
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "OAuthConfigurationError");
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    return redirect(errorUrl.toString());
  }
}

export async function signInWithGithubAction({
  redirectTo = "/",
}: {
  redirectTo?: string;
}) {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (!origin) {
    console.error("Missing origin header");
    return redirect("/login?error=OriginMissing");
  }

  // Get the redirect path from form data

  // Build the callback URL with optional "next" parameter
  let callbackUrl = `${origin}/auth/callback`;
  if (redirectTo) {
    callbackUrl += `?next=${redirectTo}`;
  }
  console.log("callbackUrl", callbackUrl);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    console.error("Error signing in with Github:", error);
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "OAuthSigninFailed");
    errorUrl.searchParams.set("message", error.message);
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    return redirect(errorUrl.toString());
  }

  if (data.url) {
    return redirect(data.url);
  } else {
    console.error("signInWithOAuth did not return a URL");
    const errorUrl = new URL("/login", origin);
    errorUrl.searchParams.set("error", "OAuthConfigurationError");
    if (redirectTo) {
      errorUrl.searchParams.set("redirect", redirectTo);
    }
    return redirect(errorUrl.toString());
  }
}

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    return redirect(
      `/login?error=SignOutFailed&message=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/login");
}
