import { hashSync } from 'bcryptjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  AdminRole,
  DocumentType,
  ExpenseCategory,
  FeatureRequestStatus,
  FinancingMode,
  LotStatus,
  LotType,
  MembershipRole,
  OpportunityEventType,
  PaymentStatus,
  Prisma,
  PrismaClient,
  ProjectStatus,
  ProjectType,
  SimulationOptionGroupType,
  SimulationOptionSource,
  SimulationPropertyType,
  SimulationStrategy,
  SimulationLotType,
} from '@prisma/client';
import { resetDemoData } from './reset-demo-data';
import { buildSimulationConversionPlan } from '../../src/simulations/simulation-conversion.util';
import { buildSimulationResults } from '../../src/simulations/simulation-metrics.util';
import { buildSimulationRuntimeState } from '../../src/simulations/simulation-resolver.util';

const prisma = new PrismaClient();

const MAIN_ORGANIZATION_ID = 'org-demo-main';
const MAIN_ORGANIZATION_NAME = 'Noroit Invest';
const MAIN_ORGANIZATION_SLUG = 'noroit-invest';

const USERS = {
  admin: {
    id: 'user-demo-admin',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Camille',
    lastName: 'Durand',
    adminRole: AdminRole.SUPER_ADMIN,
    membershipRole: MembershipRole.ADMIN,
    isPilotUser: true,
    betaAccessEnabled: true,
  },
  collaborator: {
    id: 'user-demo-collaborator',
    email: 'user@example.com',
    password: 'user123',
    firstName: 'Lucas',
    lastName: 'Martin',
    adminRole: AdminRole.USER,
    membershipRole: MembershipRole.MANAGER,
    isPilotUser: false,
    betaAccessEnabled: false,
  },
  reader: {
    id: 'user-demo-reader',
    email: 'reader@example.com',
    password: 'reader123',
    firstName: 'Sophie',
    lastName: 'Bernard',
    adminRole: AdminRole.USER,
    membershipRole: MembershipRole.READER,
    isPilotUser: false,
    betaAccessEnabled: false,
  },
} as const;

const MAIN_PROJECTS = {
  roubaisHealthy: {
    projectId: 'demo-project-seed-id',
    simulationId: 'simulation-roubaix-center',
    folderId: 'folder-yield-lille',
    folderName: 'Rendement locatif - Metropole lilloise',
  },
  lilleWatch: {
    projectId: 'project-lille-fives-watch',
    simulationId: 'simulation-lille-fives',
  },
  tourcoingProblem: {
    projectId: 'project-tourcoing-division',
    simulationId: 'simulation-tourcoing-division',
    folderId: 'folder-flip-hdf',
    folderName: 'Marchand / division - Hauts-de-France',
  },
  arrasIncomplete: {
    projectId: 'project-arras-mixed-incomplete',
  },
  valenciennesScenario: {
    projectId: 'project-valenciennes-coliving',
    simulationId: 'simulation-valenciennes-coliving',
  },
  lensDrift: {
    projectId: 'project-lens-renovation',
    simulationId: 'simulation-lens-renovation',
  },
} as const;

const uploadDir = resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');

type SeedUserConfig = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  adminRole: AdminRole;
  membershipRole: MembershipRole;
  isPilotUser: boolean;
  betaAccessEnabled: boolean;
};

type ProjectLotSeed = {
  id: string;
  name: string;
  reference?: string;
  type: LotType;
  status: LotStatus;
  surface?: number;
  estimatedRent?: number | null;
  notes?: string;
};

type ProjectExpenseSeed = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  amountHt: number;
  vatAmount: number;
  amountTtc: number;
  category: ExpenseCategory;
  paymentStatus?: PaymentStatus;
  vendorName: string;
  comment: string;
  lotId?: string;
};

type ProjectDocumentSeed = {
  id: string;
  title: string;
  type: DocumentType;
  originalFileName: string;
  mimeType: string;
  content: string;
  expenseId?: string;
};

type SimulationLotSeed = {
  id: string;
  name: string;
  type: SimulationLotType;
  surface?: number;
  estimatedRent?: number | null;
  targetResaleValue?: number | null;
  notes?: string;
};

type OpportunityEventSeed = {
  id: string;
  type: OpportunityEventType;
  title: string;
  description?: string;
  eventDate: string;
  impact?: string;
};

type OptionValueSeed = Record<string, unknown>;

type SimulationOptionSeed = {
  id: string;
  label: string;
  valueJson: OptionValueSeed;
  source?: SimulationOptionSource;
  sourceEventId?: string;
};

type SimulationOptionGroupSeed = {
  id: string;
  type: SimulationOptionGroupType;
  label: string;
  options: SimulationOptionSeed[];
  activationSequence?: Array<{
    optionId: string;
    activatedByUserId: string;
    activatedAt: string;
  }>;
};

type SimulationSeedConfig = {
  id: string;
  folderId: string;
  name: string;
  address: string;
  strategy: SimulationStrategy;
  propertyType: SimulationPropertyType;
  departmentCode: string;
  isFirstTimeBuyer?: boolean;
  purchasePrice: number;
  furnitureValue?: number;
  estimatedDisbursements?: number;
  worksBudget: number;
  financingMode: FinancingMode;
  downPayment?: number;
  loanAmount?: number;
  interestRate?: number;
  loanDurationMonths?: number;
  estimatedProjectDurationMonths?: number;
  targetResalePrice?: number;
  targetMonthlyRent?: number;
  bufferAmount?: number;
  notes?: string;
  lots?: SimulationLotSeed[];
  events?: OpportunityEventSeed[];
  optionGroups?: SimulationOptionGroupSeed[];
};

function jsonOrNull(value: unknown) {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue);
}

function asJson(value: unknown) {
  return value as Prisma.InputJsonValue;
}

function filePathFromStorageKey(storageKey: string) {
  return resolve(uploadDir, storageKey);
}

