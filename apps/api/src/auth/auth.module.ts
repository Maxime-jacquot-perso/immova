import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { InvitationsModule } from '../invitations/invitations.module';
import { LegalDocumentsModule } from '../legal/legal-documents.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UserActionTokensService } from './user-action-tokens.service';

@Module({
  imports: [
    PrismaModule,
    InvitationsModule,
    LegalDocumentsModule,
    MailModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, UserActionTokensService],
  exports: [AuthService],
})
export class AuthModule {}
