"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { FcGoogle } from "react-icons/fc";

import { SiGithub } from "@icons-pack/react-simple-icons";
import { Separator } from "../separator";
import {
  signInWithGoogleAction,
  signInWithGithubAction,
} from "@/app/actions/auth-actions";

interface LoginCardProps {
  redirectTo?: string;
}

export function LoginCard({ redirectTo }: LoginCardProps) {
  return (
    <Card className="w-full max-w-sm h-fit border border-border ring-2 ring-border/50 m-auto">
      <CardHeader>
        <CardTitle>Get started</CardTitle>
        <CardDescription>Login with your chosen provider</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          onClick={async () => await signInWithGoogleAction({ redirectTo })}
          variant="outline"
          className="w-full"
        >
          <FcGoogle />
          Login with Google
        </Button>
        <Separator className="w-full"></Separator>

        <Button
          onClick={async () => await signInWithGithubAction({ redirectTo })}
          variant="outline"
          className="w-full"
        >
          <SiGithub />
          Login with Github
        </Button>
      </CardContent>
    </Card>
  );
}
