import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
  acceptInvitation(@Body() body: AcceptInvitationDto) {
    return this.authService.acceptInvitation(body);
  }
}
