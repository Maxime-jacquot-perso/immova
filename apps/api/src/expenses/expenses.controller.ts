import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from '../common/guards/organization-access.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpensesService } from './expenses.service';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Controller('projects/:projectId/expenses')
@UseGuards(JwtAuthGuard, OrganizationAccessGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.expensesService.list(user.organizationId!, projectId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Body() body: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.organizationId!, projectId, body);
  }

  @Patch(':expenseId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
    @Param('expenseId') expenseId: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.expensesService.update(
      user.organizationId!,
      projectId,
      expenseId,
      body,
    );
  }
}
