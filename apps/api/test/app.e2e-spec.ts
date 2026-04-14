import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compareSync, hashSync } from 'bcryptjs';
import {
  AdminAuditAction,
  AdminRole,
  DocumentType,
  ExpenseCategory,
  FeatureRequestStatus,
  InvitationOrganizationMode,
  LotStatus,
  LotType,
  MembershipRole,
  OpportunityEventType,
  PaymentStatus,
  PrismaClient,
  ProjectStatus,
  SimulationLotType,
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
  seedFeatureRequest,
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

  it('creates and lists ideas per organization, then supports vote and unvote', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Ideas',
      organizationSlug: 'org-ideas',
      email: 'ideas-user@example.com',
      password: 'password123',
      role: MembershipRole.MANAGER,
    });
    const outsider = await seedUser(prisma, {
      organizationName: 'Org Ideas 2',
      organizationSlug: 'org-ideas-2',
      email: 'ideas-outsider@example.com',
      password: 'password123',
      role: MembershipRole.MANAGER,
    });

    await seedFeatureRequest(prisma, {
      organizationId: outsider.organization.id,
      authorId: outsider.user.id,
      title: 'Idee externe',
      description: "Cette idee ne doit pas fuiter dans l'autre organisation.",
    });

    const token = await login('ideas-user@example.com', 'password123');

    const createResponse = await request(app.getHttpServer())
      .post('/api/ideas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Ajouter un tri sur les idees',
        description:
          'Pouvoir distinguer rapidement les idees recentes des idees les plus soutenues.',
      })
      .expect(201);

    const featureRequestId = createResponse.body.id as string;

    const listResponse = await request(app.getHttpServer())
      .get('/api/ideas')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body).toEqual([
      expect.objectContaining({
        id: featureRequestId,
        title: 'Ajouter un tri sur les idees',
        votesCount: 0,
        hasVoted: false,
        author: expect.objectContaining({
          email: 'ideas-user@example.com',
        }),
      }),
    ]);
    expect(JSON.stringify(listResponse.body)).not.toContain('Idee externe');

    const voteResponse = await request(app.getHttpServer())
      .post(`/api/ideas/${featureRequestId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(voteResponse.body).toEqual({
      id: featureRequestId,
      votesCount: 1,
      hasVoted: true,
    });

    await request(app.getHttpServer())
      .post(`/api/ideas/${featureRequestId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);

    const unvoteResponse = await request(app.getHttpServer())
      .delete(`/api/ideas/${featureRequestId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(unvoteResponse.body).toEqual({
      id: featureRequestId,
      votesCount: 0,
      hasVoted: false,
    });

    const persistedIdea = await prisma.featureRequest.findUniqueOrThrow({
      where: { id: featureRequestId },
    });

    expect(persistedIdea.organizationId).toBe(actor.organization.id);
    expect(persistedIdea.votesCount).toBe(0);
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

  it('aggregates portfolio drifts from forecast comparisons and keeps tenant isolation', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Dashboard Drifts',
      organizationSlug: 'org-dashboard-drifts',
      email: 'dashboard-drifts@example.com',
      password: 'password123',
    });
    const outsider = await seedUser(prisma, {
      organizationName: 'Org Dashboard Drifts Outside',
      organizationSlug: 'org-dashboard-drifts-outside',
      email: 'dashboard-drifts-outside@example.com',
      password: 'password123',
    });

    const actorFolder = await prisma.simulationFolder.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Dossier derives',
      },
    });
    const outsiderFolder = await prisma.simulationFolder.create({
      data: {
        organizationId: outsider.organization.id,
        name: 'Dossier derives externe',
      },
    });

    const driftProject = await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet Budget en derive',
        status: ProjectStatus.WORKS,
        purchasePrice: 180000,
        notaryFees: 10000,
        worksBudget: 10000,
      },
    });
    const watchProject = await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet Loyer a surveiller',
        status: ProjectStatus.ACTIVE,
        purchasePrice: 180000,
        notaryFees: 10000,
        worksBudget: 10000,
      },
    });
    await prisma.project.create({
      data: {
        organizationId: actor.organization.id,
        name: 'Projet sans snapshot',
        status: ProjectStatus.ACQUISITION,
      },
    });
    const outsiderProject = await prisma.project.create({
      data: {
        organizationId: outsider.organization.id,
        name: 'Projet Externe en derive',
        status: ProjectStatus.WORKS,
        purchasePrice: 180000,
        notaryFees: 10000,
        worksBudget: 10000,
      },
    });

    await prisma.lot.createMany({
      data: [
        {
          organizationId: actor.organization.id,
          projectId: driftProject.id,
          name: 'Lot derive',
          status: LotStatus.AVAILABLE,
          estimatedRent: 830,
        },
        {
          organizationId: actor.organization.id,
          projectId: watchProject.id,
          name: 'Lot watch',
          status: LotStatus.AVAILABLE,
          estimatedRent: 890,
        },
        {
          organizationId: outsider.organization.id,
          projectId: outsiderProject.id,
          name: 'Lot externe',
          status: LotStatus.AVAILABLE,
          estimatedRent: 780,
        },
      ],
    });

    await prisma.expense.create({
      data: {
        organizationId: actor.organization.id,
        projectId: driftProject.id,
        issueDate: new Date('2026-04-01'),
        amountHt: 25000,
        vatAmount: 5000,
        amountTtc: 30000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Entreprise derive',
      },
    });
    await prisma.expense.create({
      data: {
        organizationId: outsider.organization.id,
        projectId: outsiderProject.id,
        issueDate: new Date('2026-04-01'),
        amountHt: 25000,
        vatAmount: 5000,
        amountTtc: 30000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Entreprise externe',
      },
    });

    const actorDriftSimulation = await prisma.simulation.create({
      data: {
        organizationId: actor.organization.id,
        folderId: actorFolder.id,
        name: 'Simulation derive',
        strategy: 'RENTAL',
        purchasePrice: 180000,
        acquisitionFees: 10000,
        worksBudget: 10000,
        financingMode: 'LOAN',
      },
    });
    const actorWatchSimulation = await prisma.simulation.create({
      data: {
        organizationId: actor.organization.id,
        folderId: actorFolder.id,
        name: 'Simulation watch',
        strategy: 'RENTAL',
        purchasePrice: 180000,
        acquisitionFees: 10000,
        worksBudget: 10000,
        financingMode: 'LOAN',
      },
    });
    const outsiderSimulation = await prisma.simulation.create({
      data: {
        organizationId: outsider.organization.id,
        folderId: outsiderFolder.id,
        name: 'Simulation externe',
        strategy: 'RENTAL',
        purchasePrice: 180000,
        acquisitionFees: 10000,
        worksBudget: 10000,
        financingMode: 'LOAN',
      },
    });

    await prisma.simulation.update({
      where: { id: actorDriftSimulation.id },
      data: { convertedProjectId: driftProject.id },
    });
    await prisma.simulation.update({
      where: { id: actorWatchSimulation.id },
      data: { convertedProjectId: watchProject.id },
    });
    await prisma.simulation.update({
      where: { id: outsiderSimulation.id },
      data: { convertedProjectId: outsiderProject.id },
    });

    const actorDriftConversion = await prisma.simulationConversion.create({
      data: {
        organizationId: actor.organization.id,
        simulationId: actorDriftSimulation.id,
        projectId: driftProject.id,
        createdByUserId: actor.user.id,
      },
    });
    const actorWatchConversion = await prisma.simulationConversion.create({
      data: {
        organizationId: actor.organization.id,
        simulationId: actorWatchSimulation.id,
        projectId: watchProject.id,
        createdByUserId: actor.user.id,
      },
    });
    const outsiderConversion = await prisma.simulationConversion.create({
      data: {
        organizationId: outsider.organization.id,
        simulationId: outsiderSimulation.id,
        projectId: outsiderProject.id,
        createdByUserId: outsider.user.id,
      },
    });

    await prisma.projectForecastSnapshot.create({
      data: {
        organizationId: actor.organization.id,
        projectId: driftProject.id,
        simulationId: actorDriftSimulation.id,
        conversionId: actorDriftConversion.id,
        referenceDate: new Date('2026-04-02T10:00:00.000Z'),
        strategy: 'RENTAL',
        acquisitionCost: 190000,
        worksBudget: 10000,
        totalProjectCost: 200000,
        targetMonthlyRent: 1000,
        grossYield: 6,
        equityRequired: 59000,
        lotsCount: 1,
      },
    });
    await prisma.projectForecastSnapshot.create({
      data: {
        organizationId: actor.organization.id,
        projectId: watchProject.id,
        simulationId: actorWatchSimulation.id,
        conversionId: actorWatchConversion.id,
        referenceDate: new Date('2026-04-02T10:00:00.000Z'),
        strategy: 'RENTAL',
        acquisitionCost: 190000,
        worksBudget: 10000,
        totalProjectCost: 200000,
        targetMonthlyRent: 1000,
        grossYield: 6,
        equityRequired: 59000,
        lotsCount: 1,
      },
    });
    await prisma.projectForecastSnapshot.create({
      data: {
        organizationId: outsider.organization.id,
        projectId: outsiderProject.id,
        simulationId: outsiderSimulation.id,
        conversionId: outsiderConversion.id,
        referenceDate: new Date('2026-04-02T10:00:00.000Z'),
        strategy: 'RENTAL',
        acquisitionCost: 190000,
        worksBudget: 10000,
        totalProjectCost: 200000,
        targetMonthlyRent: 1000,
        grossYield: 6,
        equityRequired: 59000,
        lotsCount: 1,
      },
    });

    const token = await login('dashboard-drifts@example.com', 'password123');

    const response = await request(app.getHttpServer())
      .get('/api/dashboard/drifts')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.totalProjects).toBe(3);
    expect(response.body.projectsWithDrift).toBe(1);
    expect(response.body.projectsWithWatch).toBe(1);
    expect(response.body.projectsWithoutForecastReference).toBe(1);
    expect(response.body.criticalProjects).toEqual([
      expect.objectContaining({
        projectId: driftProject.id,
        name: 'Projet Budget en derive',
        status: 'drift',
        mainIssues: expect.arrayContaining([
          expect.objectContaining({
            metricKey: 'worksBudget',
            status: 'drift',
          }),
          expect.objectContaining({
            metricKey: 'grossYield',
            status: 'drift',
          }),
        ]),
      }),
      expect.objectContaining({
        projectId: watchProject.id,
        name: 'Projet Loyer a surveiller',
        status: 'watch',
        mainIssues: expect.arrayContaining([
          expect.objectContaining({
            metricKey: 'monthlyRent',
            status: 'watch',
          }),
          expect.objectContaining({
            metricKey: 'grossYield',
            status: 'watch',
          }),
        ]),
      }),
    ]);

    const payload = JSON.stringify(response.body);
    expect(payload).not.toContain('Projet Externe en derive');
  });

  it('updates pilot access and unlocks beta ideas only for activated pilot users', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Pilot',
      organizationSlug: 'org-pilot',
      email: 'pilot-admin@example.com',
      password: 'password123',
      adminRole: AdminRole.ADMIN,
    });
    const target = await prisma.user.create({
      data: {
        email: 'pilot-target@example.com',
        firstName: 'Pilot',
        lastName: 'Target',
        passwordHash: hashSync('password123', 10),
      },
    });

    await prisma.membership.create({
      data: {
        organizationId: actor.organization.id,
        userId: target.id,
        role: MembershipRole.MANAGER,
      },
    });

    const idea = await seedFeatureRequest(prisma, {
      organizationId: actor.organization.id,
      authorId: target.id,
      title: 'Tester une vue beta reservee',
      description:
        "Cette idee servira a verifier que l'acces beta reste reserve aux clients pilotes.",
    });

    const adminToken = await login('pilot-admin@example.com', 'password123');
    const targetToken = await login('pilot-target@example.com', 'password123');

    await request(app.getHttpServer())
      .get('/api/ideas/beta')
      .set('Authorization', `Bearer ${targetToken}`)
      .expect(403);

    const pilotAccessResponse = await request(app.getHttpServer())
      .patch(`/api/admin/users/${target.id}/pilot-access`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isPilotUser: true,
        betaAccessEnabled: true,
        reason: 'Activation du programme pilote',
      })
      .expect(200);

    expect(pilotAccessResponse.body).toEqual(
      expect.objectContaining({
        id: target.id,
        isPilotUser: true,
        betaAccessEnabled: true,
      }),
    );

    await request(app.getHttpServer())
      .patch(`/api/admin/ideas/${idea.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: FeatureRequestStatus.IN_PROGRESS,
        reason: 'Passage en validation beta',
      })
      .expect(200);

    const refreshedTargetToken = await login(
      'pilot-target@example.com',
      'password123',
    );
    const betaIdeasResponse = await request(app.getHttpServer())
      .get('/api/ideas/beta')
      .set('Authorization', `Bearer ${refreshedTargetToken}`)
      .expect(200);

    expect(betaIdeasResponse.body).toEqual([
      expect.objectContaining({
        id: idea.id,
        title: 'Tester une vue beta reservee',
        status: FeatureRequestStatus.IN_PROGRESS,
        isBeta: true,
      }),
    ]);

    const updatedTarget = await prisma.user.findUniqueOrThrow({
      where: { id: target.id },
    });
    const pilotAuditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.USER_PILOT_ACCESS_UPDATED,
        targetUserId: target.id,
      },
    });
    const ideaAuditLog = await prisma.adminAuditLog.findFirst({
      where: {
        action: AdminAuditAction.FEATURE_REQUEST_STATUS_UPDATED,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(updatedTarget).toEqual(
      expect.objectContaining({
        isPilotUser: true,
        betaAccessEnabled: true,
      }),
    );
    expect(pilotAuditLog?.reason).toBe('Activation du programme pilote');
    expect(ideaAuditLog?.reason).toBe('Passage en validation beta');
    expect(ideaAuditLog?.targetUserId).toBeNull();
  });

  it('creates a simulation folder, simulation, edits it and converts to project', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Simulations',
      organizationSlug: 'org-simulations',
      email: 'simulations@example.com',
      password: 'password123',
    });

    const token = await login('simulations@example.com', 'password123');

    // Create simulation folder
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Colmar',
        description: 'Opportunites sur Colmar',
      })
      .expect(201);

    const folderId = folderResponse.body.id as string;

    // Create simulation
    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId,
        name: 'Appartement Centre Ville',
        address: '12 rue Test',
        strategy: 'RENTAL',
        propertyType: 'ANCIEN',
        departmentCode: '68',
        purchasePrice: 180000,
        worksBudget: 25000,
        financingMode: 'LOAN',
        downPayment: 40000,
        loanAmount: 179400,
        interestRate: 3.5,
        loanDurationMonths: 240,
        targetMonthlyRent: 1200,
        bufferAmount: 5000,
      })
      .expect(201);

    const simulationId = simulationResponse.body.id as string;

    expect(simulationResponse.body).toEqual(
      expect.objectContaining({
        name: 'Appartement Centre Ville',
        strategy: 'RENTAL',
        decisionScore: expect.any(Number),
        decisionStatus: expect.stringMatching(/^(GOOD|REVIEW|RISKY)$/),
      }),
    );

    // Edit simulation
    const editResponse = await request(app.getHttpServer())
      .patch(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement Centre Ville Renove',
        worksBudget: 28000,
      })
      .expect(200);

    expect(editResponse.body.name).toBe('Appartement Centre Ville Renove');
    expect(editResponse.body.worksBudget).toBe(28000);

    // Add lot to simulation
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement principal',
        type: SimulationLotType.APARTMENT,
        surface: 65,
        estimatedRent: 950,
      })
      .expect(201);

    const previewResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}/conversion-preview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(previewResponse.body).toEqual(
      expect.objectContaining({
        canConvert: true,
        blockingIssues: [],
        project: expect.objectContaining({
          name: 'Appartement Centre Ville Renove',
          status: 'ACQUISITION',
          strategy: 'RENTAL',
          purchasePrice: 180000,
          worksBudget: 28000,
        }),
        lots: [
          expect.objectContaining({
            name: 'Appartement principal',
            type: LotType.APARTMENT,
          }),
        ],
      }),
    );

    // Convert to project
    const convertResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/convert-to-project`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const projectId = convertResponse.body.projectId as string;

    // Verify project was created
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { lots: true },
    });

    expect(project).toMatchObject({
      organizationId: actor.organization.id,
      name: 'Appartement Centre Ville Renove',
      status: ProjectStatus.ACQUISITION,
      strategy: 'RENTAL',
    });
    expect(project?.purchasePrice?.toString()).toBe('180000');
    expect(project?.worksBudget?.toString()).toBe('28000');
    expect(project?.lots).toHaveLength(1);
    expect(project?.lots[0]).toMatchObject({
      name: 'Appartement principal',
      type: LotType.APARTMENT,
    });
    expect(project?.lots[0].surface?.toString()).toBe('65');
    expect(project?.lots[0].estimatedRent?.toString()).toBe('950');

    // Verify simulation is marked as converted
    const updatedSimulation = await prisma.simulation.findUnique({
      where: { id: simulationId },
    });
    const conversion = await prisma.simulationConversion.findUnique({
      where: { simulationId },
    });
    const snapshot = await prisma.projectForecastSnapshot.findUnique({
      where: { simulationId },
    });

    expect(updatedSimulation?.convertedProjectId).toBe(projectId);
    expect(conversion).toEqual(
      expect.objectContaining({
        simulationId,
        projectId,
        organizationId: actor.organization.id,
        createdByUserId: actor.user.id,
        status: 'COMPLETED',
      }),
    );
    expect(snapshot).toEqual(
      expect.objectContaining({
        simulationId,
        projectId,
        organizationId: actor.organization.id,
        strategy: 'RENTAL',
        recommendation: expect.any(String),
        decisionScore: expect.any(Number),
        lotsCount: 1,
      }),
    );

    const initialOverviewResponse = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}/overview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const initialForecastMetrics = initialOverviewResponse.body
      .forecastComparison.metrics as Array<{
      key: string;
      forecastValue: number | null;
      actualValue: number | null;
      status: string;
      actualLabel?: string;
    }>;
    const initialAcquisitionMetric = initialForecastMetrics.find(
      (metric) => metric.key === 'acquisitionCost',
    );
    const initialTotalCostMetric = initialForecastMetrics.find(
      (metric) => metric.key === 'totalProjectCost',
    );
    const initialGrossYieldMetric = initialForecastMetrics.find(
      (metric) => metric.key === 'grossYield',
    );
    const initialLotsCountMetric = initialForecastMetrics.find(
      (metric) => metric.key === 'lotsCount',
    );

    expect(initialAcquisitionMetric).toEqual(
      expect.objectContaining({
        forecastValue: parseFloat(String(snapshot?.acquisitionCost)),
        actualValue: parseFloat(String(snapshot?.acquisitionCost)),
        status: 'neutral',
      }),
    );
    expect(initialTotalCostMetric).toEqual(
      expect.objectContaining({
        forecastValue: parseFloat(String(snapshot?.totalProjectCost)),
        actualValue: parseFloat(String(snapshot?.totalProjectCost)),
        status: 'neutral',
      }),
    );
    expect(initialGrossYieldMetric).toEqual(
      expect.objectContaining({
        status: 'neutral',
      }),
    );
    expect(initialGrossYieldMetric?.actualValue).toBeCloseTo(
      parseFloat(String(snapshot?.grossYield)),
      2,
    );
    expect(initialLotsCountMetric).toEqual(
      expect.objectContaining({
        forecastValue: 1,
        actualValue: 1,
        status: 'neutral',
        actualLabel: 'Lots non archives du projet',
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/expenses`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        issueDate: '2026-04-01',
        amountHt: 54166.67,
        vatAmount: 10833.33,
        amountTtc: 65000,
        category: ExpenseCategory.WORKS,
        paymentStatus: PaymentStatus.PAID,
        vendorName: 'Entreprise derive',
      })
      .expect(201);

    const overviewResponse = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}/overview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(overviewResponse.body.forecastComparison).toEqual(
      expect.objectContaining({
        available: true,
        reference: expect.objectContaining({
          simulationId,
          simulationName: 'Appartement Centre Ville Renove',
          strategy: 'RENTAL',
        }),
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: 'FORECAST_WORKS_BUDGET_DRIFT',
          }),
        ]),
      }),
    );
    expect(overviewResponse.body.forecastComparison.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'worksBudget',
          forecastValue: 28000,
          actualValue: 65000,
          status: 'drift',
        }),
        expect.objectContaining({
          key: 'totalProjectCost',
          status: 'drift',
        }),
      ]),
    );

    const reconversionResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/convert-to-project`)
      .set('Authorization', `Bearer ${token}`)
      .expect(409);

    expect(reconversionResponse.body).toEqual(
      expect.objectContaining({
        code: 'SIMULATION_ALREADY_CONVERTED',
      }),
    );
  });

  it('blocks conversion preview and conversion for an archived simulation', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Archived Simulation',
      organizationSlug: 'org-archived-simulation',
      email: 'archived-simulation@example.com',
      password: 'password123',
    });

    const token = await login('archived-simulation@example.com', 'password123');

    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Dossier archive',
      })
      .expect(201);

    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId: folderResponse.body.id,
        name: 'Simulation archivee',
        strategy: 'FLIP',
        propertyType: 'ANCIEN',
        departmentCode: '68',
        purchasePrice: 150000,
        worksBudget: 20000,
        financingMode: 'CASH',
        targetResalePrice: 210000,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationResponse.body.id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const previewResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationResponse.body.id}/conversion-preview`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(previewResponse.body).toEqual(
      expect.objectContaining({
        canConvert: false,
        blockingIssues: expect.arrayContaining([
          expect.objectContaining({
            code: 'SIMULATION_ARCHIVED',
          }),
        ]),
      }),
    );

    const conversionResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationResponse.body.id}/convert-to-project`)
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(conversionResponse.body).toEqual(
      expect.objectContaining({
        code: 'SIMULATION_ARCHIVED',
      }),
    );
  });

  it('creates and manages opportunity events for a simulation', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Events',
      organizationSlug: 'org-events',
      email: 'events@example.com',
      password: 'password123',
    });

    const token = await login('events@example.com', 'password123');

    // Create folder and simulation
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Mulhouse',
      })
      .expect(201);

    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId: folderResponse.body.id,
        name: 'Maison Familiale',
        strategy: 'FLIP',
        propertyType: 'ANCIEN',
        departmentCode: '68',
        purchasePrice: 200000,
        worksBudget: 40000,
        financingMode: 'CASH',
        targetResalePrice: 290000,
      })
      .expect(201);

    const simulationId = simulationResponse.body.id as string;

    // Create opportunity event
    const eventResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: OpportunityEventType.NEGOTIATION_PRICE,
        title: 'Negociation du prix',
        description: 'Le vendeur accepte de baisser le prix',
        eventDate: '2026-03-25',
        impact: 'Prix reduit de 10000 EUR',
      })
      .expect(201);

    const eventId = eventResponse.body.id as string;

    expect(eventResponse.body).toEqual(
      expect.objectContaining({
        type: OpportunityEventType.NEGOTIATION_PRICE,
        title: 'Negociation du prix',
        simulationId,
        organizationId: actor.organization.id,
      }),
    );

    // List events
    const listResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(eventId);

    // Update event
    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/simulations/${simulationId}/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Negociation finalisee',
        impact: 'Prix reduit de 12000 EUR',
      })
      .expect(200);

    expect(updateResponse.body.title).toBe('Negociation finalisee');
    expect(updateResponse.body.impact).toBe('Prix reduit de 12000 EUR');

    // Delete event
    await request(app.getHttpServer())
      .delete(`/api/simulations/${simulationId}/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Verify event was deleted
    const deletedEvent = await prisma.opportunityEvent.findUnique({
      where: { id: eventId },
    });

    expect(deletedEvent).toBeNull();
  });

  it('calculates rental simulation metrics using lot rents when available', async () => {
    await seedUser(prisma, {
      organizationName: 'Org Rental Logic',
      organizationSlug: 'org-rental-logic',
      email: 'rental-logic@example.com',
      password: 'password123',
    });

    const token = await login('rental-logic@example.com', 'password123');

    // Create folder
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Strasbourg',
      })
      .expect(201);

    // Create simulation with manual rent
    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId: folderResponse.body.id,
        name: 'Immeuble 3 Lots',
        strategy: 'RENTAL',
        propertyType: 'ANCIEN',
        departmentCode: '67',
        purchasePrice: 300000,
        worksBudget: 50000,
        financingMode: 'LOAN',
        loanAmount: 300000,
        interestRate: 3.0,
        loanDurationMonths: 240,
        targetMonthlyRent: 2000,
      })
      .expect(201);

    const simulationId = simulationResponse.body.id as string;

    // Add lots with estimated rents
    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement T3',
        type: SimulationLotType.APARTMENT,
        surface: 65,
        estimatedRent: 900,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Appartement T2',
        type: SimulationLotType.APARTMENT,
        surface: 45,
        estimatedRent: 700,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/lots`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Garage',
        type: SimulationLotType.GARAGE,
        estimatedRent: 100,
      })
      .expect(201);

    // Get simulation detail
    const detailResponse = await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const result = detailResponse.body.resultSummaryJson as any;
    const activeValues = detailResponse.body.activeValues;

    // Total rent from lots should be 900 + 700 + 100 = 1700
    // Not the manual 2000
    expect(result.metrics.monthlyCashDelta).toBeDefined();
    expect(activeValues).toBeDefined();
    expect(activeValues.activeMonthlyRent).toBe(1700);
    expect(activeValues.activeMonthlyRentSource).toContain('LOTS');

    // Verify comparison endpoint
    const comparisonResponse = await request(app.getHttpServer())
      .get(`/api/simulations/folders/${folderResponse.body.id}/comparison`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(comparisonResponse.body).toHaveLength(1);
  });

  it('enforces tenant isolation for simulations and events', async () => {
    const actor = await seedUser(prisma, {
      organizationName: 'Org Sim A',
      organizationSlug: 'org-sim-a',
      email: 'sim-a@example.com',
      password: 'password123',
    });
    const outsider = await seedUser(prisma, {
      organizationName: 'Org Sim B',
      organizationSlug: 'org-sim-b',
      email: 'sim-b@example.com',
      password: 'password123',
    });

    const token = await login('sim-a@example.com', 'password123');
    const outsiderToken = await login('sim-b@example.com', 'password123');

    // Create folder and simulation for actor
    const folderResponse = await request(app.getHttpServer())
      .post('/api/simulation-folders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Folder A',
      })
      .expect(201);

    const simulationResponse = await request(app.getHttpServer())
      .post('/api/simulations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        folderId: folderResponse.body.id,
        name: 'Simulation A',
        strategy: 'RENTAL',
        propertyType: 'ANCIEN',
        departmentCode: '75',
        purchasePrice: 150000,
        worksBudget: 20000,
        financingMode: 'CASH',
        targetMonthlyRent: 1000,
      })
      .expect(201);

    const simulationId = simulationResponse.body.id as string;

    // Outsider cannot access the simulation
    await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);

    // Outsider cannot edit the simulation
    await request(app.getHttpServer())
      .patch(`/api/simulations/${simulationId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        name: 'Hacked Name',
      })
      .expect(404);

    // Create event for actor
    const eventResponse = await request(app.getHttpServer())
      .post(`/api/simulations/${simulationId}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: OpportunityEventType.VISIT_NOTE,
        title: 'Visite du bien',
        eventDate: '2026-03-26',
      })
      .expect(201);

    // Outsider cannot list events
    await request(app.getHttpServer())
      .get(`/api/simulations/${simulationId}/events`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);

    // Outsider cannot delete event
    await request(app.getHttpServer())
      .delete(
        `/api/simulations/${simulationId}/events/${eventResponse.body.id}`,
      )
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(404);

    // Verify data is properly isolated
    const actorSimulations = await prisma.simulation.findMany({
      where: { organizationId: actor.organization.id },
    });
    const outsiderSimulations = await prisma.simulation.findMany({
      where: { organizationId: outsider.organization.id },
    });

    expect(actorSimulations).toHaveLength(1);
    expect(outsiderSimulations).toHaveLength(0);
  });
});
