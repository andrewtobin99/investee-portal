import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Sign in · Investee Portal" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold">Investee Portal</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your submissions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Use the email and password provided by your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* useSearchParams requires a Suspense boundary in the App Router. */}
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
