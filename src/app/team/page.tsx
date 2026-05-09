import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TeamClient } from "./TeamClient";

export const metadata = { title: "Team · Continuum Audit" };

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "head_of_audit") redirect("/");
  return <TeamClient />;
}
