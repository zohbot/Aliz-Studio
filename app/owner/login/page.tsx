import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OwnerLoginForm } from "@/components/owner-login-form";
import { getOwnerCredentials, getOwnerSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Owner Login"
};

export default async function OwnerLoginPage() {
  const session = await getOwnerSession();

  if (session) {
    redirect("/owner/dashboard");
  }

  const credentials = getOwnerCredentials();

  return (
    <section className="owner-login-shell">
      <OwnerLoginForm demoEmail={credentials.email} demoPassword={credentials.password} />
    </section>
  );
}
