import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compareSync, hashSync } from 'bcryptjs';
import {
  AdminAuditAction,
  AdminRole,
  DocumentType,
  ExpenseCategory,
  InvitationOrganizationMode,
  LotStatus,
  LotType,
  MembershipRole,
  PaymentStatus,
  PrismaClient,
  ProjectStatus,
} from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { buildPersonalOrganizationSlug } from '../src/invitations/personal-organization';
import { MailService } from '../src/mail/mail.service';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanDatabase,
  cleanupUploads,
  prepareTestDatabase,
  seedProject,
  seedUser,
} from './e2e-helpers';

describe('API e2e', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let mailService: MailService;

  beforeAll(async () => {
    await prepareTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    mailService = app.get(MailService);
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

  function getTokenFromAcceptUrl(acceptUrl: string) {
    const parsedUrl = new URL(acceptUrl);
    const token = parsedUrl.searchParams.get('token');

    if (!token) {
      throw new Error('Invitation token missing from accept URL');
    }

    return token;
  }

  it('authenticates a seeded admin user', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Auth',
      organizationSlug: 'org-auth',
      email: 'auth@example.com',
      password: 'password123',
    });

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'auth@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.organization.slug).toBe('org-auth');
    expect(response.body.role).toBe('ADMIN');
  });

  it('creates an admin-driven invitation, logs it and keeps the password unset until activation', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Invite',
      organizationSlug: 'org-invite',
      email: 'admin-invite@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('admin-invite@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    const response = await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'invitee@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.MANAGER,
        reason: 'Ouverture du compte client',
      })
      .expect(201);

    expect(response.body.invitation.status).toBe('PENDING');
    expect(response.body.deliveryMode).toBe('console');

    const createdUser = await prisma.user.findUnique({
      where: { email: 'invitee@example.com' },
    });
    const createdInvitation = await prisma.userInvitation.findFirst({
      where: {
        userId: createdUser?.id,
        organizationId: actor.organization.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.USER_INVITED,
        targetUserId: createdUser?.id,
      },
    });

    expect(createdUser).toEqual(
      expect.objectContaining({
        email: 'invitee@example.com',
        passwordHash: null,
      }),
    );
    expect(createdInvitation).toBeTruthy();
    expect(createdInvitation?.tokenHash).toBeTruthy();
    expect(auditLog?.reason).toBe('Ouverture du compte client');
    expect(mailSpy).toHaveBeenCalledTimes(1);
    expect(mailSpy.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: 'invitee@example.com',
        organizationName: actor.organization.name,
        membershipRole: MembershipRole.MANAGER,
        requiresPasswordSetup: true,
      }),
    );
  });

  it('creates a personal invitation even when no organization exists yet', async () => {
    await prisma.user.create({
      data: {
        email: 'solo-admin@example.com',
        passwordHash: hashSync('password123', 10),
        firstName: 'Solo',
        lastName: 'Admin',
        adminRole: AdminRole.ADMIN,
      },
    });
    const token = await login('solo-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    const response = await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'solo-invitee@example.com',
        organizationMode: 'personal',
        membershipRole: MembershipRole.ADMIN,
        reason: 'Creation de l espace solo',
      })
      .expect(201);

    const invitedUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'solo-invitee@example.com' },
    });
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        userId: invitedUser.id,
        organizationMode: InvitationOrganizationMode.PERSONAL,
      },
      orderBy: { createdAt: 'desc' },
    });
    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.USER_INVITED,
        targetUserId: invitedUser.id,
      },
    });

    expect(response.body.invitation.organizationMode).toBe('personal');
    expect(response.body.invitation.organization.id).toBeNull();
    expect(response.body.invitation.organization.slug).toBe(
      buildPersonalOrganizationSlug(invitedUser.id),
    );
    expect(invitation?.organizationId).toBeNull();
    expect(auditLog?.reason).toBe('Creation de l espace solo');
    expect(mailSpy.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        to: 'solo-invitee@example.com',
        organizationName: expect.stringContaining('Espace personnel'),
        membershipRole: MembershipRole.ADMIN,
      }),
    );
  });

  it('refuses the invitation flow without the required admin permission', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Support',
      organizationSlug: 'org-support',
      email: 'support-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.SUPPORT_ADMIN,
    });
    const token = await login('support-admin@example.com', 'password123');

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'blocked@example.com',
        organizationMode: 'existing',
        organizationId: 'unknown-org',
        membershipRole: MembershipRole.READER,
        reason: 'Tentative sans permission',
      })
      .expect(403);
  });

  it('verifies a valid invitation token and exposes the target organization context', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Verify',
      organizationSlug: 'org-verify',
      email: 'verify-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('verify-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'verify-user@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.ACCOUNTANT,
        reason: 'Creation du compte invite',
      })
      .expect(201);

    const invitationToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );

    const verifyResponse = await request(app.getHttpServer())
      .get('/api/auth/invitations/verify')
      .query({ token: invitationToken })
      .expect(200);

    expect(verifyResponse.body).toEqual(
      expect.objectContaining({
        email: 'verify-user@example.com',
        membershipRole: MembershipRole.ACCOUNTANT,
        requiresPasswordSetup: true,
        organization: {
          id: actor.organization.id,
          name: actor.organization.name,
          slug: actor.organization.slug,
        },
      }),
    );
  });

  it('rejects an expired invitation token', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Expired',
      organizationSlug: 'org-expired',
      email: 'expired-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('expired-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'expired-user@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.READER,
        reason: 'Creation temporaire',
      })
      .expect(201);

    const invitationToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );
    await prisma.userInvitation.updateMany({
      where: {
        email: 'expired-user@example.com',
        organizationId: actor.organization.id,
      },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    await request(app.getHttpServer())
      .get('/api/auth/invitations/verify')
      .query({ token: invitationToken })
      .expect(410);
  });

  it('accepts an invitation, hashes the password and creates the organization membership', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Accept',
      organizationSlug: 'org-accept',
      email: 'accept-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('accept-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'accepted-user@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.ADMIN,
        reason: 'Activation du compte',
      })
      .expect(201);

    const invitationToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/auth/invitations/accept')
      .send({
        token: invitationToken,
        password: 'new-password123',
      })
      .expect(201);

    const invitedUser = await prisma.user.findUnique({
      where: { email: 'accepted-user@example.com' },
    });
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: actor.organization.id,
          userId: invitedUser!.id,
        },
      },
    });
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        userId: invitedUser!.id,
        organizationId: actor.organization.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(acceptResponse.body.organization.slug).toBe(actor.organization.slug);
    expect(invitedUser?.passwordHash).toBeTruthy();
    expect(compareSync('new-password123', invitedUser!.passwordHash!)).toBe(
      true,
    );
    expect(membership?.role).toBe(MembershipRole.ADMIN);
    expect(invitation?.acceptedAt).toBeTruthy();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'accepted-user@example.com',
        password: 'new-password123',
        organizationSlug: actor.organization.slug,
      })
      .expect(201);

    expect(loginResponse.body.organization.slug).toBe(actor.organization.slug);
  });

  it('accepts a personal invitation and creates a dedicated organization membership', async () => {
    await prisma.user.create({
      data: {
        email: 'personal-admin@example.com',
        passwordHash: hashSync('password123', 10),
        adminRole: AdminRole.ADMIN,
      },
    });
    const token = await login('personal-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'personal-user@example.com',
        organizationMode: 'personal',
        membershipRole: MembershipRole.MANAGER,
        reason: 'Creation du compte investisseur solo',
      })
      .expect(201);

    const invitationToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );

    const verifyResponse = await request(app.getHttpServer())
      .get('/api/auth/invitations/verify')
      .query({ token: invitationToken })
      .expect(200);

    expect(verifyResponse.body.organizationMode).toBe('personal');
    expect(verifyResponse.body.organization.id).toBeNull();

    const acceptResponse = await request(app.getHttpServer())
      .post('/api/auth/invitations/accept')
      .send({
        token: invitationToken,
        password: 'personal-password123',
      })
      .expect(201);

    const invitedUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'personal-user@example.com' },
    });
    const personalOrganization = await prisma.organization.findUniqueOrThrow({
      where: { slug: buildPersonalOrganizationSlug(invitedUser.id) },
    });
    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: personalOrganization.id,
          userId: invitedUser.id,
        },
      },
    });
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        userId: invitedUser.id,
        organizationMode: InvitationOrganizationMode.PERSONAL,
      },
      orderBy: { createdAt: 'desc' },
    });
    const auditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.USER_INVITED,
        targetUserId: invitedUser.id,
      },
    });

    expect(acceptResponse.body.organization.id).toBe(personalOrganization.id);
    expect(acceptResponse.body.organization.slug).toBe(
      personalOrganization.slug,
    );
    expect(membership?.role).toBe(MembershipRole.MANAGER);
    expect(invitation?.acceptedAt).toBeTruthy();
    expect(invitation?.organizationId).toBe(personalOrganization.id);
    expect(auditLog).toBeTruthy();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'personal-user@example.com',
        password: 'personal-password123',
      })
      .expect(201);

    expect(loginResponse.body.organization.slug).toBe(
      personalOrganization.slug,
    );
  });

  it('rejects a token that was already used', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Used',
      organizationSlug: 'org-used',
      email: 'used-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('used-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'used-user@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.READER,
        reason: 'Lien unique',
      })
      .expect(201);

    const invitationToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );

    await request(app.getHttpServer())
      .post('/api/auth/invitations/accept')
      .send({
        token: invitationToken,
        password: 'user-password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/invitations/accept')
      .send({
        token: invitationToken,
        password: 'user-password123',
      })
      .expect(410);
  });

  it('blocks an invitation when the email already has an active membership in the same organization', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Existing',
      organizationSlug: 'org-existing',
      email: 'existing-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    await prisma.user.create({
      data: {
        email: 'already-member@example.com',
        passwordHash: hashSync('member-password123', 10),
        firstName: 'Existing',
        lastName: 'Member',
      },
    });
    const existingUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'already-member@example.com' },
    });
    await prisma.membership.create({
      data: {
        organizationId: actor.organization.id,
        userId: existingUser.id,
        role: MembershipRole.MANAGER,
      },
    });
    const token = await login('existing-admin@example.com', 'password123');

    await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'already-member@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.READER,
        reason: 'Tentative doublon',
      })
      .expect(400);
  });

  it('resends an invitation, revokes the previous token and audits the action', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Resend',
      organizationSlug: 'org-resend',
      email: 'resend-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const token = await login('resend-admin@example.com', 'password123');
    const mailSpy = jest
      .spyOn(mailService, 'sendUserInvitation')
      .mockResolvedValue({ mode: 'console' });

    const inviteResponse = await request(app.getHttpServer())
      .post('/api/admin/users/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'resend-user@example.com',
        organizationMode: 'existing',
        organizationId: actor.organization.id,
        membershipRole: MembershipRole.MANAGER,
        reason: 'Invitation initiale',
      })
      .expect(201);

    const firstToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[0][0].acceptUrl,
    );

    await request(app.getHttpServer())
      .post(
        `/api/admin/users/invitations/${inviteResponse.body.invitation.id}/resend`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Rappel utilisateur',
      })
      .expect(201);

    const secondToken = getTokenFromAcceptUrl(
      mailSpy.mock.calls[1][0].acceptUrl,
    );

    expect(secondToken).not.toBe(firstToken);

    await request(app.getHttpServer())
      .get('/api/auth/invitations/verify')
      .query({ token: firstToken })
      .expect(410);

    await request(app.getHttpServer())
      .get('/api/auth/invitations/verify')
      .query({ token: secondToken })
      .expect(200);

    const invitedUser = await prisma.user.findUniqueOrThrow({
      where: { email: 'resend-user@example.com' },
    });
    const resendAudit = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.USER_INVITE_RESENT,
        targetUserId: invitedUser.id,
      },
    });

    expect(resendAudit?.reason).toBe('Rappel utilisateur');
  });

  it('creates, updates and archives a project while enforcing tenant isolation', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org A',
      organizationSlug: 'org-a',
      email: 'orga@example.com',
      password: 'password123',
    });
    const outsider = await seedUser(prisma, {
      organizationName: 'Org B',
      organizationSlug: 'org-b',
      email: 'orgb@example.com',
      password: 'password123',
    });

    const token = await login('orga@example.com', 'password123');
    const outsiderToken = await login('orgb@example.com', 'password123');

    const createResponse = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Projet Marchand',
        type: 'APARTMENT_BUILDING',
        status: 'ACQUISITION',
        city: 'Lille',
        postalCode: '59000',
        purchasePrice: 150000,
        worksBudget: 35000,
      })
      .expect(201);

    const projectId = createResponse.body.id as string;

    await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'WORKS',
        notes: 'Travaux lances',
      })
      .expect(200);

    const archivedResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'ARCHIVED',
      })
      .expect(200);

    expect(archivedResponse.body.status).toBe('ARCHIVED');

    await request(app.getHttpServer())
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);

    const projects = await prisma.project.findMany({
      where: { organizationId: actor.organization.id },
    });
    const outsiderProjects = await prisma.project.findMany({
      where: { organizationId: outsider.organization.id },
    });

    expect(projects).toHaveLength(1);
    expect(outsiderProjects).toHaveLength(0);
  });

  it('creates, updates and archives a lot inside a project', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Lots',
      organizationSlug: 'org-lots',
      email: 'lots@example.com',
      password: 'password123',
    });
    const project = await seedProject(prisma, actor.organization.id);
    const token = await login('lots@example.com', 'password123');

    const createResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Lot A',
        reference: 'A1',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        surface: 42,
        estimatedRent: 780,
      })
      .expect(201);

    const lotId = createResponse.body.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/lots/${lotId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RENTED',
        estimatedRent: 810,
      })
      .expect(200);

    expect(updateResponse.body.status).toBe('RENTED');
    expect(updateResponse.body.estimatedRent).toBe(810);

    const archiveResponse = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/lots/${lotId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'ARCHIVED',
      })
      .expect(200);

    expect(archiveResponse.body.status).toBe('ARCHIVED');

    const lots = await prisma.lot.findMany({
      where: { projectId: project.id },
    });

    expect(lots).toHaveLength(1);
    expect(lots[0].type).toBe(LotType.APARTMENT);
    expect(lots[0].status).toBe(LotStatus.ARCHIVED);
  });

  it('creates, updates and exports an expense, then attaches and filters a document', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Expenses',
      organizationSlug: 'org-expenses',
      email: 'expenses@example.com',
      password: 'password123',
    });
    const project = await seedProject(prisma, actor.organization.id);
    const token = await login('expenses@example.com', 'password123');

    const expenseResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/expenses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceNumber: 'FAC-001',
        issueDate: '2026-03-31',
        amountHt: 1000,
        vatAmount: 200,
        amountTtc: 1200,
        category: 'WORKS',
        paymentStatus: 'PENDING',
        vendorName: 'Artisan Test',
      })
      .expect(201);

    const expenseId = expenseResponse.body.id as string;

    const updatedExpense = await request(app.getHttpServer())
      .patch(`/api/projects/${project.id}/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentStatus: 'PAID',
        comment: 'Reglee',
      })
      .expect(200);

    expect(updatedExpense.body.paymentStatus).toBe(PaymentStatus.PAID);

    const documentResponse = await request(app.getHttpServer())
      .post(`/api/projects/${project.id}/documents/upload`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Facture Artisan')
      .field('type', 'INVOICE')
      .field('expenseId', expenseId)
      .attach('file', Buffer.from('invoice-content'), 'facture.txt')
      .expect(201);

    expect(documentResponse.body.expenseId).toBe(expenseId);

    const filteredDocuments = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/documents`)
      .query({
        type: 'INVOICE',
        expenseId,
        search: 'Artisan',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(filteredDocuments.body).toHaveLength(1);
    expect(filteredDocuments.body[0].expense.id).toBe(expenseId);

    const exportResponse = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/exports/expenses.csv`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(exportResponse.text).toContain('FAC-001');
    expect(exportResponse.text).toContain('Artisan Test');
  });

  it('returns project overview with completeness, missing items and prioritized alerts', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Overview',
      organizationSlug: 'org-overview',
      email: 'overview@example.com',
      password: 'password123',
    });
    const project = await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet Overview',
        city: 'Bordeaux',
        postalCode: '33000',
        status: ProjectStatus.WORKS,
        purchasePrice: 220000,
        worksBudget: 20000,
      },
    });

    await prisma.lot.create({
      data: {
        organizationId: actor.organization.id,
        projectId: project.id,
        name: 'Lot Test',
        status: 'AVAILABLE',
        surface: 40,
      },
    });

    await prisma.expense.create({
      data: {
        organizationId: actor.organization.id,
        projectId: project.id,
        issueDate: new Date('2026-03-31'),
        amountHt: 800,
        vatAmount: 160,
        amountTtc: 960,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Entreprise Overview',
      },
    });

    const token = await login('overview@example.com', 'password123');
    const response = await request(app.getHttpServer())
      .get(`/api/projects/${project.id}/overview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.completeness).toEqual(
      expect.objectContaining({
        score: 63,
        level: 'warning',
        label: 'Projet partiellement renseigne',
        missingItems: expect.arrayContaining([
          '1 lot(s) sans loyer estime',
          'Aucun document enregistre',
          'Frais de notaire / acquisition non renseignes',
        ]),
      }),
    );

    expect(response.body.decisionStatus).toEqual({
      level: 'warning',
      label: 'A surveiller',
    });
    expect(response.body.alerts).toEqual([
      expect.objectContaining({
        type: 'PROJECT_COMPLETENESS_MEDIUM',
        severity: 'warning',
      }),
      expect.objectContaining({
        type: 'LOT_MISSING_ESTIMATED_RENT',
        severity: 'warning',
      }),
    ]);
    expect(response.body.suggestions).toEqual([
      expect.objectContaining({
        code: 'COMPLETE_KEY_DATA',
        severity: 'warning',
      }),
      expect.objectContaining({
        code: 'COMPLETE_ESTIMATED_RENTS',
        severity: 'warning',
      }),
    ]);
    expect(response.body.kpis.grossYieldEstimated).toBeNull();
  });

  it('returns an empty dashboard for a fresh organization', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Dashboard Empty',
      organizationSlug: 'org-dashboard-empty',
      email: 'dashboard-empty@example.com',
      password: 'password123',
    });

    const token = await login('dashboard-empty@example.com', 'password123');
    const response = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.summary).toEqual({
      activeProjectsCount: 0,
      archivedProjectsCount: 0,
      nonArchivedLotsCount: 0,
      totalExpensesAmount: 0,
      estimatedMonthlyRentTotal: 0,
    });
    expect(response.body.alerts).toEqual([]);
    expect(response.body.watchlist).toEqual([]);
    expect(response.body.comparison).toEqual([]);
    expect(response.body.recentActivity).toEqual([]);
  });

  it('aggregates dashboard data, recent activity and tenant isolation', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Dashboard',
      organizationSlug: 'org-dashboard',
      email: 'dashboard@example.com',
      password: 'password123',
    });
    const outsider = await seedUser(prisma, {
      organizationName: 'Org Dashboard Outside',
      organizationSlug: 'org-dashboard-outside',
      email: 'dashboard-outside@example.com',
      password: 'password123',
    });

    const attentionProject = await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet Travaux Sous Tension',
        city: 'Lyon',
        postalCode: '69003',
        status: ProjectStatus.WORKS,
        worksBudget: 1000,
      },
    });
    await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet a completer',
        city: 'Paris',
        postalCode: '75010',
        status: ProjectStatus.ACQUISITION,
      },
    });
    const archivedProject = await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet Archive',
        city: 'Roubaix',
        postalCode: '59100',
        status: ProjectStatus.ARCHIVED,
      },
    });
    const outsiderProject = await prisma.project.create({
      data: {
        organizationId: outsider.organization.id,
        name: 'Projet Externe',
        city: 'Nantes',
        postalCode: '44000',
        status: ProjectStatus.ACTIVE,
      },
    });

    await prisma.lot.createMany({
      data: [
        {
          organizationId: actor.organization.id,
          projectId: attentionProject.id,
          name: 'Lot A',
          status: 'AVAILABLE',
          estimatedRent: 950,
        },
        {
          organizationId: actor.organization.id,
          projectId: attentionProject.id,
          name: 'Lot B',
          status: 'AVAILABLE',
        },
        {
          organizationId: actor.organization.id,
          projectId: archivedProject.id,
          name: 'Lot Archive',
          status: 'AVAILABLE',
          estimatedRent: 500,
        },
        {
          organizationId: outsider.organization.id,
          projectId: outsiderProject.id,
          name: 'Lot Exterieur',
          status: 'AVAILABLE',
          estimatedRent: 700,
        },
      ],
    });

    const actorExpense = await prisma.expense.create({
      data: {
        organizationId: actor.organization.id,
        projectId: attentionProject.id,
        issueDate: new Date('2026-03-31'),
        amountHt: 1250,
        vatAmount: 250,
        amountTtc: 1500,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Artisan Dashboard',
      },
    });

    await prisma.expense.create({
      data: {
        organizationId: actor.organization.id,
        projectId: archivedProject.id,
        issueDate: new Date('2026-03-31'),
        amountHt: 500,
        vatAmount: 100,
        amountTtc: 600,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Archive SAS',
      },
    });

    await prisma.expense.create({
      data: {
        organizationId: outsider.organization.id,
        projectId: outsiderProject.id,
        issueDate: new Date('2026-03-31'),
        amountHt: 300,
        vatAmount: 60,
        amountTtc: 360,
        category: ExpenseCategory.MAINTENANCE,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Exterieur SARL',
      },
    });

    await prisma.document.create({
      data: {
        organizationId: actor.organization.id,
        projectId: attentionProject.id,
        expenseId: actorExpense.id,
        type: DocumentType.INVOICE,
        title: 'Facture Dashboard',
        originalFileName: 'facture-dashboard.pdf',
        storageKey: `${actor.organization.id}/facture-dashboard.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 1024,
      },
    });

    await prisma.document.create({
      data: {
        organizationId: outsider.organization.id,
        projectId: outsiderProject.id,
        type: DocumentType.CONTRACT,
        title: 'Contrat Externe',
        originalFileName: 'contrat-externe.pdf',
        storageKey: `${outsider.organization.id}/contrat-externe.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      },
    });

    const actorToken = await login('dashboard@example.com', 'password123');
    const outsiderToken = await login(
      'dashboard-outside@example.com',
      'password123',
    );

    const actorResponse = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${actorToken}`)
      .expect(200);

    expect(actorResponse.body.summary).toEqual({
      activeProjectsCount: 2,
      archivedProjectsCount: 1,
      nonArchivedLotsCount: 2,
      totalExpensesAmount: 1500,
      estimatedMonthlyRentTotal: 950,
    });

    expect(actorResponse.body.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'PROJECT_WITHOUT_LOTS',
          severity: 'critical',
          project: expect.objectContaining({ name: 'Projet a completer' }),
        }),
        expect.objectContaining({
          type: 'PROJECT_WITHOUT_EXPENSES',
          severity: 'warning',
          project: expect.objectContaining({ name: 'Projet a completer' }),
        }),
        expect.objectContaining({
          type: 'PROJECT_COMPLETENESS_LOW',
          severity: 'critical',
          project: expect.objectContaining({ name: 'Projet a completer' }),
        }),
        expect.objectContaining({
          type: 'LOT_MISSING_ESTIMATED_RENT',
          severity: 'warning',
          project: expect.objectContaining({
            name: 'Projet Travaux Sous Tension',
          }),
        }),
        expect.objectContaining({
          type: 'WORKS_BUDGET_EXCEEDED',
          severity: 'critical',
          project: expect.objectContaining({
            name: 'Projet Travaux Sous Tension',
          }),
        }),
      ]),
    );

    expect(actorResponse.body.watchlist[0]).toEqual(
      expect.objectContaining({
        name: 'Projet a completer',
        decisionStatus: {
          level: 'critical',
          label: 'Problematique',
        },
        alertCount: 3,
        highestAlertSeverity: 'critical',
        completeness: expect.objectContaining({
          score: 0,
          label: 'Projet incomplet',
        }),
        suggestions: [
          expect.objectContaining({
            code: 'ADD_FIRST_LOTS',
            severity: 'critical',
          }),
          expect.objectContaining({
            code: 'COMPLETE_KEY_DATA',
            severity: 'critical',
          }),
          expect.objectContaining({
            code: 'ADD_FIRST_EXPENSES',
            severity: 'warning',
          }),
        ],
      }),
    );
    expect(actorResponse.body.watchlist[1]).toEqual(
      expect.objectContaining({
        name: 'Projet Travaux Sous Tension',
        decisionStatus: {
          level: 'critical',
          label: 'Problematique',
        },
        highestAlertSeverity: 'critical',
        completeness: expect.objectContaining({
          score: 50,
          label: 'Projet partiellement renseigne',
        }),
        suggestions: [
          expect.objectContaining({
            code: 'REVIEW_WORKS_BUDGET',
            severity: 'critical',
          }),
          expect.objectContaining({
            code: 'COMPLETE_KEY_DATA',
            severity: 'warning',
          }),
          expect.objectContaining({
            code: 'COMPLETE_ESTIMATED_RENTS',
            severity: 'warning',
          }),
        ],
      }),
    );
    expect(actorResponse.body.comparison).toEqual([
      expect.objectContaining({
        name: 'Projet a completer',
        decisionStatus: {
          level: 'critical',
          label: 'Problematique',
        },
        completeness: expect.objectContaining({
          score: 0,
        }),
      }),
      expect.objectContaining({
        name: 'Projet Travaux Sous Tension',
        decisionStatus: {
          level: 'critical',
          label: 'Problematique',
        },
        completeness: expect.objectContaining({
          score: 50,
        }),
      }),
    ]);
    expect(actorResponse.body.alerts[0]).toEqual(
      expect.objectContaining({
        project: expect.objectContaining({ name: 'Projet a completer' }),
      }),
    );
    expect(actorResponse.body.recentActivity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'project',
          project: expect.objectContaining({ name: 'Projet a completer' }),
        }),
        expect.objectContaining({
          type: 'expense',
          project: expect.objectContaining({
            name: 'Projet Travaux Sous Tension',
          }),
        }),
        expect.objectContaining({
          type: 'document',
          project: expect.objectContaining({
            name: 'Projet Travaux Sous Tension',
          }),
        }),
      ]),
    );

    const actorPayload = JSON.stringify(actorResponse.body);
    expect(actorPayload).not.toContain('Projet Archive');
    expect(actorPayload).not.toContain('Projet Externe');

    const outsiderResponse = await request(app.getHttpServer())
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(200);

    expect(outsiderResponse.body.summary).toEqual({
      activeProjectsCount: 1,
      archivedProjectsCount: 0,
      nonArchivedLotsCount: 1,
      totalExpensesAmount: 360,
      estimatedMonthlyRentTotal: 700,
    });
    expect(JSON.stringify(outsiderResponse.body)).toContain('Projet Externe');
    expect(JSON.stringify(outsiderResponse.body)).not.toContain(
      'Projet Travaux Sous Tension',
    );
  });
});