async function writeSeedFile(storageKey: string, content: string) {
  const target = filePathFromStorageKey(storageKey);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function projectLotId(projectId: string, index: number) {
  return `${projectId}-lot-${String(index + 1).padStart(2, '0')}`;
}

function conversionIdFromSimulation(simulationId: string) {
  return `conversion-${simulationId}`;
}

function snapshotIdFromSimulation(simulationId: string) {
  return `snapshot-${simulationId}`;
}

function buildSimulationStoredFields(input: {
  strategy: SimulationStrategy;
  propertyType: SimulationPropertyType;
  departmentCode: string;
  isFirstTimeBuyer?: boolean;
  purchasePrice: number;
  furnitureValue?: number;
  estimatedDisbursements?: number;
  worksBudget: number;
  financingMode: FinancingMode;
  downPayment?: number;
  loanAmount?: number;
  interestRate?: number;
  loanDurationMonths?: number;
  estimatedProjectDurationMonths?: number;
  targetResalePrice?: number;
  targetMonthlyRent?: number;
  bufferAmount?: number;
}) {
  const results = buildSimulationResults({
    strategy: input.strategy,
    propertyType: input.propertyType,
    departmentCode: input.departmentCode,
    isFirstTimeBuyer: input.isFirstTimeBuyer ?? false,
    purchasePrice: input.purchasePrice,
    furnitureValue: input.furnitureValue ?? 0,
    estimatedDisbursements: input.estimatedDisbursements,
    worksBudget: input.worksBudget,
    financingMode: input.financingMode,
    downPayment: input.downPayment ?? 0,
    loanAmount: input.loanAmount ?? 0,
    interestRate: input.interestRate ?? 0,
    loanDurationMonths: input.loanDurationMonths ?? 0,
    estimatedProjectDurationMonths:
      input.estimatedProjectDurationMonths ?? null,
    targetResalePrice: input.targetResalePrice ?? null,
    targetMonthlyRent: input.targetMonthlyRent ?? null,
    bufferAmount: input.bufferAmount ?? 0,
  });

  return {
    notaryFees: results.notaryFees?.total ?? 0,
    notaryFeesBreakdown: jsonOrNull(results.notaryFees),
    estimatedMonthlyPayment: results.metrics.estimatedMonthlyPayment,
    decisionScore: results.decision.score,
    decisionStatus: results.decision.status,
    resultSummaryJson: {
      metrics: results.metrics,
      decision: results.decision,
      notaryFees: results.notaryFees,
      financingPlan: results.financingPlan,
    } as Prisma.InputJsonValue,
  };
}

async function seedUserWithMembership(
  organizationId: string,
  config: SeedUserConfig,
) {
  const user = await prisma.user.create({
    data: {
      id: config.id,
      email: config.email,
      firstName: config.firstName,
      lastName: config.lastName,
      passwordHash: hashSync(config.password, 10),
      adminRole: config.adminRole,
      isPilotUser: config.isPilotUser,
      betaAccessEnabled: config.betaAccessEnabled,
    },
  });

  await prisma.membership.create({
    data: {
      organizationId,
      userId: user.id,
      role: config.membershipRole,
    },
  });

  return user;
}

async function createSeedDocument(input: {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  type: DocumentType;
  originalFileName: string;
  mimeType: string;
  content: string;
  expenseId?: string;
}) {
  const storageKey = `${input.organizationId}/${input.projectId}/${input.id}-${input.originalFileName}`;

  await writeSeedFile(storageKey, input.content);

  return prisma.document.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      projectId: input.projectId,
      expenseId: input.expenseId,
      type: input.type,
      title: input.title,
      originalFileName: input.originalFileName,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: Buffer.byteLength(input.content, 'utf8'),
    },
  });
}

async function createManualProject(input: {
  id: string;
  organizationId: string;
  name: string;
  reference?: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  type: ProjectType;
  status: ProjectStatus;
  strategy?: SimulationStrategy;
  purchasePrice?: number;
  notaryFees?: number;
  acquisitionFees?: number | null;
  worksBudget?: number;
  notes?: string;
  lots?: ProjectLotSeed[];
  expenses?: ProjectExpenseSeed[];
  documents?: ProjectDocumentSeed[];
}) {
  const project = await prisma.project.create({
    data: {
      id: input.id,
      organizationId: input.organizationId,
      name: input.name,
      reference: input.reference,
      addressLine1: input.addressLine1,
      city: input.city,
      postalCode: input.postalCode,
      country: 'FR',
      type: input.type,
      strategy: input.strategy,
      status: input.status,
      purchasePrice: input.purchasePrice,
      notaryFees: input.notaryFees,
      acquisitionFees: input.acquisitionFees,
      worksBudget: input.worksBudget,
      notes: input.notes,
    },
  });

  for (const lot of input.lots ?? []) {
    await prisma.lot.create({
      data: {
        id: lot.id,
        organizationId: input.organizationId,
        projectId: input.id,
        name: lot.name,
        reference: lot.reference,
        type: lot.type,
        status: lot.status,
        surface: lot.surface,
        estimatedRent: lot.estimatedRent,
        notes: lot.notes,
      },
    });
  }

  for (const expense of input.expenses ?? []) {
    await prisma.expense.create({
      data: {
        id: expense.id,
        organizationId: input.organizationId,
        projectId: input.id,
        lotId: expense.lotId,
        invoiceNumber: expense.invoiceNumber,
        issueDate: new Date(expense.issueDate),
        amountHt: expense.amountHt,
        vatAmount: expense.vatAmount,
        amountTtc: expense.amountTtc,
        category: expense.category,
        paymentStatus: expense.paymentStatus ?? PaymentStatus.PAID,
        vendorName: expense.vendorName,
        comment: expense.comment,
      },
    });
  }

  for (const document of input.documents ?? []) {
    await createSeedDocument({
      id: document.id,
      organizationId: input.organizationId,
      projectId: input.id,
      title: document.title,
      type: document.type,
      originalFileName: document.originalFileName,
      mimeType: document.mimeType,
      content: document.content,
      expenseId: document.expenseId,
    });
  }

  return project;
}

async function createSimulation(
  organizationId: string,
  config: SimulationSeedConfig,
) {
  const storedFields = buildSimulationStoredFields(config);

  await prisma.simulation.create({
    data: {
      id: config.id,
      organizationId,
      folderId: config.folderId,
      name: config.name,
      address: config.address,
      strategy: config.strategy,
      propertyType: config.propertyType,
      departmentCode: config.departmentCode,
      isFirstTimeBuyer: config.isFirstTimeBuyer ?? false,
      purchasePrice: config.purchasePrice,
      furnitureValue: config.furnitureValue,
      estimatedDisbursements: config.estimatedDisbursements,
      notaryFees: storedFields.notaryFees,
      notaryFeesBreakdown: storedFields.notaryFeesBreakdown,
      acquisitionFees: storedFields.notaryFees,
      worksBudget: config.worksBudget,
      financingMode: config.financingMode,
      downPayment: config.downPayment,
      loanAmount: config.loanAmount,
      interestRate: config.interestRate,
      loanDurationMonths: config.loanDurationMonths,
      estimatedMonthlyPayment: storedFields.estimatedMonthlyPayment,
      estimatedProjectDurationMonths: config.estimatedProjectDurationMonths,
      targetResalePrice: config.targetResalePrice,
      targetMonthlyRent: config.targetMonthlyRent,
      bufferAmount: config.bufferAmount,
      notes: config.notes,
      decisionScore: storedFields.decisionScore,
      decisionStatus: storedFields.decisionStatus,
      resultSummaryJson: storedFields.resultSummaryJson,
    },
  });

  for (const [index, lot] of (config.lots ?? []).entries()) {
    await prisma.simulationLot.create({
      data: {
        id: lot.id,
        organizationId,
        simulationId: config.id,
        name: lot.name,
        type: lot.type,
        surface: lot.surface,
        estimatedRent: lot.estimatedRent,
        targetResaleValue: lot.targetResaleValue,
        notes: lot.notes,
        position: index,
      },
    });
  }

  for (const event of config.events ?? []) {
    await prisma.opportunityEvent.create({
      data: {
        id: event.id,
        organizationId,
        simulationId: config.id,
        type: event.type,
        title: event.title,
        description: event.description,
        eventDate: new Date(event.eventDate),
        impact: event.impact,
      },
    });
  }

  for (const group of config.optionGroups ?? []) {
    await prisma.simulationOptionGroup.create({
      data: {
        id: group.id,
        organizationId,
        simulationId: config.id,
        type: group.type,
        label: group.label,
      },
    });

    for (const option of group.options) {
      await prisma.simulationOption.create({
        data: {
          id: option.id,
          organizationId,
          groupId: group.id,
          label: option.label,
          valueJson: option.valueJson as Prisma.InputJsonValue,
          source: option.source ?? SimulationOptionSource.MANUAL,
          sourceEventId: option.sourceEventId,
        },
      });
    }

    for (const activation of group.activationSequence ?? []) {
      await activateSimulationOption({
        optionId: activation.optionId,
        activatedByUserId: activation.activatedByUserId,
        activatedAt: new Date(activation.activatedAt),
        organizationId,
      });
    }
  }

  await refreshSimulationComputedFields(config.id);
}

