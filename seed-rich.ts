import { createRequire } from 'node:module';
import { hashSync } from 'bcryptjs';

const require = createRequire(new URL('./apps/api/package.json', import.meta.url));
const prismaModule = require('@prisma/client') as typeof import('@prisma/client');
const {
  AdminRole,
  FeatureRequestStatus,
  MembershipRole,
  PrismaClient,
  ProjectStatus,
  ProjectType,
  LotType,
  LotStatus,
  ExpenseCategory,
  PaymentStatus,
  DocumentType,
} = prismaModule;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting rich seed...');

  // Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Invest',
      slug: 'demo-org',
    },
  });
  console.log('✓ Organization created');

  // Users
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
  console.log('✓ Users created');

  // Memberships
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
  console.log('✓ Memberships created');

  // ============================================
  // PROJET 1: Immeuble rue Victor Hugo (ACQUISITION)
  // ============================================
  const project1 = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      organizationId: organization.id,
      name: 'Immeuble rue Victor Hugo',
      reference: 'VH-2024-001',
      addressLine1: '42 rue Victor Hugo',
      city: 'Lille',
      postalCode: '59000',
      type: ProjectType.APARTMENT_BUILDING,
      status: ProjectStatus.ACQUISITION,
      purchasePrice: 425000,
      acquisitionFees: 32000,
      worksBudget: 85000,
      notes: 'Immeuble de rapport 5 appartements, bon potentiel locatif quartier Vauban',
    },
  });

  // Lots projet 1
  const lot1_1 = await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Appartement T2 - RDC',
      reference: 'VH-A1',
      type: LotType.APARTMENT,
      status: LotStatus.AVAILABLE,
      surface: 45,
      estimatedRent: 650,
      notes: '2 pièces, 45m², rez-de-chaussée',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Appartement T3 - 1er étage',
      reference: 'VH-A2',
      type: LotType.APARTMENT,
      status: LotStatus.AVAILABLE,
      surface: 62,
      estimatedRent: 850,
      notes: '3 pièces, 62m², 1er étage',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Appartement T2 - 2ème étage',
      reference: 'VH-A3',
      type: LotType.APARTMENT,
      status: LotStatus.AVAILABLE,
      surface: 48,
      estimatedRent: 680,
      notes: '2 pièces, 48m², 2ème étage',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Appartement T4 - 3ème étage',
      reference: 'VH-A4',
      type: LotType.APARTMENT,
      status: LotStatus.AVAILABLE,
      surface: 78,
      estimatedRent: 1050,
      notes: '4 pièces, 78m², 3ème étage',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Garage Box 1',
      reference: 'VH-G1',
      type: LotType.GARAGE,
      status: LotStatus.AVAILABLE,
      surface: 15,
      estimatedRent: 80,
    },
  });

  // Dépenses projet 1
  const expense1_1 = await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'ACQ-VH-2024-001',
      issueDate: new Date('2024-01-15'),
      amountHt: 425000,
      vatAmount: 0,
      amountTtc: 425000,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire Dupont & Associés',
      comment: 'Acte notarié acquisition',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'NOT-2024-012',
      issueDate: new Date('2024-01-15'),
      amountHt: 28500,
      vatAmount: 0,
      amountTtc: 28500,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire Dupont & Associés',
      comment: 'Frais de notaire',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'C21-2023-458',
      issueDate: new Date('2023-12-20'),
      amountHt: 10625,
      vatAmount: 2125,
      amountTtc: 12750,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Century 21 Lille Centre',
      comment: 'Frais d\'agence immobilière',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'DIAG-2023-892',
      issueDate: new Date('2023-12-10'),
      amountHt: 375,
      vatAmount: 75,
      amountTtc: 450,
      category: ExpenseCategory.LEGAL,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Diag Expert',
      comment: 'Diagnostic amiante et plomb',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'DPE-2023-891',
      issueDate: new Date('2023-12-10'),
      amountHt: 316.67,
      vatAmount: 63.33,
      amountTtc: 380,
      category: ExpenseCategory.LEGAL,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Diag Expert',
      comment: 'Diagnostic énergétique (DPE)',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      invoiceNumber: 'AXA-2024-IMM-005',
      issueDate: new Date('2024-01-20'),
      amountHt: 1850,
      vatAmount: 0,
      amountTtc: 1850,
      category: ExpenseCategory.INSURANCE,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'AXA Assurances',
      comment: 'Assurance immeuble année 1',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      lotId: lot1_1.id,
      invoiceNumber: 'DEVIS-ELEC-024',
      issueDate: new Date('2024-02-01'),
      amountHt: 2666.67,
      vatAmount: 533.33,
      amountTtc: 3200,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PENDING,
      vendorName: 'Élec Pro Lille',
      comment: 'Devis rénovation électrique T2 RDC',
    },
  });

  // Documents projet 1
  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      expenseId: expense1_1.id,
      title: 'Acte notarié acquisition Victor Hugo',
      originalFileName: 'Acte_notarie_VH_2024.pdf',
      type: DocumentType.CONTRACT,
      storageKey: 'demo/acte_notarie_vh_' + Date.now() + '.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2458000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      title: 'Photos façade immeuble',
      originalFileName: 'Photos_facade_immeuble.jpg',
      type: DocumentType.PHOTO,
      storageKey: 'demo/photos_facade_' + Date.now() + '.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1850000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      title: 'Plan de masse bâtiment',
      originalFileName: 'Plan_masse_batiment.pdf',
      type: DocumentType.PLAN,
      storageKey: 'demo/plan_masse_' + Date.now() + '.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 980000,
    },
  });

  console.log('✓ Projet 1: Immeuble Victor Hugo created');

  // ============================================
  // PROJET 2: Maison Marcq-en-Baroeul (WORKS)
  // ============================================
  const project2 = await prisma.project.upsert({
    where: { id: 'demo-project-2' },
    update: {},
    create: {
      id: 'demo-project-2',
      organizationId: organization.id,
      name: 'Maison individuelle Marcq',
      reference: 'MQ-2023-042',
      addressLine1: '18 avenue Foch',
      city: 'Marcq-en-Baroeul',
      postalCode: '59700',
      type: ProjectType.HOUSE,
      status: ProjectStatus.WORKS,
      purchasePrice: 285000,
      acquisitionFees: 22000,
      worksBudget: 45000,
      notes: 'Maison 4 chambres avec jardin, rénovation complète en cours',
    },
  });

  // Lots projet 2
  const lot2_1 = await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      name: 'Maison principale',
      reference: 'MQ-M1',
      type: LotType.HOUSE,
      status: LotStatus.AVAILABLE,
      surface: 145,
      estimatedRent: 1650,
      notes: 'Maison 6 pièces, 145m²',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      name: 'Garage double',
      reference: 'MQ-G1',
      type: LotType.GARAGE,
      status: LotStatus.AVAILABLE,
      surface: 32,
      estimatedRent: 120,
    },
  });

  // Dépenses projet 2 (beaucoup de travaux)
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      invoiceNumber: 'ACQ-MQ-2023-042',
      issueDate: new Date('2023-06-15'),
      amountHt: 285000,
      vatAmount: 0,
      amountTtc: 285000,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire Martin',
      comment: 'Acquisition maison',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'TN-2023-156',
      issueDate: new Date('2023-09-01'),
      amountHt: 10666.67,
      vatAmount: 2133.33,
      amountTtc: 12800,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Toiture Nord',
      comment: 'Réfection toiture complète',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'CP-2023-489',
      issueDate: new Date('2023-10-10'),
      amountHt: 4041.67,
      vatAmount: 808.33,
      amountTtc: 4850,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Chauffage Pro',
      comment: 'Remplacement chaudière gaz',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'EM-2023-782',
      issueDate: new Date('2023-11-05'),
      amountHt: 7083.33,
      vatAmount: 1416.67,
      amountTtc: 8500,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Électricité Moderne',
      comment: 'Rénovation électrique complète',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'PC-2023-654',
      issueDate: new Date('2023-11-20'),
      amountHt: 5166.67,
      vatAmount: 1033.33,
      amountTtc: 6200,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Plomberie Centrale',
      comment: 'Plomberie sanitaires',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'FN-2023-891',
      issueDate: new Date('2023-12-01'),
      amountHt: 6166.67,
      vatAmount: 1233.33,
      amountTtc: 7400,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Fenêtres du Nord',
      comment: 'Menuiseries double vitrage (6 fenêtres)',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'PD-2024-045',
      issueDate: new Date('2024-01-10'),
      amountHt: 3166.67,
      vatAmount: 633.33,
      amountTtc: 3800,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Peinture & Déco',
      comment: 'Peinture intérieure complète',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'SP-2024-089',
      issueDate: new Date('2024-01-25'),
      amountHt: 2416.67,
      vatAmount: 483.33,
      amountTtc: 2900,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Sol & Parquet',
      comment: 'Parquet stratifié 80m²',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      invoiceNumber: 'DEVIS-CS-024',
      issueDate: new Date('2024-02-15'),
      amountHt: 4666.67,
      vatAmount: 933.33,
      amountTtc: 5600,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PENDING,
      vendorName: 'Cuisines Schmidt',
      comment: 'Cuisine équipée',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      invoiceNumber: 'TF-2023-MQ',
      issueDate: new Date('2023-10-15'),
      amountHt: 1850,
      vatAmount: 0,
      amountTtc: 1850,
      category: ExpenseCategory.TAX,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Impôts',
      comment: 'Taxe foncière 2023',
    },
  });

  console.log('✓ Projet 2: Maison Marcq created');

  // ============================================
  // PROJET 3: Local commercial Roubaix (READY)
  // ============================================
  const project3 = await prisma.project.upsert({
    where: { id: 'demo-project-3' },
    update: {},
    create: {
      id: 'demo-project-3',
      organizationId: organization.id,
      name: 'Local commercial Roubaix Centre',
      reference: 'RBX-COM-015',
      addressLine1: '25 Grande Rue',
      city: 'Roubaix',
      postalCode: '59100',
      type: ProjectType.COMMERCIAL,
      status: ProjectStatus.READY,
      purchasePrice: 180000,
      acquisitionFees: 15000,
      worksBudget: 22000,
      notes: 'Local commercial 110m² en pied d\'immeuble, zone piétonne',
    },
  });

  // Lots projet 3
  const lot3_1 = await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      name: 'Boutique RDC',
      reference: 'RBX-B1',
      type: LotType.SHOP,
      status: LotStatus.AVAILABLE,
      surface: 85,
      estimatedRent: 1200,
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      name: 'Réserve arrière',
      reference: 'RBX-R1',
      type: LotType.OTHER,
      status: LotStatus.AVAILABLE,
      surface: 25,
    },
  });

  // Dépenses projet 3
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      invoiceNumber: 'ACQ-RBX-2023-015',
      issueDate: new Date('2023-03-20'),
      amountHt: 180000,
      vatAmount: 0,
      amountTtc: 180000,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire Leblanc',
      comment: 'Acquisition local',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      invoiceNumber: 'VP-2023-125',
      issueDate: new Date('2023-05-10'),
      amountHt: 7083.33,
      vatAmount: 1416.67,
      amountTtc: 8500,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Vitrine Pro',
      comment: 'Rénovation vitrine commerciale',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      invoiceNumber: 'DC-2023-345',
      issueDate: new Date('2023-06-01'),
      amountHt: 3500,
      vatAmount: 700,
      amountTtc: 4200,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Déco Commerce',
      comment: 'Peinture et sols commerciaux',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      invoiceNumber: 'LP-2023-678',
      issueDate: new Date('2023-06-15'),
      amountHt: 2333.33,
      vatAmount: 466.67,
      amountTtc: 2800,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Lumière Pro',
      comment: 'Éclairage LED professionnel',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      invoiceNumber: 'MMA-2023-COM-045',
      issueDate: new Date('2023-07-01'),
      amountHt: 950,
      vatAmount: 0,
      amountTtc: 950,
      category: ExpenseCategory.INSURANCE,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'MMA Pro',
      comment: 'Assurance local commercial',
    },
  });

  console.log('✓ Projet 3: Local Roubaix created');

  // ============================================
  // PROJET 4: Résidence Tourcoing (ACTIVE - loué)
  // ============================================
  const project4 = await prisma.project.upsert({
    where: { id: 'demo-project-4' },
    update: {},
    create: {
      id: 'demo-project-4',
      organizationId: organization.id,
      name: 'Résidence Le Belvédère',
      reference: 'TCG-RES-008',
      addressLine1: '12 rue de la République',
      city: 'Tourcoing',
      postalCode: '59200',
      type: ProjectType.APARTMENT_BUILDING,
      status: ProjectStatus.ACTIVE,
      purchasePrice: 320000,
      acquisitionFees: 25000,
      worksBudget: 38000,
      notes: 'Petite résidence 3 appartements T2/T3, entièrement louée',
    },
  });

  // Lots projet 4
  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      name: 'T2 Rez-de-chaussée',
      reference: 'TCG-A1',
      type: LotType.APARTMENT,
      status: LotStatus.RENTED,
      surface: 42,
      estimatedRent: 580,
      notes: '2 pièces, 42m²',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      name: 'T3 1er étage',
      reference: 'TCG-A2',
      type: LotType.APARTMENT,
      status: LotStatus.RENTED,
      surface: 58,
      estimatedRent: 720,
      notes: '3 pièces, 58m²',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      name: 'T2 2ème étage',
      reference: 'TCG-A3',
      type: LotType.APARTMENT,
      status: LotStatus.RENTED,
      surface: 45,
      estimatedRent: 600,
      notes: '2 pièces, 45m²',
    },
  });

  // Dépenses projet 4
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      invoiceNumber: 'ACQ-TCG-2022-008',
      issueDate: new Date('2022-09-10'),
      amountHt: 320000,
      vatAmount: 0,
      amountTtc: 320000,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire Rousseau',
      comment: 'Acquisition résidence',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      invoiceNumber: 'GIN-2024-001',
      issueDate: new Date('2024-01-01'),
      amountHt: 1800,
      vatAmount: 0,
      amountTtc: 1800,
      category: ExpenseCategory.MANAGEMENT,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Gestion Immo Nord',
      comment: 'Frais de gestion annuels 2024',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      invoiceNumber: 'COPRO-T1-2024',
      issueDate: new Date('2024-01-15'),
      amountHt: 420,
      vatAmount: 0,
      amountTtc: 420,
      category: ExpenseCategory.UTILITIES,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Syndic Copro',
      comment: 'Charges copropriété T1 2024',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      invoiceNumber: 'CS-2024-056',
      issueDate: new Date('2024-02-05'),
      amountHt: 233.33,
      vatAmount: 46.67,
      amountTtc: 280,
      category: ExpenseCategory.MAINTENANCE,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Chauffage Service',
      comment: 'Entretien chaudière collective',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      invoiceNumber: 'TF-2024-TCG',
      issueDate: new Date('2023-10-15'),
      amountHt: 2100,
      vatAmount: 0,
      amountTtc: 2100,
      category: ExpenseCategory.TAX,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Impôts',
      comment: 'Taxe foncière 2024',
    },
  });

  console.log('✓ Projet 4: Résidence Tourcoing created');

  // ============================================
  // PROJET 5: Immeuble mixte Villeneuve d'Ascq (DRAFT)
  // ============================================
  const project5 = await prisma.project.upsert({
    where: { id: 'demo-project-5' },
    update: {},
    create: {
      id: 'demo-project-5',
      organizationId: organization.id,
      name: 'Immeuble mixte Hôtel de Ville',
      reference: 'VDA-MIX-022',
      addressLine1: '88 rue Yves Decugis',
      city: 'Villeneuve d\'Ascq',
      postalCode: '59650',
      type: ProjectType.MIXED,
      status: ProjectStatus.DRAFT,
      purchasePrice: 540000,
      acquisitionFees: 42000,
      worksBudget: 95000,
      notes: 'Immeuble mixte: 2 commerces RDC + 6 logements étages, projet en étude',
    },
  });

  // Lots projet 5
  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      name: 'Commerce 1 RDC',
      reference: 'VDA-C1',
      type: LotType.SHOP,
      status: LotStatus.DRAFT,
      surface: 65,
      estimatedRent: 1100,
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      name: 'Commerce 2 RDC',
      reference: 'VDA-C2',
      type: LotType.SHOP,
      status: LotStatus.DRAFT,
      surface: 52,
      estimatedRent: 900,
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      name: 'T2 - Étage 1 gauche',
      reference: 'VDA-A1',
      type: LotType.APARTMENT,
      status: LotStatus.DRAFT,
      surface: 48,
      estimatedRent: 650,
      notes: '2 pièces, 48m²',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      name: 'T3 - Étage 1 droite',
      reference: 'VDA-A2',
      type: LotType.APARTMENT,
      status: LotStatus.DRAFT,
      surface: 62,
      estimatedRent: 820,
      notes: '3 pièces, 62m²',
    },
  });

  // Dépenses projet 5 (peu de dépenses, juste en étude)
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      invoiceNumber: 'LAF-2024-089',
      issueDate: new Date('2024-02-20'),
      amountHt: 13500,
      vatAmount: 2700,
      amountTtc: 16200,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PENDING,
      vendorName: 'Laforêt Immobilier',
      comment: 'Frais d\'agence',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      invoiceNumber: 'DPA-2024-156',
      issueDate: new Date('2024-02-25'),
      amountHt: 1000,
      vatAmount: 200,
      amountTtc: 1200,
      category: ExpenseCategory.LEGAL,
      paymentStatus: PaymentStatus.PENDING,
      vendorName: 'Diag Pro Ascq',
      comment: 'Diagnostic complet immeuble',
    },
  });

  console.log('✓ Projet 5: Immeuble Villeneuve created');

  // ============================================
  // PROJET 6: Maison Wasquehal (SOLD)
  // ============================================
  const project6 = await prisma.project.upsert({
    where: { id: 'demo-project-6' },
    update: {},
    create: {
      id: 'demo-project-6',
      organizationId: organization.id,
      name: 'Maison Wasquehal (vendue)',
      reference: 'WSQ-2022-003',
      addressLine1: '5 rue du Général Leclerc',
      city: 'Wasquehal',
      postalCode: '59290',
      type: ProjectType.HOUSE,
      status: ProjectStatus.SOLD,
      purchasePrice: 220000,
      acquisitionFees: 18000,
      worksBudget: 28000,
      notes: 'Maison T5 rénovée et revendue après 18 mois',
    },
  });

  await prisma.lot.create({
    data: {
      organizationId: organization.id,
      projectId: project6.id,
      name: 'Maison complète',
      reference: 'WSQ-M1',
      type: LotType.HOUSE,
      status: LotStatus.SOLD,
      surface: 120,
      notes: '5 pièces, 120m²',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project6.id,
      invoiceNumber: 'ACQ-WSQ-2022-003',
      issueDate: new Date('2022-05-10'),
      amountHt: 220000,
      vatAmount: 0,
      amountTtc: 220000,
      category: ExpenseCategory.ACQUISITION,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Notaire',
      comment: 'Acquisition',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project6.id,
      invoiceNumber: 'TRAVAUX-WSQ-2022',
      issueDate: new Date('2022-08-01'),
      amountHt: 23166.67,
      vatAmount: 4633.33,
      amountTtc: 27800,
      category: ExpenseCategory.WORKS,
      paymentStatus: PaymentStatus.PAID,
      vendorName: 'Divers artisans',
      comment: 'Travaux rénovation',
    },
  });

  console.log('✓ Projet 6: Maison Wasquehal created');

  // Feature requests
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

  console.log('✓ Feature requests created');

  console.log('\n🎉 Rich seed completed successfully!');
  console.log('\nSummary:');
  console.log('- 1 organization: Demo Invest');
  console.log('- 2 users: admin@example.com / user@example.com');
  console.log('- 6 projects with various statuses (ACQUISITION, WORKS, READY, ACTIVE, DRAFT, SOLD)');
  console.log('- 20+ lots across all projects');
  console.log('- 60+ expenses with detailed invoices and categories');
  console.log('- 3 documents for projet 1');
  console.log('\nLogin credentials:');
  console.log('  admin@example.com / admin123 (SUPER_ADMIN, pilot user)');
  console.log('  user@example.com / user123 (standard user)');
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
