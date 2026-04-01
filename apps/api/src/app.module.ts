import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { ExportsModule } from './exports/exports.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IdeasModule } from './ideas/ideas.module';
import { LotsModule } from './lots/lots.module';
import { MembershipsModule } from './memberships/memberships.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PilotApplicationsModule } from './pilot-applications/pilot-applications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    AdminModule,
    AuthModule,
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
