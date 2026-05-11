-- CreateTable
CREATE TABLE "AuditPlanEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quarter" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "assignee" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "plannedDate" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditPlanEntry_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FindingResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "submittedById" TEXT,
    "content" TEXT NOT NULL,
    "responsible" TEXT,
    "plannedDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "aiEvaluation" TEXT,
    "aiScore" REAL,
    "reviewerNote" TEXT,
    "submittedAt" DATETIME,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FindingResponse_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'trial',
    "allowedDomains" TEXT,
    "ssoGoogle" BOOLEAN NOT NULL DEFAULT false,
    "ssoMicrosoft" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OrgMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'reviewer',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrgMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrgInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'reviewer',
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgInvite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditPlanEntry_quarter_kpiId_key" ON "AuditPlanEntry"("quarter", "kpiId");

-- CreateIndex
CREATE UNIQUE INDEX "FindingResponse_findingId_key" ON "FindingResponse"("findingId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrgMember_organizationId_userId_key" ON "OrgMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgInvite_token_key" ON "OrgInvite"("token");
