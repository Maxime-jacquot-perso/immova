import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanDatabase,
  cleanupUploads,
  prepareTestDatabase,
  seedUser,
} from './e2e-helpers';

describe('Simulations Work Items E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    await prepareTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanDatabase(prisma);
    await cleanupUploads();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.accessToken as string;
  }

  async function createSimulation(
    token: string,
    folderId: string,
    overrides: Record<string, unknown> = {},
  ) {
    const response = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId,
        name: 'Test Simulation',
        strategy: 'RENTAL',
        propertyType: 'ANCIEN',
        departmentCode: '75',
        purchasePrice: 200000,
        worksBudget: 30000,
        financingMode: 'LOAN',
        loanAmount: 180000,
        interestRate: 3.5,
        loanDurationMonths: 240,
        targetMonthlyRent: 1200,
        ...overrides,
      })
      .expect(201);

    return response.body.id as string;
  }

  it('calculates using global worksBudget when no work items exist', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Works Global',
      organizationSlug: 'org-works-global',
      email: 'works-global@example.com',
      password: 'password123',
    });

    const token = await login('works-global@example.com', 'password123');

    // Create folder
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Global' })
      .expect(201);

    // Create simulation with global worksBudget
    const simulationId = await createSimulation(token, folderResponse.body.id, {
      worksBudget: 25000,
    });

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    expect(activeValues).toBeDefined();
    expect(activeValues.activeWorksCost).toBe(25000);
    expect(activeValues.activeWorksCostSource).toContain('INITIAL');
    expect(activeValues.worksCostBreakdown).toEqual([]);
  });

  it('calculates using work item initial cost when no options are active', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Works Item',
      organizationSlug: 'org-works-item',
      email: 'works-item@example.com',
      password: 'password123',
    });

    const token = await login('works-item@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Item' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Create work item
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Menuiserie',
        initialCost: 10000,
        estimatedDurationDays: 15,
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    expect(activeValues.activeWorksCost).toBe(10000);
    expect(activeValues.activeWorksCostSource).toContain('POSTES');
    expect(activeValues.worksCostBreakdown).toEqual([
      {
        itemName: 'Menuiserie',
        cost: 10000,
        source: 'initial',
      },
    ]);
  });

  it('activates an option and recalculates using option cost', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Works Option',
      organizationSlug: 'org-works-option',
      email: 'works-option@example.com',
      password: 'password123',
    });

    const token = await login('works-option@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Option' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Create work item
    const itemResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Menuiserie',
        initialCost: 10000,
      })
      .expect(201);

    const itemId = itemResponse.body.id as string;

    // Add option
    const optionResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${itemId}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerName: 'Menuiserie Dupont',
        cost: 13500,
        durationDays: 12,
        notes: 'Devis reçu le 15/03',
      })
      .expect(201);

    const optionId = optionResponse.body.id as string;

    expect(optionResponse.body.status).toBe('CANDIDATE');

    // Activate option
    await request(app.getHttpServer())
      .post(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${optionId}/activate`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    expect(activeValues.activeWorksCost).toBe(13500);
    expect(activeValues.activeWorksCostSource).toContain('options');
    expect(activeValues.worksCostBreakdown).toEqual([
      {
        itemName: 'Menuiserie',
        cost: 13500,
        source: 'option',
        providerName: 'Menuiserie Dupont',
      },
    ]);

    // Verify option status
    const option = await prisma.workItemOption.findUnique({
      where: { id: optionId },
    });

    expect(option?.status).toBe('ACTIVE');
  });

  it('switches between options and recalculates correctly', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Works Switch',
      organizationSlug: 'org-works-switch',
      email: 'works-switch@example.com',
      password: 'password123',
    });

    const token = await login('works-switch@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Switch' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Create work item
    const itemResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Menuiserie',
        initialCost: 10000,
      })
      .expect(201);

    const itemId = itemResponse.body.id as string;

    // Add first option
    const option1Response = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${itemId}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerName: 'Menuiserie Dupont',
        cost: 13500,
      })
      .expect(201);

    const option1Id = option1Response.body.id as string;

    // Add second option
    const option2Response = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${itemId}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerName: 'Menuiserie Martin',
        cost: 14800,
      })
      .expect(201);

    const option2Id = option2Response.body.id as string;

    // Activate first option
    await request(app.getHttpServer())
      .post(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${option1Id}/activate`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Verify first option is active
    let detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.activeValues.activeWorksCost).toBe(13500);

    // Switch to second option
    await request(app.getHttpServer())
      .post(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${option2Id}/activate`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Verify second option is active and first is candidate
    detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.activeValues.activeWorksCost).toBe(14800);

    const option1 = await prisma.workItemOption.findUnique({
      where: { id: option1Id },
    });
    const option2 = await prisma.workItemOption.findUnique({
      where: { id: option2Id },
    });

    expect(option1?.status).toBe('CANDIDATE');
    expect(option2?.status).toBe('ACTIVE');
  });

  it('calculates using lot rents when lots are defined', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Lots Rent',
      organizationSlug: 'org-lots-rent',
      email: 'lots-rent@example.com',
      password: 'password123',
    });

    const token = await login('lots-rent@example.com', 'password123');

    // Create folder and simulation with manual rent
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Lots' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id, {
      targetMonthlyRent: 2000,
    });

    // Add lots with estimated rents
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement T3',
        surface: 65,
        estimatedRent: 900,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Garage',
        estimatedRent: 100,
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    // Total rent from lots should be 900 + 100 = 1000, not the manual 2000
    expect(activeValues.activeMonthlyRent).toBe(1000);
    expect(activeValues.activeMonthlyRentSource).toContain('LOTS');
  });

  it('includes lots with zero rent when at least one lot has rent', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Partial Rent',
      organizationSlug: 'org-partial-rent',
      email: 'partial-rent@example.com',
      password: 'password123',
    });

    const token = await login('partial-rent@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Partial' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id, {
      targetMonthlyRent: 1500,
    });

    // Add lots - one with rent, one without
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement',
        estimatedRent: 800,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cave',
        // No estimatedRent
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    // Total should be 800 + 0 = 800 (cave contributes 0)
    expect(activeValues.activeMonthlyRent).toBe(800);
    expect(activeValues.activeMonthlyRentSource).toContain('LOTS');
  });

  it('combines multiple work items with mixed initial and option costs', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Mixed Works',
      organizationSlug: 'org-mixed-works',
      email: 'mixed-works@example.com',
      password: 'password123',
    });

    const token = await login('mixed-works@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Mixed' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Create first work item (with active option)
    const item1Response = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Menuiserie',
        initialCost: 10000,
      })
      .expect(201);

    const item1Id = item1Response.body.id as string;

    const option1Response = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${item1Id}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        providerName: 'Menuiserie Dupont',
        cost: 13500,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/simulations/${simulationId}/work-items/${item1Id}/options/${option1Response.body.id}/activate`,
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    // Create second work item (no option, uses initial cost)
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plomberie',
        initialCost: 8000,
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    // Total should be 13500 (option) + 8000 (initial) = 21500
    expect(activeValues.activeWorksCost).toBe(21500);
    expect(activeValues.worksCostBreakdown).toHaveLength(2);
    expect(activeValues.worksCostBreakdown).toEqual(
      expect.arrayContaining([
        {
          itemName: 'Menuiserie',
          cost: 13500,
          source: 'option',
          providerName: 'Menuiserie Dupont',
        },
        {
          itemName: 'Plomberie',
          cost: 8000,
          source: 'initial',
        },
      ]),
    );
  });

  it('enforces multi-tenant isolation for work items and options', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Tenant A',
      organizationSlug: 'org-tenant-a',
      email: 'tenant-a@example.com',
      password: 'password123',
    });

    const outsider = await seedUser(prisma, {
      organizationName: 'Org Tenant B',
      organizationSlug: 'org-tenant-b',
      email: 'tenant-b@example.com',
      password: 'password123',
    });

    const tokenA = await login('tenant-a@example.com', 'password123');
    const tokenB = await login('tenant-b@example.com', 'password123');

    // Actor creates folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Folder A' })
      .expect(201);

    const simulationId = await createSimulation(tokenA, folderResponse.body.id);

    // Actor creates work item
    const itemResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Menuiserie',
        initialCost: 10000,
      })
      .expect(201);

    const itemId = itemResponse.body.id as string;

    // Actor creates option
    const optionResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${itemId}/options`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        providerName: 'Dupont',
        cost: 12000,
      })
      .expect(201);

    const optionId = optionResponse.body.id as string;

    // Outsider cannot list work items
    await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Outsider cannot create work item
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Hacked Item',
        initialCost: 5000,
      })
      .expect(404);

    // Outsider cannot update work item
    await request(app.getHttpServer())
      .patch(`/api/simulations/${simulationId}/work-items/${itemId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        name: 'Hacked Name',
      })
      .expect(404);

    // Outsider cannot delete work item
    await request(app.getHttpServer())
      .delete(`/api/simulations/${simulationId}/work-items/${itemId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Outsider cannot create option
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/work-items/${itemId}/options`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        providerName: 'Hacked Provider',
        cost: 1000,
      })
      .expect(404);

    // Outsider cannot activate option
    await request(app.getHttpServer())
      .post(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${optionId}/activate`,
      )
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Outsider cannot update option
    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${optionId}`,
      )
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        cost: 1,
      })
      .expect(404);

    // Outsider cannot delete option
    await request(app.getHttpServer())
      .delete(
        `/api/simulations/${simulationId}/work-items/${itemId}/options/${optionId}`,
      )
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    // Verify data isolation
    const actorWorkItems = await prisma.simulationWorkItem.findMany({
      where: { organizationId: actor.organization.id },
    });
    const outsiderWorkItems = await prisma.simulationWorkItem.findMany({
      where: { organizationId: outsider.organization.id },
    });

    expect(actorWorkItems).toHaveLength(1);
    expect(outsiderWorkItems).toHaveLength(0);
  });

  it('accepts valid lot types (APARTMENT, GARAGE, CELLAR, OTHER)', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Valid Lot Types',
      organizationSlug: 'org-valid-lot-types',
      email: 'valid-lot-types@example.com',
      password: 'password123',
    });

    const token = await login('valid-lot-types@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Valid Types' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Test APARTMENT type
    const apartmentResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'T3',
        type: 'APARTMENT',
        surface: 65,
        estimatedRent: 900,
      })
      .expect(201);

    expect(apartmentResponse.body.type).toBe('APARTMENT');

    // Test GARAGE type
    const garageResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Garage',
        type: 'GARAGE',
        estimatedRent: 100,
      })
      .expect(201);

    expect(garageResponse.body.type).toBe('GARAGE');

    // Test CELLAR type
    const cellarResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cave',
        type: 'CELLAR',
        estimatedRent: 50,
      })
      .expect(201);

    expect(cellarResponse.body.type).toBe('CELLAR');

    // Test OTHER type
    const otherResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Local commercial',
        type: 'OTHER',
        estimatedRent: 500,
      })
      .expect(201);

    expect(otherResponse.body.type).toBe('OTHER');
  });

  it('rejects invalid lot types (French values)', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Invalid Lot Types',
      organizationSlug: 'org-invalid-lot-types',
      email: 'invalid-lot-types@example.com',
      password: 'password123',
    });

    const token = await login('invalid-lot-types@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Invalid Types' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id);

    // Test APPARTEMENT (French) should fail
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'T3',
        type: 'APPARTEMENT',
        estimatedRent: 900,
      })
      .expect(400);

    // Test MAISON (French) should fail
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Maison',
        type: 'MAISON',
        estimatedRent: 1200,
      })
      .expect(400);

    // Test CAVE (French) should fail
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cave',
        type: 'CAVE',
        estimatedRent: 50,
      })
      .expect(400);
  });

  it('correctly counts lots contributing to rent calculation', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Rent Contributors',
      organizationSlug: 'org-rent-contributors',
      email: 'rent-contributors@example.com',
      password: 'password123',
    });

    const token = await login('rent-contributors@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Folder Contributors' })
      .expect(201);

    const simulationId = await createSimulation(token, folderResponse.body.id, {
      targetMonthlyRent: 2000,
    });

    // Add 3 lots: 2 with rent, 1 without
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement',
        type: 'APARTMENT',
        estimatedRent: 900,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Garage',
        type: 'GARAGE',
        estimatedRent: 100,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cave sans loyer',
        type: 'CELLAR',
        // No estimatedRent - should contribute 0
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const activeValues = detailResponse.body.activeValues;

    // Total should be 900 + 100 + 0 = 1000
    expect(activeValues.activeMonthlyRent).toBe(1000);
    expect(activeValues.activeMonthlyRentSource).toContain('LOTS');

    // Verify all 3 lots are in the response
    expect(detailResponse.body.lots).toHaveLength(3);

    // Verify that 2 lots contribute to rent (those with estimatedRent > 0)
    const lotsWithRent = detailResponse.body.lots.filter(
      (lot: any) => lot.estimatedRent > 0,
    );
    expect(lotsWithRent).toHaveLength(2);
  });
});
