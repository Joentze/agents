import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeError() {
  return (
    <div className="w-full flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was a problem authenticating your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The authentication process failed or was cancelled. This could be
            due to:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>Invalid or expired authentication code</li>
            <li>Redirect URL mismatch</li>
            <li>OAuth provider configuration issues</li>
          </ul>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/login">Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
