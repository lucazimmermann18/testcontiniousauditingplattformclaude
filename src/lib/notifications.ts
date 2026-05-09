import { db } from "@/lib/db";

export async function notifyMentions(text: string, authorId: string, kpiId: string) {
  const mentionPattern = /@(\w+\.\w+)/g;
  const mentions = [...text.matchAll(mentionPattern)].map((m) => m[1]);
  if (mentions.length === 0) return;

  const users = await db.user.findMany({
    where: {
      email: { in: mentions.map((m) => `${m}@continuum-audit.de`) },
      id: { not: authorId },
    },
    select: { id: true },
  });

  await Promise.all(
    users.map((u) =>
      db.notification.create({
        data: {
          userId: u.id,
          type: "comment_mention",
          message: "Du wurdest in einem Kommentar erwähnt",
          metadata: JSON.stringify({ kpiId }),
        },
      })
    )
  );
}

export async function notifyUsers(
  userIds: string[],
  type: string,
  message: string,
  metadata?: Record<string, string>
) {
  await Promise.all(
    userIds.map((userId) =>
      db.notification.create({
        data: {
          userId,
          type: type as any,
          message,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        },
      })
    )
  );
}
