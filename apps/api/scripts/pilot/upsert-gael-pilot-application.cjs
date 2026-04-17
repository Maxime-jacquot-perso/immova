const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { PrismaClient, PilotApplicationEventType } = require('@prisma/client');

function loadLocalEnv() {
  const envFiles = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '.env.local')];

  for (const envFile of envFiles) {
    if (!existsSync(envFile)) {
      continue;
    }

    const content = readFileSync(envFile, 'utf8');

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith('#')) {
        continue;
      }

      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['\"]|['\"]$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const prisma = new PrismaClient();
const rawEmail = 'gael.marchand@gmaiL.com';
const normalizedEmail = rawEmail.trim().toLowerCase();

const payload = {
  firstName: 'Gaël',
  lastName: null,
  email: normalizedEmail,
  normalizedEmail,
  profileType: 'Investisseur immobilier',
  projectCount: '10+',
  problemDescription: 'je gère en direct + de 30 biens immo',
};

async function upsertGaelPilotApplication() {
  const existingApplication = await prisma.pilotApplication.findFirst({
    where: { normalizedEmail },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      organizationId: true,
      userId: true,
      invitationId: true,
      approvedAt: true,
      paymentConfirmedAt: true,
      activatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (existingApplication) {
    const updatedApplication = await prisma.pilotApplication.update({
      where: { id: existingApplication.id },
      data: payload,
      select: {
        id: true,
        status: true,
        organizationId: true,
        userId: true,
        invitationId: true,
        approvedAt: true,
        paymentConfirmedAt: true,
        activatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(
      JSON.stringify(
        {
          action: 'updated-existing',
          rawEmail,
          normalizedEmail,
          application: updatedApplication,
        },
        null,
        2,
      ),
    );

    return;
  }

  const acknowledgementAcceptedAt = new Date();
  const createdApplication = await prisma.$transaction(async (tx) => {
    const application = await tx.pilotApplication.create({
      data: {
        ...payload,
        acknowledgementAcceptedAt,
      },
      select: {
        id: true,
        status: true,
        organizationId: true,
        userId: true,
        invitationId: true,
        approvedAt: true,
        paymentConfirmedAt: true,
        activatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.pilotApplicationEvent.create({
      data: {
        pilotApplicationId: application.id,
        type: PilotApplicationEventType.SUBMITTED,
        message: 'Candidature seedée pour le cas concret de Gaël.',
        metadata: {
          source: 'script:pilot:gael',
          rawEmail,
          normalizedEmail,
        },
      },
    });

    return application;
  });

  console.log(
    JSON.stringify(
      {
        action: 'created',
        rawEmail,
        normalizedEmail,
        application: createdApplication,
      },
      null,
      2,
    ),
  );
}

upsertGaelPilotApplication()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(process.exitCode ?? 0);
  });
