import {
  AdminRole,
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
    },
    create: {
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'Demo',
      passwordHash: hashSync('admin123', 10),
      adminRole: AdminRole.SUPER_ADMIN,
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
