import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraId from "next-auth/providers/microsoft-entra-id";
import { authConfig } from "./config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

async function findOrCreateOAuthUser(email: string, name: string) {
  let user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true, avatar: true },
  });
  if (!user) {
    user = await db.user.create({
      data: { email, name, password: "", role: "reviewer", active: true },
      select: { id: true, role: true, avatar: true },
    });
  }
  // Auto-accept any pending org invites matching this email
  const invite = await db.orgInvite.findFirst({
    where: { email, accepted: false, expiresAt: { gt: new Date() } },
  });
  if (invite) {
    await db.orgMember.upsert({
      where: { organizationId_userId: { organizationId: invite.organizationId, userId: user.id } },
      create: { organizationId: invite.organizationId, userId: user.id, role: invite.role },
      update: {},
    });
    await db.orgInvite.update({ where: { id: invite.id }, data: { accepted: true } });
  }
  return user;
}

const ssoProviders = [
  ...(process.env.GOOGLE_CLIENT_ID ? [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ] : []),
  ...(process.env.MICROSOFT_CLIENT_ID ? [
    MicrosoftEntraId({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/v2.0`,
    }),
  ] : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email, active: true },
          select: { id: true, email: true, name: true, password: true, role: true, avatar: true },
        });
        if (!user) return null;
        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar };
      },
    }),
    ...ssoProviders,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // Credentials sign-in — user comes from authorize()
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        return token;
      }
      // OAuth sign-in — look up / create DB user by email
      if (account && account.provider !== "credentials" && token.email) {
        const dbUser = await findOrCreateOAuthUser(token.email, token.name ?? token.email);
        token.id = dbUser.id;
        token.role = dbUser.role;
        token.avatar = dbUser.avatar ?? null;
      }
      return token;
    },
  },
});
