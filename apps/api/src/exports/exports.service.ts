import { Injectable, NotFoundException } from '@nestjs/common';
import { toNumber } from '../common/utils/decimal.util';
import { PrismaService } from '../prisma/prisma.service';

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async expensesCsv(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const expenses = await this.prisma.expense.findMany({
      where: {
        organizationId,
        projectId,
      },
      include: {
        lot: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    const rows = [
      [
        'project',
        'invoiceNumber',
        'issueDate',
        'category',
        'paymentStatus',
        'vendorName',
        'lot',
        'amountHt',
        'vatAmount',
        'amountTtc',
        'comment',
      ],
      ...expenses.map((expense) => [
        project.name,
        expense.invoiceNumber,
        expense.issueDate.toISOString().slice(0, 10),
        expense.category,
        expense.paymentStatus,
        expense.vendorName,
        expense.lot?.name ?? '',
        toNumber(expense.amountHt),
        toNumber(expense.vatAmount),
        toNumber(expense.amountTtc),
        expense.comment,
      ]),
    ];

    return rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  }
}
