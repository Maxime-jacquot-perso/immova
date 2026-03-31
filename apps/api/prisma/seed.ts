import {
  AdminRole,
  FeatureRequestStatus,
  MembershipRole,
  PrismaClient,
  ProjectStatus,
  ProjectType,
} from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Invest',
      slug: 'demo-org',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      adminRole: AdminRole.SUPER_ADMIN,
      isSuspended: false,
      isPilotUser: true,
      betaAccessEnabled: true,
    },
    create: {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'Demo',
      passwordHash: hashSync('admin123', 10),
      adminRole: AdminRole.SUPER_ADMIN,
      isPilotUser: true,
      betaAccessEnabled: true,
    },
  });

  const standardUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      adminRole: AdminRole.USER,
      isSuspended: false,
    },
    create: {
      email: 'user@example.com',
      firstName: 'User',
      lastName: 'Demo',
      passwordHash: hashSync('user123', 10),
      adminRole: AdminRole.USER,
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: MembershipRole.ADMIN },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: MembershipRole.ADMIN,
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: standardUser.id,
      },
    },
    update: { role: MembershipRole.MANAGER },
    create: {
      organizationId: organization.id,
      userId: standardUser.id,
      role: MembershipRole.MANAGER,
    },
  });

  await prisma.project.upsert({
    where: { id: 'demo-project-seed-id' },
    update: {},
    create: {
      id: 'demo-project-seed-id',
      organizationId: organization.id,
      name: 'Immeuble rue Victor Hugo',
      reference: 'DEMO-001',
      city: 'Lille',
      postalCode: '59000',
      type: ProjectType.APARTMENT_BUILDING,
      status: ProjectStatus.ACQUISITION,
    },
  });

  await prisma.featureRequest.upsert({
    where: { id: 'demo-idea-export-summary' },
    update: {
      title: 'Exporter un resume CSV plus lisible',
      description:
        "Ajouter un export plus lisible pour partager rapidement l'etat d'un projet avec un comptable ou un associe.",
      status: FeatureRequestStatus.OPEN,
      votesCount: 1,
      authorId: user.id,
      organizationId: organization.id,
    },
    create: {
      id: 'demo-idea-export-summary',
      organizationId: organization.id,
      authorId: user.id,
      title: 'Exporter un resume CSV plus lisible',
      description:
        "Ajouter un export plus lisible pour partager rapidement l'etat d'un projet avec un comptable ou un associe.",
      status: FeatureRequestStatus.OPEN,
      votesCount: 1,
    },
  });

  await prisma.featureRequest.upsert({
    where: { id: 'demo-idea-beta-checklist' },
    update: {
      title: 'Checklist beta pour la validation avant release',
      description:
        "Afficher une checklist tres legere pour verifier qu'une nouveaute est assez stable avant release globale.",
      status: FeatureRequestStatus.IN_PROGRESS,
      votesCount: 1,
      authorId: standardUser.id,
      organizationId: organization.id,
    },
    create: {
      id: 'demo-idea-beta-checklist',
      organizationId: organization.id,
      authorId: standardUser.id,
      title: 'Checklist beta pour la validation avant release',
      description:
        "Afficher une checklist tres legere pour verifier qu'une nouveaute est assez stable avant release globale.",
      status: FeatureRequestStatus.IN_PROGRESS,
      votesCount: 1,
    },
  });

  await prisma.featureRequestVote.upsert({
    where: {
      featureRequestId_userId: {
        featureRequestId: 'demo-idea-export-summary',
        userId: standardUser.id,
      },
    },
    update: {
      organizationId: organization.id,
    },
    create: {
      organizationId: organization.id,
      featureRequestId: 'demo-idea-export-summary',
      userId: standardUser.id,
    },
  });

  await prisma.featureRequestVote.upsert({
    where: {
      featureRequestId_userId: {
        featureRequestId: 'demo-idea-beta-checklist',
        userId: user.id,
      },
    },
    update: {
      organizationId: organization.id,
    },
    create: {
      organizationId: organization.id,
      featureRequestId: 'demo-idea-beta-checklist',
      userId: user.id,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
