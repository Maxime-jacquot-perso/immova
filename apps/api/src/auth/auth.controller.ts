import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { extractRequestMetadata } from '../common/utils/request-metadata.util';
import { AuthService } from './auth.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyInvitationQueryDto } from './dto/verify-invitation-query.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Get('invitations/verify')
  verifyInvitation(@Query() query: VerifyInvitationQueryDto) {
    return this.authService.verifyInvitation(query);
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
