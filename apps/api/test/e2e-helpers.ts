import { execSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { URL } from 'node:url';
import { hashSync } from 'bcryptjs';
import {
  AdminRole,
  FeatureRequestStatus,
  MembershipRole,
  PrismaClient,
  ProjectStatus,
  ProjectType,
} from '@prisma/client';

export async function prepareTestDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for e2e tests');
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  const uploadDir = process.env.UPLOAD_DIR;

  if (!databaseName.toLowerCase().includes('e2e')) {
    throw new Error(
      `Refusing to reset database "${databaseName}". E2E tests must target a database whose name contains "e2e".`,
    );
  }

  try {
    execSync(`createdb ${databaseName}`, {
      stdio: 'ignore',
      env: process.env,
    });
  } catch {
    // Database already exists or server manages creation differently.
  }

  execSync('pnpm prisma migrate reset --force --skip-seed', {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: process.env,
  });

  if (uploadDir) {
    await rm(uploadDir, { recursive: true, force: true });
    await mkdir(uploadDir, { recursive: true });
  }
}

export async function cleanupUploads() {
  const uploadDir = process.env.UPLOAD_DIR;

  if (!uploadDir) {
    return;
  }

  await rm(uploadDir, { recursive: true, force: true });
}

export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.adminAuditLog.deleteMany();
  await prisma.userInvitation.deleteMany();
  await prisma.featureRequestVote.deleteMany();
  await prisma.featureRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.lot.deleteMany();
  await prisma.project.deleteMany();
  await prisma.opportunityEvent.deleteMany();
  await prisma.workItemOption.deleteMany();
  await prisma.simulationWorkItem.deleteMany();
  await prisma.simulationLot.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.simulationFolder.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function seedUser(
  prisma: PrismaClient,
  input: {
    organizationName: string;
    organizationSlug: string;
    email: string;
    password: string;
    role?: MembershipRole;
    adminRole?: AdminRole;
    isPilotUser?: boolean;
    betaAccessEnabled?: boolean;
  },
) {
  const organization = await prisma.organization.create({
    data: {
      name: input.organizationName,
      slug: input.organizationSlug,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash: hashSync(input.password, 10),
      firstName: 'E2E',
      lastName: 'User',
      adminRole: input.adminRole ?? AdminRole.USER,
      isPilotUser: input.isPilotUser ?? false,
      betaAccessEnabled: input.betaAccessEnabled ?? false,
    },
  });

  await prisma.membership.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: input.role || MembershipRole.ADMIN,
    },
  });

  return {
    organization,
    user,
  };
}

export async function seedProject(
  prisma: PrismaClient,
  organizationId: string,
  input?: {
    name?: string;
    status?: ProjectStatus;
    type?: ProjectType;
  },
) {
  return prisma.project.create({
    data: {
      organizationId,
      name: input?.name || 'Projet E2E',
      type: input?.type || ProjectType.APARTMENT_BUILDING,
      status: input?.status || ProjectStatus.DRAFT,
      city: 'Paris',
      postalCode: '75010',
    },
  });
}

export async function seedFeatureRequest(
  prisma: PrismaClient,
  input: {
    organizationId: string;
    authorId: string;
    title?: string;
    description?: string;
    status?: FeatureRequestStatus;
    votesCount?: number;
  },
) {
  return prisma.featureRequest.create({
    data: {
      organizationId: input.organizationId,
      authorId: input.authorId,
      title: input.title ?? 'Idee E2E',
      description:
        input.description ??
        'Ajouter une vue simple pour fiabiliser la priorisation produit.',
      status: input.status ?? FeatureRequestStatus.OPEN,
      votesCount: input.votesCount ?? 0,
    },
  });
}
