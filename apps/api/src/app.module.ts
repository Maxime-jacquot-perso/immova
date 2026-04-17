import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ExportsModule } from './exports/exports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IdeasModule } from './ideas/ideas.module';
import { LegalDocumentsModule } from './legal/legal-documents.module';
import { LotsModule } from './lots/lots.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PilotApplicationsModule } from './pilot-applications/pilot-applications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { SimulationFoldersModule } from './simulation-folders/simulation-folders.module';
import { SimulationsModule } from './simulations/simulations.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AdminModule,
    AuthModule,
    BillingModule,
    LegalDocumentsModule,
    OrganizationsModule,
    MembershipsModule,
    DashboardModule,
    IdeasModule,
    ProjectsModule,
    LotsModule,
    ExpensesModule,
    DocumentsModule,
    ExportsModule,
    PilotApplicationsModule,
    SimulationFoldersModule,
    SimulationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
