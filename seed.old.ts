import {
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
} from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

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
      address: '42 rue Victor Hugo',
      city: 'Lille',
      postalCode: '59000',
      type: ProjectType.APARTMENT_BUILDING,
      status: ProjectStatus.ACQUISITION,
      purchasePrice: 425000,
      acquisitionFees: 32000,
      worksEstimate: 85000,
      description: 'Immeuble de rapport 5 appartements, bon potentiel locatif quartier Vauban',
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
      rooms: 2,
      estimatedRent: 650,
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
      rooms: 3,
      estimatedRent: 850,
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
      rooms: 2,
      estimatedRent: 680,
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
      rooms: 4,
      estimatedRent: 1050,
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
      label: 'Acte notarié acquisition',
      category: ExpenseCategory.ACQUISITION,
      amount: 425000,
      date: new Date('2024-01-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire Dupont & Associés',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      label: 'Frais de notaire',
      category: ExpenseCategory.ACQUISITION,
      amount: 28500,
      date: new Date('2024-01-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire Dupont & Associés',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      label: 'Frais d\'agence immobilière',
      category: ExpenseCategory.ACQUISITION,
      amount: 12750,
      date: new Date('2023-12-20'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Century 21 Lille Centre',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      label: 'Diagnostic amiante et plomb',
      category: ExpenseCategory.LEGAL,
      amount: 450,
      date: new Date('2023-12-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Diag Expert',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      label: 'Diagnostic énergétique (DPE)',
      category: ExpenseCategory.LEGAL,
      amount: 380,
      date: new Date('2023-12-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Diag Expert',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      label: 'Assurance immeuble année 1',
      category: ExpenseCategory.INSURANCE,
      amount: 1850,
      date: new Date('2024-01-20'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'AXA Assurances',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      lotId: lot1_1.id,
      label: 'Devis rénovation électrique T2 RDC',
      category: ExpenseCategory.WORKS,
      amount: 3200,
      date: new Date('2024-02-01'),
      paymentStatus: PaymentStatus.PENDING,
      vendor: 'Élec Pro Lille',
    },
  });

  // Documents projet 1
  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      expenseId: expense1_1.id,
      name: 'Acte_notarie_VH_2024.pdf',
      type: DocumentType.CONTRACT,
      storagePath: '/demo/acte_notarie_vh.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 2458000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Photos_facade_immeuble.jpg',
      type: DocumentType.PHOTO,
      storagePath: '/demo/photos_facade.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1850000,
    },
  });

  await prisma.document.create({
    data: {
      organizationId: organization.id,
      projectId: project1.id,
      name: 'Plan_masse_batiment.pdf',
      type: DocumentType.PLAN,
      storagePath: '/demo/plan_masse.pdf',
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
      address: '18 avenue Foch',
      city: 'Marcq-en-Baroeul',
      postalCode: '59700',
      type: ProjectType.HOUSE,
      status: ProjectStatus.WORKS,
      purchasePrice: 285000,
      acquisitionFees: 22000,
      worksEstimate: 45000,
      description: 'Maison 4 chambres avec jardin, rénovation complète en cours',
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
      rooms: 6,
      estimatedRent: 1650,
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
      label: 'Acquisition maison',
      category: ExpenseCategory.ACQUISITION,
      amount: 285000,
      date: new Date('2023-06-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire Martin',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Réfection toiture complète',
      category: ExpenseCategory.WORKS,
      amount: 12800,
      date: new Date('2023-09-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Toiture Nord',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Remplacement chaudière gaz',
      category: ExpenseCategory.WORKS,
      amount: 4850,
      date: new Date('2023-10-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Chauffage Pro',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Rénovation électrique complète',
      category: ExpenseCategory.WORKS,
      amount: 8500,
      date: new Date('2023-11-05'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Électricité Moderne',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Plomberie sanitaires',
      category: ExpenseCategory.WORKS,
      amount: 6200,
      date: new Date('2023-11-20'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Plomberie Centrale',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Menuiseries double vitrage (6 fenêtres)',
      category: ExpenseCategory.WORKS,
      amount: 7400,
      date: new Date('2023-12-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Fenêtres du Nord',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Peinture intérieure complète',
      category: ExpenseCategory.WORKS,
      amount: 3800,
      date: new Date('2024-01-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Peinture & Déco',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Parquet stratifié 80m²',
      category: ExpenseCategory.WORKS,
      amount: 2900,
      date: new Date('2024-01-25'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Sol & Parquet',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      lotId: lot2_1.id,
      label: 'Cuisine équipée',
      category: ExpenseCategory.WORKS,
      amount: 5600,
      date: new Date('2024-02-15'),
      paymentStatus: PaymentStatus.PENDING,
      vendor: 'Cuisines Schmidt',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project2.id,
      label: 'Taxe foncière 2023',
      category: ExpenseCategory.TAX,
      amount: 1850,
      date: new Date('2023-10-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Impôts',
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
      address: '25 Grande Rue',
      city: 'Roubaix',
      postalCode: '59100',
      type: ProjectType.COMMERCIAL,
      status: ProjectStatus.READY,
      purchasePrice: 180000,
      acquisitionFees: 15000,
      worksEstimate: 22000,
      description: 'Local commercial 110m² en pied d\'immeuble, zone piétonne',
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
      label: 'Acquisition local',
      category: ExpenseCategory.ACQUISITION,
      amount: 180000,
      date: new Date('2023-03-20'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire Leblanc',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      label: 'Rénovation vitrine commerciale',
      category: ExpenseCategory.WORKS,
      amount: 8500,
      date: new Date('2023-05-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Vitrine Pro',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      label: 'Peinture et sols commerciaux',
      category: ExpenseCategory.WORKS,
      amount: 4200,
      date: new Date('2023-06-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Déco Commerce',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      lotId: lot3_1.id,
      label: 'Éclairage LED professionnel',
      category: ExpenseCategory.WORKS,
      amount: 2800,
      date: new Date('2023-06-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Lumière Pro',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project3.id,
      label: 'Assurance local commercial',
      category: ExpenseCategory.INSURANCE,
      amount: 950,
      date: new Date('2023-07-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'MMA Pro',
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
      address: '12 rue de la République',
      city: 'Tourcoing',
      postalCode: '59200',
      type: ProjectType.APARTMENT_BUILDING,
      status: ProjectStatus.ACTIVE,
      purchasePrice: 320000,
      acquisitionFees: 25000,
      worksEstimate: 38000,
      description: 'Petite résidence 3 appartements T2/T3, entièrement louée',
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
      rooms: 2,
      estimatedRent: 580,
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
      rooms: 3,
      estimatedRent: 720,
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
      rooms: 2,
      estimatedRent: 600,
    },
  });

  // Dépenses projet 4
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      label: 'Acquisition résidence',
      category: ExpenseCategory.ACQUISITION,
      amount: 320000,
      date: new Date('2022-09-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire Rousseau',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      label: 'Frais de gestion annuels 2024',
      category: ExpenseCategory.MANAGEMENT,
      amount: 1800,
      date: new Date('2024-01-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Gestion Immo Nord',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      label: 'Charges copropriété T1 2024',
      category: ExpenseCategory.UTILITIES,
      amount: 420,
      date: new Date('2024-01-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Syndic Copro',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      label: 'Entretien chaudière collective',
      category: ExpenseCategory.MAINTENANCE,
      amount: 280,
      date: new Date('2024-02-05'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Chauffage Service',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project4.id,
      label: 'Taxe foncière 2024',
      category: ExpenseCategory.TAX,
      amount: 2100,
      date: new Date('2023-10-15'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Impôts',
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
      address: '88 rue Yves Decugis',
      city: 'Villeneuve d\'Ascq',
      postalCode: '59650',
      type: ProjectType.MIXED,
      status: ProjectStatus.DRAFT,
      purchasePrice: 540000,
      acquisitionFees: 42000,
      worksEstimate: 95000,
      description: 'Immeuble mixte: 2 commerces RDC + 6 logements étages, projet en étude',
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
      rooms: 2,
      estimatedRent: 650,
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
      rooms: 3,
      estimatedRent: 820,
    },
  });

  // Dépenses projet 5 (peu de dépenses, juste en étude)
  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      label: 'Frais d\'agence',
      category: ExpenseCategory.ACQUISITION,
      amount: 16200,
      date: new Date('2024-02-20'),
      paymentStatus: PaymentStatus.PENDING,
      vendor: 'Laforêt Immobilier',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project5.id,
      label: 'Diagnostic complet immeuble',
      category: ExpenseCategory.LEGAL,
      amount: 1200,
      date: new Date('2024-02-25'),
      paymentStatus: PaymentStatus.PENDING,
      vendor: 'Diag Pro Ascq',
    },
  });

  console.log('✓ Projet 5: Immeuble Villeneuve created');

  // ============================================
  // PROJET 6: Maison Wasquehal (SOLD - archivé)
  // ============================================
  const project6 = await prisma.project.upsert({
    where: { id: 'demo-project-6' },
    update: {},
    create: {
      id: 'demo-project-6',
      organizationId: organization.id,
      name: 'Maison Wasquehal (vendue)',
      reference: 'WSQ-2022-003',
      address: '5 rue du Général Leclerc',
      city: 'Wasquehal',
      postalCode: '59290',
      type: ProjectType.HOUSE,
      status: ProjectStatus.SOLD,
      purchasePrice: 220000,
      acquisitionFees: 18000,
      worksEstimate: 28000,
      description: 'Maison T5 rénovée et revendue après 18 mois',
      archivedAt: new Date('2023-11-15'),
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
      rooms: 5,
      archivedAt: new Date('2023-11-15'),
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project6.id,
      label: 'Acquisition',
      category: ExpenseCategory.ACQUISITION,
      amount: 220000,
      date: new Date('2022-05-10'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Notaire',
    },
  });

  await prisma.expense.create({
    data: {
      organizationId: organization.id,
      projectId: project6.id,
      label: 'Travaux rénovation',
      category: ExpenseCategory.WORKS,
      amount: 27800,
      date: new Date('2022-08-01'),
      paymentStatus: PaymentStatus.PAID,
      vendor: 'Divers artisans',
    },
  });

  console.log('✓ Projet 6: Maison Wasquehal (archivé) created');

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

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nSummary:');
  console.log('- 1 organization: Demo Invest');
  console.log('- 2 users: admin@example.com / user@example.com');
  console.log('- 6 projects with various statuses');
  console.log('- 20+ lots across all projects');
  console.log('- 50+ expenses with detailed categories');
  console.log('- Several documents');
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
