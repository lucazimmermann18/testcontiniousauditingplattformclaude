import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OrgClient } from "./OrgClient";

export const metadata = { title: "Organisation · Continuum Audit" };

export default async function OrgPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role as string;
  if (role !== "admin" && role !== "head_of_audit") redirect("/");

  const ssoConfigured = {
    google: !!process.env.GOOGLE_CLIENT_ID,
    microsoft: !!process.env.MICROSOFT_CLIENT_ID,
  };

  return <OrgClient ssoConfigured={ssoConfigured} />;
}
