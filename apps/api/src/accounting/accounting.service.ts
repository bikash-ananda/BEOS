import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAccountDto,
  CreateInvoiceDto,
  CreatePaymentDto,
  CreateExpenseDto,
} from './dto';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================
  // ACCOUNTS
  // ============================================================

  async createAccount(data: CreateAccountDto) {
    return this.prisma.account.create({
      data,
    });
  }

  async getAccounts(branchId: string) {
    return this.prisma.account.findMany({
      where: {
        branchId,
        isActive: true,
      },
      include: {
        entries: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getAccountById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        entries: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(
    id: string,
    data: Partial<CreateAccountDto>,
  ) {
    await this.getAccountById(id);

    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // ============================================================
  // INVOICES
  // ============================================================

  async createInvoice(data: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: {
        ...data,
        status: data.status ?? 'Draft',
      },
      include: {
        items: true,
      },
    });
  }

  async getInvoices(
    branchId: string,
    filters?: {
      status?: string;
      customerId?: string;
    },
  ) {
    return this.prisma.invoice.findMany({
      where: {
        branchId,
        ...filters,
      },
      include: {
        items: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async updateInvoiceStatus(
    id: string,
    status: string,
  ) {
    await this.getInvoiceById(id);

    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  // ============================================================
  // PAYMENTS
  // ============================================================

  async recordPayment(data: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id: data.invoiceId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const currentAmountPaid = invoice.amountPaid
      ? Number(invoice.amountPaid)
      : 0;

    const invoiceAmount = Number(invoice.amount);

    const newAmountPaid =
      currentAmountPaid + data.amount;

    const newStatus =
      newAmountPaid >= invoiceAmount
        ? 'Paid'
        : 'Partial';

    const result = await this.prisma.$transaction(
      async (transaction) => {
        const payment = await transaction.payment.create({
          data,
        });

        const updatedInvoice =
          await transaction.invoice.update({
            where: {
              id: data.invoiceId,
            },
            data: {
              amountPaid: newAmountPaid,
              status: newStatus,
            },
          });

        return {
          payment,
          invoice: updatedInvoice,
        };
      },
    );

    return result;
  }

  async getPayments(invoiceId?: string) {
    return this.prisma.payment.findMany({
      where: invoiceId
        ? { invoiceId }
        : {},
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================================
  // EXPENSES
  // ============================================================

  async createExpense(data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        ...data,
        status: data.status ?? 'Pending',
      },
    });
  }

  async getExpenses(
    branchId: string,
    filters?: {
      status?: string;
      category?: string;
    },
  ) {
    return this.prisma.expense.findMany({
      where: {
        branchId,
        ...filters,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateExpenseStatus(
    id: string,
    status: string,
    approvedBy?: string,
  ) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        status,
        approvedBy,
      },
    });
  }

  // ============================================================
  // GENERAL LEDGER
  // ============================================================

  async createGLEntry(
    accountId: string,
    debit: number,
    credit: number,
    reference?: string,
  ) {
    return this.prisma.gLEntry.create({
      data: {
        accountId,
        debit,
        credit,
        reference,
      },
    });
  }

  async getGLEntries(accountId: string) {
    return this.prisma.gLEntry.findMany({
      where: {
        accountId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}