async function activateSimulationOption(input: {
  optionId: string;
  activatedByUserId: string;
  activatedAt: Date;
  organizationId: string;
}) {
  const option = await prisma.simulationOption.findUniqueOrThrow({
    where: { id: input.optionId },
    include: {
      group: {
        select: {
          id: true,
          simulationId: true,
          activeOptionId: true,
        },
      },
    },
  });

  if (option.group.activeOptionId === input.optionId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.simulationOption.updateMany({
      where: {
        groupId: option.group.id,
        organizationId: input.organizationId,
      },
      data: {
        isActive: false,
      },
    });

    await tx.simulationOption.update({
      where: { id: input.optionId },
      data: {
        isActive: true,
      },
    });

    await tx.simulationOptionGroup.update({
      where: { id: option.group.id },
      data: {
        activeOptionId: input.optionId,
      },
    });

    await tx.simulationOptionActivationLog.create({
      data: {
        organizationId: input.organizationId,
        simulationId: option.group.simulationId,
        optionGroupId: option.group.id,
        previousOptionId: option.group.activeOptionId,
        newOptionId: input.optionId,
        activatedByUserId: input.activatedByUserId,
        createdAt: input.activatedAt,
      },
    });
  });
}

async function refreshSimulationComputedFields(simulationId: string) {
  const simulation = await prisma.simulation.findUniqueOrThrow({
    where: { id: simulationId },
    include: {
      lots: {
        orderBy: { position: 'asc' },
      },
      workItems: {
        include: {
          options: true,
        },
        orderBy: { position: 'asc' },
      },
      optionGroups: {
        include: {
          activeOption: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const runtimeState = buildSimulationRuntimeState(
    simulation,
    simulation.workItems,
    simulation.lots,
    simulation.optionGroups,
  );

  await prisma.simulation.update({
    where: { id: simulationId },
    data: {
      notaryFees:
        runtimeState.results.notaryFees?.total ?? simulation.notaryFees ?? 0,
      acquisitionFees:
        runtimeState.results.notaryFees?.total ??
        simulation.acquisitionFees ??
        0,
      notaryFeesBreakdown: jsonOrNull(runtimeState.results.notaryFees),
      estimatedMonthlyPayment:
        runtimeState.results.metrics.estimatedMonthlyPayment,
      decisionScore: runtimeState.results.decision.score,
      decisionStatus: runtimeState.results.decision.status,
      resultSummaryJson: {
        metrics: asJson(runtimeState.results.metrics),
        decision: asJson(runtimeState.results.decision),
        notaryFees: asJson(runtimeState.results.notaryFees),
        financingPlan: asJson(runtimeState.results.financingPlan),
        activeValues: asJson(runtimeState.activeValues),
      } as Prisma.InputJsonValue,
    },
  });
}

async function convertSimulationToProject(input: {
  simulationId: string;
  projectId: string;
  createdByUserId: string;
  type: ProjectType;
  status: ProjectStatus;
}) {
  const simulation = await prisma.simulation.findUniqueOrThrow({
    where: { id: input.simulationId },
    include: {
      lots: {
        orderBy: { position: 'asc' },
      },
      workItems: {
        include: { options: true },
        orderBy: { position: 'asc' },
      },
      optionGroups: {
        include: { activeOption: true },
        orderBy: { createdAt: 'asc' },
      },
      conversionRecord: {
        select: {
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      convertedProject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const plan = buildSimulationConversionPlan(MAIN_ORGANIZATION_ID, simulation);

  if (!plan.preview.canConvert) {
    const reason = plan.preview.blockingIssues.map((issue) => issue.message);
    throw new Error(
      `Unable to convert ${simulation.name}: ${reason.join(' / ')}`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.project.create({
      data: {
        id: input.projectId,
        ...plan.projectData,
        type: input.type,
        status: input.status,
      },
    });

    for (const [index, lot] of plan.lotDraftData.entries()) {
      await tx.lot.create({
        data: {
          id: projectLotId(input.projectId, index),
          ...lot,
          projectId: input.projectId,
        },
      });
    }

    const conversionId = conversionIdFromSimulation(input.simulationId);

    await tx.simulationConversion.create({
      data: {
        id: conversionId,
        organizationId: MAIN_ORGANIZATION_ID,
        simulationId: input.simulationId,
        projectId: input.projectId,
        createdByUserId: input.createdByUserId,
        status: 'COMPLETED',
      },
    });

    await tx.projectForecastSnapshot.create({
      data: {
        id: snapshotIdFromSimulation(input.simulationId),
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: input.projectId,
        simulationId: input.simulationId,
        conversionId,
        ...plan.snapshotData,
      },
    });

    await tx.simulation.update({
      where: { id: input.simulationId },
      data: {
        convertedProjectId: input.projectId,
      },
    });
  });
}

async function updateProjectLot(
  projectId: string,
  lotIndex: number,
  data: Prisma.LotUpdateInput,
) {
  await prisma.lot.update({
    where: {
      id: projectLotId(projectId, lotIndex),
    },
    data,
  });
}

async function seedMainOrganizationsAndUsers() {
  const mainOrganization = await prisma.organization.create({
    data: {
      id: MAIN_ORGANIZATION_ID,
      name: MAIN_ORGANIZATION_NAME,
      slug: MAIN_ORGANIZATION_SLUG,
    },
  });

  const admin = await seedUserWithMembership(MAIN_ORGANIZATION_ID, USERS.admin);
  const collaborator = await seedUserWithMembership(
    MAIN_ORGANIZATION_ID,
    USERS.collaborator,
  );
  const reader = await seedUserWithMembership(
    MAIN_ORGANIZATION_ID,
    USERS.reader,
  );

  const rivageOrganization = await prisma.organization.create({
    data: {
      id: 'org-demo-rivage',
      name: 'Rivage Patrimoine',
      slug: 'rivage-patrimoine',
    },
  });

  await seedUserWithMembership(rivageOrganization.id, {
    id: 'user-rivage-owner',
    email: 'rivage.owner@example.com',
    password: 'rivage123',
    firstName: 'Claire',
    lastName: 'Roussel',
    adminRole: AdminRole.USER,
    membershipRole: MembershipRole.ADMIN,
    isPilotUser: false,
    betaAccessEnabled: false,
  });

  const opaleOrganization = await prisma.organization.create({
    data: {
      id: 'org-demo-opale',
      name: 'Opale Marchand',
      slug: 'opale-marchand',
    },
  });

  await seedUserWithMembership(opaleOrganization.id, {
    id: 'user-opale-owner',
    email: 'opale.owner@example.com',
    password: 'opale123',
    firstName: 'Hugo',
    lastName: 'Lefebvre',
    adminRole: AdminRole.USER,
    membershipRole: MembershipRole.ADMIN,
    isPilotUser: false,
    betaAccessEnabled: false,
  });

  return {
    mainOrganization,
    admin,
    collaborator,
    reader,
    rivageOrganization,
    opaleOrganization,
  };
}

async function seedSimulationFolders() {
  await prisma.simulationFolder.createMany({
    data: [
      {
        id: MAIN_PROJECTS.roubaisHealthy.folderId,
        organizationId: MAIN_ORGANIZATION_ID,
        name: MAIN_PROJECTS.roubaisHealthy.folderName,
        description:
          'Comparer rapidement des opportunites locatives dans la metropole lilloise.',
      },
      {
        id: MAIN_PROJECTS.tourcoingProblem.folderId,
        organizationId: MAIN_ORGANIZATION_ID,
        name: MAIN_PROJECTS.tourcoingProblem.folderName,
        description:
          'Arbitrages de division, revente et renovation lourde pour marchand de biens.',
      },
    ],
  });
}

async function seedMainSimulations() {
  await createSimulation(MAIN_ORGANIZATION_ID, {
    id: MAIN_PROJECTS.roubaisHealthy.simulationId,
    folderId: MAIN_PROJECTS.roubaisHealthy.folderId,
    name: 'Immeuble de rapport - Roubaix Centre',
    address: '18 rue de l Epeule, 59100 Roubaix',
    strategy: SimulationStrategy.RENTAL,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '59',
    purchasePrice: 342000,
    estimatedDisbursements: 950,
    worksBudget: 46000,
    financingMode: FinancingMode.LOAN,
    downPayment: 105000,
    loanAmount: 330000,
    interestRate: 3.1,
    loanDurationMonths: 300,
    estimatedProjectDurationMonths: 14,
    targetMonthlyRent: 2850,
    bufferAmount: 9000,
    notes:
      'Immeuble 4 appartements + 1 garage. Projet vitrine, bien tenu, travaux surtout cosmetiques.',
    lots: [
      {
        id: 'sim-lot-roubaix-1',
        name: 'T2 RDC cour',
        type: SimulationLotType.APARTMENT,
        surface: 42,
        estimatedRent: 620,
      },
      {
        id: 'sim-lot-roubaix-2',
        name: 'T2 1er rue',
        type: SimulationLotType.APARTMENT,
        surface: 45,
        estimatedRent: 640,
      },
      {
        id: 'sim-lot-roubaix-3',
        name: 'T3 1er cour',
        type: SimulationLotType.APARTMENT,
        surface: 58,
        estimatedRent: 720,
      },
      {
        id: 'sim-lot-roubaix-4',
        name: 'T3 duplex 2e',
        type: SimulationLotType.APARTMENT,
        surface: 66,
        estimatedRent: 780,
      },
      {
        id: 'sim-lot-roubaix-5',
        name: 'Garage ferme',
        type: SimulationLotType.GARAGE,
        surface: 15,
        estimatedRent: 90,
      },
    ],
  });

  await createSimulation(MAIN_ORGANIZATION_ID, {
    id: MAIN_PROJECTS.lilleWatch.simulationId,
    folderId: MAIN_PROJECTS.roubaisHealthy.folderId,
    name: 'T2 meuble - Lille Fives',
    address: '44 rue Pierre Legrand, 59800 Lille',
    strategy: SimulationStrategy.RENTAL,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '59',
    purchasePrice: 188000,
    estimatedDisbursements: 600,
    worksBudget: 18000,
    financingMode: FinancingMode.LOAN,
    downPayment: 25000,
    loanAmount: 205000,
    interestRate: 3.85,
    loanDurationMonths: 300,
    estimatedProjectDurationMonths: 6,
    targetMonthlyRent: 730,
    bufferAmount: 6000,
    notes:
      'Petit ticket, bon emplacement, mais marge de securite fine tant que le financement et le niveau de loyer ne sont pas optimises.',
    lots: [
      {
        id: 'sim-lot-lille-1',
        name: 'T2 2e etage',
        type: SimulationLotType.APARTMENT,
        surface: 34,
        estimatedRent: 730,
      },
    ],
    events: [
      {
        id: 'event-lille-negotiation',
        type: OpportunityEventType.NEGOTIATION_PRICE,
        title: 'Contre-offre vendeur recue',
        description: 'Le vendeur est ouvert a 184 kEUR si signature avant la fin du mois.',
        eventDate: '2026-03-03T09:00:00.000Z',
        impact: 'Prix d achat plus tenable mais rendement encore serre.',
      },
      {
        id: 'event-lille-bank-quote',
        type: OpportunityEventType.BANK_FINANCING_QUOTE,
        title: 'Retour courtier',
        description: 'Proposition a 3,35% sur 25 ans pour 205 kEUR.',
        eventDate: '2026-03-05T16:30:00.000Z',
        impact: 'Mensualite en baisse, mais le projet reste a negocier.',
      },
    ],
    optionGroups: [
      {
        id: 'group-lille-price',
        type: SimulationOptionGroupType.PURCHASE_PRICE,
        label: "Prix d'achat",
        options: [
          {
            id: 'option-lille-price-184',
            label: 'Contre-offre vendeur',
            valueJson: { price: 184000 },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-lille-negotiation',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-lille-price-184',
            activatedByUserId: USERS.collaborator.id,
            activatedAt: '2026-03-05T10:10:00.000Z',
          },
        ],
      },
      {
        id: 'group-lille-financing',
        type: SimulationOptionGroupType.FINANCING,
        label: 'Financement',
        options: [
          {
            id: 'option-lille-financing-bank',
            label: 'Banque locale 3,85% / 25 ans',
            valueJson: {
              mode: 'LOAN',
              rate: 3.85,
              durationMonths: 300,
              loanAmount: 205000,
            },
          },
          {
            id: 'option-lille-financing-broker',
            label: 'Courtier 3,35% / 25 ans',
            valueJson: {
              mode: 'LOAN',
              rate: 3.35,
              durationMonths: 300,
              loanAmount: 205000,
            },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-lille-bank-quote',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-lille-financing-broker',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-03-05T17:15:00.000Z',
          },
        ],
      },
    ],
  });

  await createSimulation(MAIN_ORGANIZATION_ID, {
    id: MAIN_PROJECTS.valenciennesScenario.simulationId,
    folderId: MAIN_PROJECTS.roubaisHealthy.folderId,
    name: 'Colocation 4 chambres - Valenciennes',
    address: '12 rue des Recollets, 59300 Valenciennes',
    strategy: SimulationStrategy.RENTAL,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '59',
    purchasePrice: 264000,
    furnitureValue: 12000,
    estimatedDisbursements: 900,
    worksBudget: 52000,
    financingMode: FinancingMode.LOAN,
    downPayment: 60000,
    loanAmount: 300000,
    interestRate: 3.45,
    loanDurationMonths: 300,
    estimatedProjectDurationMonths: 8,
    targetMonthlyRent: 2250,
    bufferAmount: 9000,
    notes:
      'Maison de ville deja bien placee pour une colocation etudiante. L arbitrage porte surtout sur le niveau de finition et le financement.',
    lots: [
      {
        id: 'sim-lot-val-1',
        name: 'Chambre 1',
        type: SimulationLotType.APARTMENT,
        surface: 16,
        estimatedRent: 560,
      },
      {
        id: 'sim-lot-val-2',
        name: 'Chambre 2',
        type: SimulationLotType.APARTMENT,
        surface: 14,
        estimatedRent: 560,
      },
      {
        id: 'sim-lot-val-3',
        name: 'Chambre 3',
        type: SimulationLotType.APARTMENT,
        surface: 13,
        estimatedRent: 560,
      },
      {
        id: 'sim-lot-val-4',
        name: 'Chambre 4',
        type: SimulationLotType.APARTMENT,
        surface: 15,
        estimatedRent: 570,
      },
    ],
    events: [
      {
        id: 'event-val-bank-quote',
        type: OpportunityEventType.BANK_FINANCING_QUOTE,
        title: 'Retour banque partenaire',
        description: 'Le courtier obtient 3,15% sur 25 ans avec 300 kEUR de dette.',
        eventDate: '2026-03-07T11:45:00.000Z',
        impact: 'Le cash-flow devient plus confortable.',
      },
      {
        id: 'event-val-works-update',
        type: OpportunityEventType.ASSUMPTION_CHANGE,
        title: 'Version travaux optimisee',
        description: 'Le maitre d oeuvre confirme un lot travaux a 48 kEUR au lieu de 52 kEUR.',
        eventDate: '2026-03-09T14:00:00.000Z',
        impact: 'La cible reste agressive mais plus credible pour un lancement rapide.',
      },
    ],
    optionGroups: [
      {
        id: 'group-val-works',
        type: SimulationOptionGroupType.WORK_BUDGET,
        label: 'Travaux',
        options: [
          {
            id: 'option-val-works-initial',
            label: 'Version prete a louer',
            valueJson: { cost: 52000 },
          },
          {
            id: 'option-val-works-optimized',
            label: 'Version optimisee',
            valueJson: { cost: 48000 },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-val-works-update',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-val-works-optimized',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-03-09T16:20:00.000Z',
          },
        ],
      },
      {
        id: 'group-val-financing',
        type: SimulationOptionGroupType.FINANCING,
        label: 'Financement',
        options: [
          {
            id: 'option-val-financing-bank',
            label: 'Banque locale 3,45% / 25 ans',
            valueJson: {
              mode: 'LOAN',
              rate: 3.45,
              durationMonths: 300,
              loanAmount: 300000,
            },
          },
          {
            id: 'option-val-financing-broker',
            label: 'Courtier 3,15% / 25 ans',
            valueJson: {
              mode: 'LOAN',
              rate: 3.15,
              durationMonths: 300,
              loanAmount: 300000,
            },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-val-bank-quote',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-val-financing-broker',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-03-07T18:00:00.000Z',
          },
        ],
      },
    ],
  });

  await createSimulation(MAIN_ORGANIZATION_ID, {
    id: MAIN_PROJECTS.tourcoingProblem.simulationId,
    folderId: MAIN_PROJECTS.tourcoingProblem.folderId,
    name: 'Division pavillonnaire - Tourcoing',
    address: '7 rue du Brun Pain, 59200 Tourcoing',
    strategy: SimulationStrategy.FLIP,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '59',
    purchasePrice: 224000,
    estimatedDisbursements: 1200,
    worksBudget: 82000,
    financingMode: FinancingMode.LOAN,
    downPayment: 60000,
    loanAmount: 300000,
    interestRate: 3.7,
    loanDurationMonths: 240,
    estimatedProjectDurationMonths: 14,
    targetResalePrice: 390000,
    bufferAmount: 15000,
    notes:
      'Dossier marchand de biens avec grosse sensibilite sur le vrai budget travaux. Le seed montre justement ce que vaut une option prudente.',
    lots: [
      {
        id: 'sim-lot-tourcoing-1',
        name: 'Maison avant',
        type: SimulationLotType.APARTMENT,
        surface: 70,
        estimatedRent: 890,
        targetResaleValue: 205000,
      },
      {
        id: 'sim-lot-tourcoing-2',
        name: 'Maison arriere',
        type: SimulationLotType.APARTMENT,
        surface: 61,
        estimatedRent: 810,
        targetResaleValue: 185000,
      },
    ],
    events: [
      {
        id: 'event-tourcoing-negotiation',
        type: OpportunityEventType.NEGOTIATION_PRICE,
        title: 'Vendeur pret a descendre',
        description: 'Le prix peut tomber a 215 kEUR si la signature est rapide.',
        eventDate: '2026-02-11T10:30:00.000Z',
        impact: 'Ameliore la marge, mais ne regle pas le risque travaux.',
      },
      {
        id: 'event-tourcoing-works',
        type: OpportunityEventType.ASSUMPTION_CHANGE,
        title: 'Devis charpente + reseaux',
        description: 'Nouvelle enveloppe a 110 kEUR apres visite technique plus poussee.',
        eventDate: '2026-02-18T15:10:00.000Z',
        impact: 'La marge devient juste et la vigilance augmente nettement.',
      },
    ],
    optionGroups: [
      {
        id: 'group-tourcoing-price',
        type: SimulationOptionGroupType.PURCHASE_PRICE,
        label: "Prix d'achat",
        options: [
          {
            id: 'option-tourcoing-price-219',
            label: 'Accord verbal',
            valueJson: { price: 219000 },
          },
          {
            id: 'option-tourcoing-price-215',
            label: 'Contre-offre signee',
            valueJson: { price: 215000 },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-tourcoing-negotiation',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-tourcoing-price-219',
            activatedByUserId: USERS.collaborator.id,
            activatedAt: '2026-02-11T11:00:00.000Z',
          },
          {
            optionId: 'option-tourcoing-price-215',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-02-12T09:20:00.000Z',
          },
        ],
      },
      {
        id: 'group-tourcoing-works',
        type: SimulationOptionGroupType.WORK_BUDGET,
        label: 'Travaux',
        options: [
          {
            id: 'option-tourcoing-works-82',
            label: 'Chiffrage initial',
            valueJson: { cost: 82000 },
          },
          {
            id: 'option-tourcoing-works-110',
            label: 'Devis securisant',
            valueJson: { cost: 110000 },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-tourcoing-works',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-tourcoing-works-110',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-02-18T17:00:00.000Z',
          },
        ],
      },
    ],
  });

  await createSimulation(MAIN_ORGANIZATION_ID, {
    id: MAIN_PROJECTS.lensDrift.simulationId,
    folderId: MAIN_PROJECTS.tourcoingProblem.folderId,
    name: 'Maison a renover - Lens',
    address: '31 rue Emile Zola, 62300 Lens',
    strategy: SimulationStrategy.RENTAL,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '62',
    purchasePrice: 154000,
    estimatedDisbursements: 800,
    worksBudget: 33000,
    financingMode: FinancingMode.LOAN,
    downPayment: 35000,
    loanAmount: 175000,
    interestRate: 3.4,
    loanDurationMonths: 240,
    estimatedProjectDurationMonths: 9,
    targetMonthlyRent: 1550,
    bufferAmount: 8000,
    notes:
      'Belle creation de valeur theorique, mais le seed montre qu un seul lot non reloue suffit a faire tomber le rendement portefeuille.',
    lots: [
      {
        id: 'sim-lot-lens-1',
        name: 'T2 avant',
        type: SimulationLotType.APARTMENT,
        surface: 37,
        estimatedRent: 760,
      },
      {
        id: 'sim-lot-lens-2',
        name: 'T2 arriere',
        type: SimulationLotType.APARTMENT,
        surface: 39,
        estimatedRent: 790,
      },
    ],
    events: [
      {
        id: 'event-lens-works',
        type: OpportunityEventType.ASSUMPTION_CHANGE,
        title: 'Devis second oeuvre rehausse',
        description: 'Le devis le plus prudent repositionne le budget travaux a 41 kEUR.',
        eventDate: '2026-03-02T10:00:00.000Z',
        impact: 'La marge reste bonne, mais le point mort se tend legerement.',
      },
    ],
    optionGroups: [
      {
        id: 'group-lens-works',
        type: SimulationOptionGroupType.WORK_BUDGET,
        label: 'Travaux',
        options: [
          {
            id: 'option-lens-works-33',
            label: 'Budget initial',
            valueJson: { cost: 33000 },
          },
          {
            id: 'option-lens-works-41',
            label: 'Budget prudent',
            valueJson: { cost: 41000 },
            source: SimulationOptionSource.FROM_EVENT,
            sourceEventId: 'event-lens-works',
          },
        ],
        activationSequence: [
          {
            optionId: 'option-lens-works-41',
            activatedByUserId: USERS.admin.id,
            activatedAt: '2026-03-02T12:10:00.000Z',
          },
        ],
      },
    ],
  });
}

async function seedConvertedProjects() {
  await convertSimulationToProject({
    simulationId: MAIN_PROJECTS.roubaisHealthy.simulationId,
    projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
    createdByUserId: USERS.admin.id,
    type: ProjectType.APARTMENT_BUILDING,
    status: ProjectStatus.ACTIVE,
  });

  await updateProjectLot(MAIN_PROJECTS.roubaisHealthy.projectId, 0, {
    reference: 'RBX-A1',
    status: LotStatus.RENTED,
  });
  await updateProjectLot(MAIN_PROJECTS.roubaisHealthy.projectId, 1, {
    reference: 'RBX-A2',
    status: LotStatus.RENTED,
  });
  await updateProjectLot(MAIN_PROJECTS.roubaisHealthy.projectId, 2, {
    reference: 'RBX-A3',
    status: LotStatus.RENTED,
  });
  await updateProjectLot(MAIN_PROJECTS.roubaisHealthy.projectId, 3, {
    reference: 'RBX-A4',
    status: LotStatus.RENTED,
  });
  await updateProjectLot(MAIN_PROJECTS.roubaisHealthy.projectId, 4, {
    reference: 'RBX-G1',
    status: LotStatus.AVAILABLE,
    estimatedRent: 90,
  });

  await prisma.expense.createMany({
    data: [
      {
        id: 'expense-roubaix-works-main',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
        invoiceNumber: 'RBX-TRX-001',
        issueDate: new Date('2026-01-12'),
        amountHt: 21833.33,
        vatAmount: 4366.67,
        amountTtc: 26200,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Entreprise Mertens',
        comment: 'Reprise cuisines, peintures et remise en conformite electrique.',
      },
      {
        id: 'expense-roubaix-works-hall',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
        invoiceNumber: 'RBX-TRX-002',
        issueDate: new Date('2026-02-06'),
        amountHt: 3333.33,
        vatAmount: 666.67,
        amountTtc: 4000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Atelier du Hall',
        comment: 'Hall d entree et parties communes.',
      },
      {
        id: 'expense-roubaix-insurance',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
        invoiceNumber: 'RBX-ASS-2026',
        issueDate: new Date('2026-02-10'),
        amountHt: 780,
        vatAmount: 0,
        amountTtc: 780,
        category: ExpenseCategory.INSURANCE,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Mutuelle des Immeubles',
        comment: 'PNO annuelle.',
      },
      {
        id: 'expense-roubaix-legal',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
        invoiceNumber: 'RBX-DIAG-2026',
        issueDate: new Date('2026-02-15'),
        amountHt: 950,
        vatAmount: 0,
        amountTtc: 950,
        category: ExpenseCategory.LEGAL,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Diag Conseil',
        comment: 'Mise a jour DPE et diagnostics de relocation.',
      },
    ],
  });

  await createSeedDocument({
    id: 'doc-roubaix-contract',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
    title: 'Compromis et annexes',
    type: DocumentType.CONTRACT,
    originalFileName: 'compromis-roubaix.txt',
    mimeType: 'text/plain',
    content: 'Compromis de vente - Immeuble de rapport Roubaix Centre.',
  });
  await createSeedDocument({
    id: 'doc-roubaix-quote',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
    title: 'Devis travaux consolide',
    type: DocumentType.QUOTE,
    originalFileName: 'devis-roubaix.txt',
    mimeType: 'text/plain',
    content: 'Devis consolide travaux cosmetiques et remise en etat.',
  });
  await createSeedDocument({
    id: 'doc-roubaix-insurance',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.roubaisHealthy.projectId,
    title: 'Attestation assurance PNO',
    type: DocumentType.INSURANCE,
    originalFileName: 'assurance-roubaix.txt',
    mimeType: 'text/plain',
    content: 'Attestation assurance immeuble - Noroit Invest.',
  });

  await convertSimulationToProject({
    simulationId: MAIN_PROJECTS.tourcoingProblem.simulationId,
    projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
    createdByUserId: USERS.admin.id,
    type: ProjectType.HOUSE,
    status: ProjectStatus.WORKS,
  });

  await prisma.project.update({
    where: { id: MAIN_PROJECTS.tourcoingProblem.projectId },
    data: {
      worksBudget: 108000,
      notes:
        'Projet converti malgre une hypothese travaux deja prudente. Le reel confirme pourquoi il faut suivre la derive tot.',
    },
  });

  await updateProjectLot(MAIN_PROJECTS.tourcoingProblem.projectId, 0, {
    reference: 'TRG-A',
    status: LotStatus.AVAILABLE,
    estimatedRent: 890,
  });
  await updateProjectLot(MAIN_PROJECTS.tourcoingProblem.projectId, 1, {
    reference: 'TRG-B',
    status: LotStatus.AVAILABLE,
    estimatedRent: 810,
  });
  await prisma.lot.create({
    data: {
      id: `${MAIN_PROJECTS.tourcoingProblem.projectId}-lot-03`,
      organizationId: MAIN_ORGANIZATION_ID,
      projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
      name: 'Studio arriere-cour',
      reference: 'TRG-C',
      type: LotType.APARTMENT,
      status: LotStatus.AVAILABLE,
      surface: 23,
      estimatedRent: 520,
      notes: 'Lot ajoute apres arbitrage technique en cours de chantier.',
    },
  });

  await prisma.expense.createMany({
    data: [
      {
        id: 'expense-tourcoing-works-1',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
        invoiceNumber: 'TRG-TRX-001',
        issueDate: new Date('2026-02-24'),
        amountHt: 55833.33,
        vatAmount: 11166.67,
        amountTtc: 67000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Nord Structure',
        comment: 'Charpente, planchers et mise hors eau.',
      },
      {
        id: 'expense-tourcoing-works-2',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
        invoiceNumber: 'TRG-TRX-002',
        issueDate: new Date('2026-03-18'),
        amountHt: 51250,
        vatAmount: 10250,
        amountTtc: 61500,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Reseaux Habitat',
        comment: 'Electricite, plomberie et reseaux pour la division.',
      },
      {
        id: 'expense-tourcoing-legal',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
        invoiceNumber: 'TRG-GEO-001',
        issueDate: new Date('2026-03-05'),
        amountHt: 1800,
        vatAmount: 0,
        amountTtc: 1800,
        category: ExpenseCategory.LEGAL,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Cabinet Lemaitre',
        comment: 'Geometre et esquisse de division.',
      },
    ],
  });

  await createSeedDocument({
    id: 'doc-tourcoing-quote',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
    title: 'Devis technique securisant',
    type: DocumentType.QUOTE,
    originalFileName: 'devis-tourcoing.txt',
    mimeType: 'text/plain',
    content: 'Version prudente du chiffrage travaux pour la division pavillonnaire.',
  });
  await createSeedDocument({
    id: 'doc-tourcoing-plan',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.tourcoingProblem.projectId,
    title: 'Plan de division',
    type: DocumentType.PLAN,
    originalFileName: 'plan-tourcoing.txt',
    mimeType: 'text/plain',
    content: 'Plan de division simplifie du pavillon et du studio arriere-cour.',
  });

  await convertSimulationToProject({
    simulationId: MAIN_PROJECTS.valenciennesScenario.simulationId,
    projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
    createdByUserId: USERS.admin.id,
    type: ProjectType.HOUSE,
    status: ProjectStatus.ACTIVE,
  });

  await updateProjectLot(MAIN_PROJECTS.valenciennesScenario.projectId, 0, {
    reference: 'VAL-C1',
    status: LotStatus.RENTED,
    estimatedRent: 510,
  });
  await updateProjectLot(MAIN_PROJECTS.valenciennesScenario.projectId, 1, {
    reference: 'VAL-C2',
    status: LotStatus.RENTED,
    estimatedRent: 500,
  });
  await updateProjectLot(MAIN_PROJECTS.valenciennesScenario.projectId, 2, {
    reference: 'VAL-C3',
    status: LotStatus.RENTED,
    estimatedRent: 510,
  });
  await updateProjectLot(MAIN_PROJECTS.valenciennesScenario.projectId, 3, {
    reference: 'VAL-C4',
    status: LotStatus.RENTED,
    estimatedRent: 500,
  });

  await prisma.expense.createMany({
    data: [
      {
        id: 'expense-val-works-1',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
        invoiceNumber: 'VAL-TRX-001',
        issueDate: new Date('2026-03-12'),
        amountHt: 25000,
        vatAmount: 5000,
        amountTtc: 30000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Coloc Studio',
        comment: 'Cuisines, sols et rafraichissement complet.',
      },
      {
        id: 'expense-val-works-2',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
        invoiceNumber: 'VAL-TRX-002',
        issueDate: new Date('2026-03-26'),
        amountHt: 12666.67,
        vatAmount: 2533.33,
        amountTtc: 15200,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Menuiserie du Hainaut',
        comment: 'Placards sur mesure et portes techniques.',
      },
      {
        id: 'expense-val-management',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
        invoiceNumber: 'VAL-AMEUB-001',
        issueDate: new Date('2026-03-29'),
        amountHt: 4500,
        vatAmount: 900,
        amountTtc: 5400,
        category: ExpenseCategory.MAINTENANCE,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Home Setup',
        comment: 'Complement mobilier et remise en etat finale.',
      },
    ],
  });

  await createSeedDocument({
    id: 'doc-val-projection',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
    title: 'Synthese exploitation',
    type: DocumentType.OTHER,
    originalFileName: 'synthese-valenciennes.txt',
    mimeType: 'text/plain',
    content: 'Projection d exploitation colocation 4 chambres - version retenue.',
  });
  await createSeedDocument({
    id: 'doc-val-quote',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
    title: 'Devis travaux retenu',
    type: DocumentType.QUOTE,
    originalFileName: 'devis-valenciennes.txt',
    mimeType: 'text/plain',
    content: 'Version optimisee des travaux retenue apres arbitrage.',
  });
  await createSeedDocument({
    id: 'doc-val-photo',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.valenciennesScenario.projectId,
    title: 'Photos avant mise en location',
    type: DocumentType.PHOTO,
    originalFileName: 'photos-valenciennes.txt',
    mimeType: 'text/plain',
    content: 'Serie de photos des chambres et des parties communes.',
  });

  await convertSimulationToProject({
    simulationId: MAIN_PROJECTS.lensDrift.simulationId,
    projectId: MAIN_PROJECTS.lensDrift.projectId,
    createdByUserId: USERS.admin.id,
    type: ProjectType.HOUSE,
    status: ProjectStatus.WORKS,
  });

  await prisma.project.update({
    where: { id: MAIN_PROJECTS.lensDrift.projectId },
    data: {
      worksBudget: 39000,
      notes:
        'Projet engage, mais une relocation retardee suffit a faire ressortir une derive portefeuille tres visible.',
    },
  });

  await updateProjectLot(MAIN_PROJECTS.lensDrift.projectId, 0, {
    reference: 'LNS-A',
    status: LotStatus.RENTED,
    estimatedRent: 720,
  });
  await updateProjectLot(MAIN_PROJECTS.lensDrift.projectId, 1, {
    reference: 'LNS-B',
    status: LotStatus.AVAILABLE,
    estimatedRent: null,
  });

  await prisma.expense.createMany({
    data: [
      {
        id: 'expense-lens-works-1',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.lensDrift.projectId,
        invoiceNumber: 'LNS-TRX-001',
        issueDate: new Date('2026-03-10'),
        amountHt: 18000,
        vatAmount: 3600,
        amountTtc: 21600,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Renov Batis',
        comment: 'Isolation, cloisons et reprise des sols.',
      },
      {
        id: 'expense-lens-works-2',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.lensDrift.projectId,
        invoiceNumber: 'LNS-TRX-002',
        issueDate: new Date('2026-03-22'),
        amountHt: 11666.67,
        vatAmount: 2333.33,
        amountTtc: 14000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Atelier du Nord',
        comment: 'Cuisine, plomberie et remise en peinture.',
      },
      {
        id: 'expense-lens-tax',
        organizationId: MAIN_ORGANIZATION_ID,
        projectId: MAIN_PROJECTS.lensDrift.projectId,
        invoiceNumber: 'LNS-TAX-2026',
        issueDate: new Date('2026-03-28'),
        amountHt: 1350,
        vatAmount: 0,
        amountTtc: 1350,
        category: ExpenseCategory.TAX,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Communaute urbaine',
        comment: 'Taxe d amenagement et raccordement.',
      },
    ],
  });

  await createSeedDocument({
    id: 'doc-lens-diagnostic',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.lensDrift.projectId,
    title: 'Diagnostic avant relocation',
    type: DocumentType.DIAGNOSTIC,
    originalFileName: 'diagnostic-lens.txt',
    mimeType: 'text/plain',
    content: 'Diagnostic relance relocation pour le second lot.',
  });
  await createSeedDocument({
    id: 'doc-lens-quote',
    organizationId: MAIN_ORGANIZATION_ID,
    projectId: MAIN_PROJECTS.lensDrift.projectId,
    title: 'Devis travaux prudent',
    type: DocumentType.QUOTE,
    originalFileName: 'devis-lens.txt',
    mimeType: 'text/plain',
    content: 'Version prudente du devis second oeuvre retenue avant conversion.',
  });
}

async function seedManualProjects() {
  await createManualProject({
    id: MAIN_PROJECTS.lilleWatch.projectId,
    organizationId: MAIN_ORGANIZATION_ID,
    name: 'T2 meuble - Lille Fives',
    reference: 'LIL-FIVES-01',
    addressLine1: '44 rue Pierre Legrand',
    city: 'Lille',
    postalCode: '59800',
    type: ProjectType.OTHER,
    status: ProjectStatus.READY,
    purchasePrice: 188000,
    notaryFees: 14850,
    acquisitionFees: null,
    worksBudget: 18000,
    notes:
      'Projet encore interessant, mais il faut maintenant fiabiliser les pieces et la premiere depense pour piloter proprement.',
    lots: [
      {
        id: 'project-lille-lot-01',
        name: 'T2 2e etage',
        reference: 'LIL-T2',
        type: LotType.APARTMENT,
        status: LotStatus.AVAILABLE,
        surface: 34,
        estimatedRent: 730,
      },
    ],
  });

  await createManualProject({
    id: MAIN_PROJECTS.arrasIncomplete.projectId,
    organizationId: MAIN_ORGANIZATION_ID,
    name: 'Local commercial + logement - Arras',
    reference: 'ARR-MIX-01',
    addressLine1: '6 rue Saint-Aubert',
    city: 'Arras',
    postalCode: '62000',
    type: ProjectType.MIXED,
    status: ProjectStatus.ACQUISITION,
    purchasePrice: 249000,
    worksBudget: 52000,
    notes:
      'Compromis signe, mais la structure reelle des lots et le budget final ne sont pas encore verrouilles. Le seed montre volontairement que l app ne sur-vend pas un projet incomplet.',
  });
}

async function seedSecondaryTenantData() {
  await createManualProject({
    id: 'project-rivage-amiens',
    organizationId: 'org-demo-rivage',
    name: 'T3 patrimonial - Amiens Centre',
    reference: 'AMI-001',
    addressLine1: '9 rue Flatters',
    city: 'Amiens',
    postalCode: '80000',
    type: ProjectType.APARTMENT_BUILDING,
    status: ProjectStatus.ACTIVE,
    purchasePrice: 176000,
    notaryFees: 13800,
    worksBudget: 9000,
    notes: 'Jeu de donnees secondaire minimal pour verifier le cloisonnement multi-tenant.',
    lots: [
      {
        id: 'lot-rivage-amiens-01',
        name: 'T3 1er',
        type: LotType.APARTMENT,
        status: LotStatus.RENTED,
        surface: 57,
        estimatedRent: 790,
      },
    ],
    expenses: [
      {
        id: 'expense-rivage-works-01',
        invoiceNumber: 'AMI-TRX-001',
        issueDate: '2026-02-14',
        amountHt: 4200,
        vatAmount: 840,
        amountTtc: 5040,
        category: ExpenseCategory.WORKS,
        vendorName: 'Artisan local',
        comment: 'Rafraichissement leger.',
      },
    ],
    documents: [
      {
        id: 'doc-rivage-amiens-01',
        title: 'Bail type',
        type: DocumentType.CONTRACT,
        originalFileName: 'bail-amiens.txt',
        mimeType: 'text/plain',
        content: 'Document secondaire pour le tenant Rivage Patrimoine.',
      },
    ],
  });

  await prisma.simulationFolder.create({
    data: {
      id: 'folder-opale-littoral',
      organizationId: 'org-demo-opale',
      name: 'Opportunites littoral',
      description: 'Second tenant minimal pour verifier le scoping simulations.',
    },
  });

  await createSimulation('org-demo-opale', {
    id: 'simulation-opale-boulogne',
    folderId: 'folder-opale-littoral',
    name: 'Immeuble a decouper - Boulogne-sur-Mer',
    address: '28 rue Faidherbe, 62200 Boulogne-sur-Mer',
    strategy: SimulationStrategy.FLIP,
    propertyType: SimulationPropertyType.ANCIEN,
    departmentCode: '62',
    purchasePrice: 198000,
    estimatedDisbursements: 700,
    worksBudget: 64000,
    financingMode: FinancingMode.LOAN,
    downPayment: 50000,
    loanAmount: 240000,
    interestRate: 3.55,
    loanDurationMonths: 240,
    estimatedProjectDurationMonths: 12,
    targetResalePrice: 315000,
    bufferAmount: 12000,
    notes: 'Tenant secondaire tres leger pour valider le multi-tenant.',
    lots: [
      {
        id: 'sim-opale-lot-1',
        name: 'Plateau 1',
        type: SimulationLotType.APARTMENT,
        surface: 58,
        estimatedRent: 760,
        targetResaleValue: 158000,
      },
      {
        id: 'sim-opale-lot-2',
        name: 'Plateau 2',
        type: SimulationLotType.APARTMENT,
        surface: 52,
        estimatedRent: 710,
        targetResaleValue: 157000,
      },
    ],
  });
}

async function seedFeatureRequests() {
  await prisma.featureRequest.createMany({
    data: [
      {
        id: 'demo-idea-export-summary',
        organizationId: MAIN_ORGANIZATION_ID,
        authorId: USERS.admin.id,
        title: 'Exporter un resume CSV plus lisible',
        description:
          "Ajouter un export plus lisible pour partager rapidement l'etat d'un projet avec un comptable ou un associe.",
        status: FeatureRequestStatus.OPEN,
        votesCount: 2,
      },
      {
        id: 'demo-idea-beta-checklist',
        organizationId: MAIN_ORGANIZATION_ID,
        authorId: USERS.collaborator.id,
        title: 'Checklist beta pour la validation avant release',
        description:
          "Afficher une checklist tres legere pour verifier qu'une nouveaute est assez stable avant release globale.",
        status: FeatureRequestStatus.IN_PROGRESS,
        votesCount: 2,
      },
    ],
  });

  await prisma.featureRequestVote.createMany({
    data: [
      {
        id: 'vote-demo-idea-1',
        organizationId: MAIN_ORGANIZATION_ID,
        featureRequestId: 'demo-idea-export-summary',
        userId: USERS.collaborator.id,
      },
      {
        id: 'vote-demo-idea-2',
        organizationId: MAIN_ORGANIZATION_ID,
        featureRequestId: 'demo-idea-export-summary',
        userId: USERS.reader.id,
      },
      {
        id: 'vote-demo-idea-3',
        organizationId: MAIN_ORGANIZATION_ID,
        featureRequestId: 'demo-idea-beta-checklist',
        userId: USERS.admin.id,
      },
      {
        id: 'vote-demo-idea-4',
        organizationId: MAIN_ORGANIZATION_ID,
        featureRequestId: 'demo-idea-beta-checklist',
        userId: USERS.reader.id,
      },
    ],
  });
}

async function seedDemoDataset() {
  const actors = await seedMainOrganizationsAndUsers();
  await seedSimulationFolders();
  await seedMainSimulations();
  await seedConvertedProjects();
  await seedManualProjects();
  await seedSecondaryTenantData();
  await seedFeatureRequests();

  return actors;
}

export async function runDemoSeed() {
  console.log('Resetting and seeding the commercial demo dataset...');

  await resetDemoData(prisma);
  const actors = await seedDemoDataset();

  console.log('Demo dataset created');
  console.log('');
  console.log(`Organisation principale : ${MAIN_ORGANIZATION_NAME}`);
  console.log('Parcours demo recommande :');
  console.log('1. Dashboard portefeuille');
  console.log('2. Division pavillonnaire - Tourcoing (derive critique)');
  console.log('3. Immeuble de rapport - Roubaix Centre (projet sain)');
  console.log('4. Colocation 4 chambres - Valenciennes (options et scenarios)');
  console.log('5. Retour dashboard pour la lecture portefeuille');
  console.log('');
  console.log('Comptes locaux :');
  console.log(
    `- ${USERS.admin.email} / ${USERS.admin.password} (${actors.admin.firstName} ${actors.admin.lastName}, owner/admin)`,
  );
  console.log(
    `- ${USERS.collaborator.email} / ${USERS.collaborator.password} (${actors.collaborator.firstName} ${actors.collaborator.lastName}, collaborateur)`,
  );
  console.log(
    `- ${USERS.reader.email} / ${USERS.reader.password} (${actors.reader.firstName} ${actors.reader.lastName}, lecture seule)`,
  );
  console.log('');
  console.log('Portefeuille principal :');
  console.log('- Immeuble de rapport - Roubaix Centre (OK)');
  console.log('- T2 meuble - Lille Fives (a surveiller)');
  console.log('- Division pavillonnaire - Tourcoing (problematique)');
  console.log('- Local commercial + logement - Arras (incomplet)');
  console.log('- Colocation 4 chambres - Valenciennes (options + watch forecast)');
  console.log('- Maison a renover - Lens (derive portefeuille)');
}

export async function runDemoSeedCommand() {
  try {
    await runDemoSeed();
  } finally {
    await prisma.$disconnect();
  }
}

const isMainModule =
  typeof process.argv[1] === 'string' &&
  process.argv[1].includes('demo-seed');

if (isMainModule) {
  runDemoSeedCommand().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
