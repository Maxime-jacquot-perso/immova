import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanDatabase,
  cleanupUploads,
  prepareTestDatabase,
  seedUser,
} from './e2e-helpers';

describe('Simulation Options E2E', () => {
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

  async function setupSimulation(prefix: string) {
    const actor = await seedUser(prisma, {
      organizationName: `Org ${prefix}`,
      organizationSlug: `org-${prefix}`,
      email: `${prefix}@example.com`,
      password: 'password123',
    });

    const token = await login(`${prefix}@example.com`, 'password123');

    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Folder ${prefix}` })
      .expect(201);

    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId: folderResponse.body.id,
        name: `Simulation ${prefix}`,
        strategy: 'FLIP',
        propertyType: 'ANCIEN',
        departmentCode: '75',
        purchasePrice: 250000,
        worksBudget: 50000,
        financingMode: 'LOAN',
        downPayment: 50000,
        loanAmount: 200000,
        interestRate: 2.5,
        loanDurationMonths: 240,
        targetResalePrice: 360000,
      })
      .expect(201);

    const groupResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationResponse.body.id}/option-groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PURCHASE_PRICE',
        label: "Prix d'achat",
      })
      .expect(201);

    const optionAResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationResponse.body.id}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: groupResponse.body.id,
        label: 'Offre 240k',
        valueJson: { price: 240000 },
        source: 'MANUAL',
      })
      .expect(201);

    const optionBResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationResponse.body.id}/options`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: groupResponse.body.id,
        label: 'Prix négocié 235k',
        valueJson: { price: 235000 },
        source: 'MANUAL',
      })
      .expect(201);

    return {
      actor,
      token,
      simulationId: simulationResponse.body.id as string,
      groupId: groupResponse.body.id as string,
      optionAId: optionAResponse.body.id as string,
      optionBId: optionBResponse.body.id as string,
    };
  }

  it('records a readable activation history with previous and next choices', async () => {
    const context = await setupSimulation('options-history');

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionBId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const logs = await prisma.simulationOptionActivationLog.findMany({
      where: {
        organizationId: context.actor.organization.id,
        simulationId: context.simulationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(logs).toHaveLength(2);
    expect(logs[0]).toMatchObject({
      optionGroupId: context.groupId,
      previousOptionId: null,
      newOptionId: context.optionAId,
      activatedByUserId: context.actor.user.id,
    });
    expect(logs[1]).toMatchObject({
      optionGroupId: context.groupId,
      previousOptionId: context.optionAId,
      newOptionId: context.optionBId,
      activatedByUserId: context.actor.user.id,
    });

    const historyResponse = await request(app.getHttpServer())
      .get(
        `/api/simulations/${context.simulationId}/options/activation-history`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    expect(historyResponse.body).toHaveLength(2);
    expect(historyResponse.body[0]).toMatchObject({
      groupType: 'PURCHASE_PRICE',
      previous: expect.stringContaining('Offre 240k'),
      next: expect.stringContaining('Prix négocié 235k'),
      user: {
        id: context.actor.user.id,
        displayName: 'E2E User',
        email: 'options-history@example.com',
      },
    });
    expect(historyResponse.body[0].delta.totalProjectCost).toBeLessThan(0);
    expect(historyResponse.body[0].delta.margin).toBeGreaterThan(0);
  });

  it('does not create a new log when the active option is selected again', async () => {
    const context = await setupSimulation('options-idempotent');

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const countAfterFirstActivation =
      await prisma.simulationOptionActivationLog.count({
        where: {
          organizationId: context.actor.organization.id,
          simulationId: context.simulationId,
        },
      });

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const countAfterSecondActivation =
      await prisma.simulationOptionActivationLog.count({
        where: {
          organizationId: context.actor.organization.id,
          simulationId: context.simulationId,
        },
      });

    expect(countAfterFirstActivation).toBe(1);
    expect(countAfterSecondActivation).toBe(1);
  });

  it('recalculates the simulation detail after activating an option', async () => {
    const context = await setupSimulation('options-detail-refresh');

    const detailBeforeActivation = await request(app.getHttpServer())
      .get(`/api/simulations/${context.simulationId}`)
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    expect(detailBeforeActivation.body.activeValues.activePurchasePrice).toBe(
      250000,
    );
    expect(
      detailBeforeActivation.body.activeValues.activePurchasePriceSource,
    ).toBe('INITIAL');
    expect(
      detailBeforeActivation.body.resultSummaryJson.metrics.totalProjectCost,
    ).toBeCloseTo(319441, 2);
    expect(
      detailBeforeActivation.body.resultSummaryJson.metrics.grossMargin,
    ).toBeCloseTo(40559, 2);

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const groupAfterActivation = await prisma.simulationOptionGroup.findUnique({
      where: { id: context.groupId },
      select: { activeOptionId: true },
    });
    const optionsAfterActivation = await prisma.simulationOption.findMany({
      where: {
        groupId: context.groupId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    expect(groupAfterActivation?.activeOptionId).toBe(context.optionAId);
    expect(optionsAfterActivation).toEqual([
      {
        id: context.optionAId,
        isActive: true,
      },
      {
        id: context.optionBId,
        isActive: false,
      },
    ]);

    const detailAfterActivation = await request(app.getHttpServer())
      .get(`/api/simulations/${context.simulationId}`)
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    expect(detailAfterActivation.body.activeValues.activePurchasePrice).toBe(
      240000,
    );
    expect(
      detailAfterActivation.body.activeValues.activePurchasePriceSource,
    ).toContain('Offre 240k');
    expect(
      detailAfterActivation.body.resultSummaryJson.metrics.totalProjectCost,
    ).toBeCloseTo(308719.25, 2);
    expect(
      detailAfterActivation.body.resultSummaryJson.metrics.grossMargin,
    ).toBeCloseTo(51280.75, 2);
  });

  it('returns a comparison consistent with the impact endpoint', async () => {
    const context = await setupSimulation('options-comparison');

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const impactResponse = await request(app.getHttpServer())
      .get(
        `/api/simulations/${context.simulationId}/options/${context.optionBId}/impact`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const comparisonResponse = await request(app.getHttpServer())
      .get(
        `/api/simulations/${context.simulationId}/options/groups/${context.groupId}/comparison`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    const optionBComparison = comparisonResponse.body.find(
      (entry: { optionId: string }) => entry.optionId === context.optionBId,
    );

    expect(optionBComparison).toBeDefined();
    expect(optionBComparison.metrics.totalProjectCost).toBeCloseTo(
      impactResponse.body.simulated.metrics.totalProjectCost,
      2,
    );
    expect(optionBComparison.deltaVsActive.totalProjectCost).toBeCloseTo(
      impactResponse.body.delta.totalProjectCost,
      2,
    );
    expect(optionBComparison.deltaVsActive.score).toBeCloseTo(
      impactResponse.body.delta.score,
      2,
    );
  });

  it('rejects history and comparison access from another organization', async () => {
    const context = await setupSimulation('options-multitenant');
    const outsider = await seedUser(prisma, {
      organizationName: 'Org Outsider',
      organizationSlug: 'org-outsider-options',
      email: 'outsider-options@example.com',
      password: 'password123',
    });
    const outsiderToken = await login(
      'outsider-options@example.com',
      'password123',
    );

    await request(app.getHttpServer())
      .patch(
        `/api/simulations/${context.simulationId}/options/${context.optionAId}/activate`,
      )
      .set('Authorization', `Bearer ${context.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(
        `/api/simulations/${context.simulationId}/options/activation-history`,
      )
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(
        `/api/simulations/${context.simulationId}/options/groups/${context.groupId}/comparison`,
      )
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    const outsiderLogs = await prisma.simulationOptionActivationLog.findMany({
      where: {
        organizationId: outsider.organization.id,
      },
    });

    expect(outsiderLogs).toEqual([]);
  });
});
