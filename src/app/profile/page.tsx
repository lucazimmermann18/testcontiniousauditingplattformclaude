import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "Profil · Continuum Audit" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <ProfileClient />;
}
