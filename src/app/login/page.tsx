"use client";
import { LoginCard } from "@/components/ui/auth/login";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  return (
    <div className="w-full flex h-screen items-center justify-center">
      <LoginCard redirectTo={redirect ?? "/"} />
    </div>
  );
}
