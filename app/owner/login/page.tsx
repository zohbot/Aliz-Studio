import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerLoginForm } from "@/components/owner-login-form";
import { getOwnerCredentials, getOwnerSession, shouldShowDemoOwnerCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Owner Login"
};

type OwnerLoginPageProps = {
  searchParams?: Promise<{
    loggedOut?: string;
  }>;
};

export default async function OwnerLoginPage({ searchParams }: OwnerLoginPageProps) {
  const session = await getOwnerSession();

  if (session) {
    redirect("/owner/dashboard");
  }

  const credentials = getOwnerCredentials();
  const params = await searchParams;

  return (
    <section className="owner-login-shell">
      <OwnerLoginForm
        demoEmail={credentials.email}
        demoPassword={credentials.password}
        statusMessage={params?.loggedOut ? "You have been logged out. Sign in again to continue." : ""}
        showDemoCredentials={shouldShowDemoOwnerCredentials()}
      />
    </section>
  );
}
