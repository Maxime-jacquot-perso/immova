import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

function mapExpense(expense: {
  id: string;
  projectId: string;
  lotId: string | null;
  invoiceNumber: string | null;
  issueDate: Date;
  amountHt: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  amountTtc: Prisma.Decimal;
  category: string;
  paymentStatus: string;
  vendorName: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...expense,
    amountHt: toNumber(expense.amountHt),
    vatAmount: toNumber(expense.vatAmount),
    amountTtc: toNumber(expense.amountTtc),
  };
}

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertProject(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async assertLot(
    organizationId: string,
    projectId: string,
    lotId: string | null | undefined,
  ) {
    if (!lotId) {
      return;
    }

    const lot = await this.prisma.lot.findFirst({
      where: {
        id: lotId,
        projectId,
        organizationId,
      },
    });

    if (!lot) {
      throw new NotFoundException('Lot not found');
    }
  }

  async list(organizationId: string, projectId: string) {
    await this.assertProject(organizationId, projectId);

    const expenses = await this.prisma.expense.findMany({
      where: { organizationId, projectId },
      orderBy: { issueDate: 'desc' },
    });

    return expenses.map(mapExpense);
  }

  async create(
    organizationId: string,
    projectId: string,
    input: CreateExpenseDto,
  ) {
    await this.assertProject(organizationId, projectId);
    await this.assertLot(organizationId, projectId, input.lotId);

    const expense = await this.prisma.expense.create({
      data: {
        organizationId,
        projectId,
        lotId: input.lotId || undefined,
        invoiceNumber: input.invoiceNumber,
        issueDate: new Date(input.issueDate),
        amountHt: input.amountHt,
        vatAmount: input.vatAmount,
        amountTtc: input.amountTtc,
        category: input.category,
        paymentStatus: input.paymentStatus,
        vendorName: input.vendorName,
        comment: input.comment,
      },
    });

    return mapExpense(expense);
  }

  async update(
    organizationId: string,
    projectId: string,
    expenseId: string,
    input: UpdateExpenseDto,
  ) {
    await this.assertProject(organizationId, projectId);
    await this.assertLot(organizationId, projectId, input.lotId);

    const expense = await this.prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId,
        projectId,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    const updated = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        lotId: input.lotId || null,
        invoiceNumber: input.invoiceNumber,
        issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
        amountHt: input.amountHt,
        vatAmount: input.vatAmount,
        amountTtc: input.amountTtc,
        category: input.category,
        paymentStatus: input.paymentStatus,
        vendorName: input.vendorName,
        comment: input.comment,
      },
    });

    return mapExpense(updated);
  }
}
