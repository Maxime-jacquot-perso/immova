import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  LegalAcceptanceSource,
  LegalDocumentType,
  Prisma,
} from '@prisma/client';
import {
  getRequiredDocumentTypesForScope,
  listLegalDocumentDefinitions,
  type LegalAcceptanceScope as SharedLegalAcceptanceScope,
  type LegalDocumentType as SharedLegalDocumentType,
} from '../../../../packages/legal/src';
import { PrismaService } from '../prisma/prisma.service';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

type AcceptanceStatusInput = {
  userId: string;
  organizationId?: string | null;
  scope: SharedLegalAcceptanceScope;
};

type AcceptCurrentDocumentsInput = AcceptanceStatusInput & {
  source: LegalAcceptanceSource;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const documentTypeOrder: Record<LegalDocumentType, number> = {
  MENTIONS_LEGALES: 0,
  CGU: 1,
  CGV: 2,
  PRIVACY_POLICY: 3,
};

@Injectable()
export class LegalDocumentsService implements OnModuleInit {
  private currentVersionsEnsured = false;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureCurrentVersions();
  }

  async listCurrentDocuments() {
    await this.ensureCurrentVersions();

    const documents = await this.prisma.legalDocumentVersion.findMany({
      where: { isCurrent: true },
    });

    return documents
      .sort(
        (left, right) =>
          documentTypeOrder[left.documentType] -
          documentTypeOrder[right.documentType],
      )
      .map((document) => this.serializeDocumentVersion(document));
  }

  async getAcceptanceStatus(input: AcceptanceStatusInput) {
    const requiredDocuments = await this.getCurrentRequiredDocuments(input);

    if (requiredDocuments.length === 0) {
      return {
        scope: input.scope,
        isSatisfied: true,
        missingDocumentTypes: [] as LegalDocumentType[],
        requiredDocuments: [] as ReturnType<
          LegalDocumentsService['serializeDocumentVersion']
        >[],
      };
    }

    const acceptances = await this.prisma.userLegalAcceptance.findMany({
      where: {
        userId: input.userId,
        legalDocumentVersionId: {
          in: requiredDocuments.map((document) => document.id),
        },
      },
      select: {
        legalDocumentVersionId: true,
        organizationId: true,
      },
    });

    const missingDocuments = requiredDocuments.filter(
      (document) =>
        !acceptances.some(
          (acceptance) =>
            acceptance.legalDocumentVersionId === document.id &&
            this.isAcceptanceContextValid({
              documentType: document.documentType,
              acceptanceOrganizationId: acceptance.organizationId,
              currentOrganizationId: input.organizationId ?? null,
            }),
        ),
    );

    return {
      scope: input.scope,
      isSatisfied: missingDocuments.length === 0,
      missingDocumentTypes: missingDocuments.map(
        (document) => document.documentType,
      ),
      requiredDocuments: requiredDocuments.map((document) =>
        this.serializeDocumentVersion(document),
      ),
    };
  }

  async acceptCurrentDocuments(
    input: AcceptCurrentDocumentsInput,
    executor?: PrismaExecutor,
  ) {
    const prisma = executor ?? this.prisma;
    const currentDocuments = await this.getCurrentRequiredDocuments(
      input,
      prisma,
    );
    const acceptedAt = new Date();

    for (const document of currentDocuments) {
      const acceptanceWhere: Prisma.UserLegalAcceptanceWhereInput =
        document.documentType === LegalDocumentType.CGV && input.organizationId
          ? {
              userId: input.userId,
              legalDocumentVersionId: document.id,
              organizationId: input.organizationId,
            }
          : {
              userId: input.userId,
              legalDocumentVersionId: document.id,
            };

      const existingAcceptance = await prisma.userLegalAcceptance.findFirst({
        where: acceptanceWhere,
        select: {
          id: true,
        },
      });

      if (existingAcceptance) {
        continue;
      }

      await prisma.userLegalAcceptance.create({
        data: {
          userId: input.userId,
          organizationId: input.organizationId ?? null,
          legalDocumentVersionId: document.id,
          source: input.source,
          acceptedAt,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    }

    return {
      scope: input.scope,
      acceptedAt,
      acceptedDocuments: currentDocuments.map((document) =>
        this.serializeDocumentVersion(document),
      ),
    };
  }

  async ensureCheckoutAcceptance(input: {
    userId: string;
    organizationId: string;
  }) {
    return this.getAcceptanceStatus({
      userId: input.userId,
      organizationId: input.organizationId,
      scope: 'CHECKOUT',
    });
  }

  private async getCurrentRequiredDocuments(
    input: AcceptanceStatusInput,
    executor?: PrismaExecutor,
  ) {
    await this.ensureCurrentVersions(executor);
    const prisma = executor ?? this.prisma;
    const documentTypes = this.mapSharedDocumentTypes(
      getRequiredDocumentTypesForScope(input.scope, {
        hasOrganizationContext: Boolean(input.organizationId),
      }),
    );

    if (documentTypes.length === 0) {
      return [];
    }

    const documents = await prisma.legalDocumentVersion.findMany({
      where: {
        documentType: {
          in: documentTypes,
        },
        isCurrent: true,
      },
    });

    return documents.sort(
      (left, right) =>
        documentTypeOrder[left.documentType] -
        documentTypeOrder[right.documentType],
    );
  }

  private mapSharedDocumentTypes(
    documentTypes: readonly SharedLegalDocumentType[],
  ) {
    return documentTypes.map(
      (documentType) => documentType as LegalDocumentType,
    );
  }

  private async ensureCurrentVersions(executor?: PrismaExecutor) {
    if (this.currentVersionsEnsured) {
      return;
    }

    const prisma = executor ?? this.prisma;

    for (const definition of listLegalDocumentDefinitions()) {
      const documentType = definition.type as LegalDocumentType;
      const documentUpdatedAt = new Date(
        `${definition.updatedAt}T00:00:00.000Z`,
      );

      const existingVersion = await prisma.legalDocumentVersion.findUnique({
        where: {
          documentType_version: {
            documentType,
            version: definition.version,
          },
        },
      });

      const versionRecord = existingVersion
        ? await prisma.legalDocumentVersion.update({
            where: { id: existingVersion.id },
            data: {
              title: definition.title,
              slug: definition.slug,
              documentUpdatedAt,
              isCurrent: true,
            },
          })
        : await prisma.legalDocumentVersion.create({
            data: {
              documentType,
              title: definition.title,
              slug: definition.slug,
              version: definition.version,
              documentUpdatedAt,
              isCurrent: true,
            },
          });

      await prisma.legalDocumentVersion.updateMany({
        where: {
          documentType,
          isCurrent: true,
          id: { not: versionRecord.id },
        },
        data: {
          isCurrent: false,
        },
      });
    }

    this.currentVersionsEnsured = true;
  }

  private isAcceptanceContextValid(input: {
    documentType: LegalDocumentType;
    acceptanceOrganizationId: string | null;
    currentOrganizationId: string | null;
  }) {
    if (
      input.documentType === LegalDocumentType.CGV &&
      input.currentOrganizationId
    ) {
      return input.acceptanceOrganizationId === input.currentOrganizationId;
    }

    return true;
  }

  private serializeDocumentVersion(
    document: Prisma.LegalDocumentVersionGetPayload<Record<string, never>>,
  ) {
    return {
      type: document.documentType,
      title: document.title,
      slug: document.slug,
      version: document.version,
      updatedAt: document.documentUpdatedAt,
      isCurrent: document.isCurrent,
    };
  }
}
