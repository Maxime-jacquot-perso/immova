import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { extractRequestMetadata } from '../common/utils/request-metadata.util';
import { AuthService } from './auth.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyInvitationQueryDto } from './dto/verify-invitation-query.dto';
import { VerifyResetPasswordQueryDto } from './dto/verify-reset-password-query.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body);
  }

  @Get('invitations/verify')
  verifyInvitation(@Query() query: VerifyInvitationQueryDto) {
    return this.authService.verifyInvitation(query);
  }

  @Get('reset-password/verify')
  verifyPasswordResetToken(@Query() query: VerifyResetPasswordQueryDto) {
    return this.authService.verifyPasswordResetToken(query);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Post('invitations/accept')
  acceptInvitation(@Body() body: AcceptInvitationDto, @Req() request: Request) {
    const metadata = extractRequestMetadata(request);

    return this.authService.acceptInvitation({
      ...body,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  }
}
