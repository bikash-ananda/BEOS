import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, CreateInvoiceDto, CreatePaymentDto, CreateExpenseDto } from './dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  // Accounts
  async createAccount(data: CreateAccountDto) {
    return this.prisma.account.create({ data });
  }

  async getAccounts(branchId: string) {
    return this.prisma.account.findMany({
      where: { branchId, isActive: true },
      include: { entries: true },
    });
  }

  async getAccountById(id: string) {
    return this.prisma.account.findUnique({
      where: { id },
      include: { entries: true },
    });
  }

  async updateAccount(id: string, data: Partial<CreateAccountDto>) {
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // Invoices
  async createInvoice(data: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data,
      include: { items: true },
    });
  }

  async getInvoices(branchId: string, filters?: { status?: string; customerId?: string }) {
    return this.prisma.invoice.findMany({
      where: { branchId, ...filters },
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string) {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
  }

  async updateInvoiceStatus(id: string, status: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  // Payments
  async recordPayment(data: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({ data });
    
    // Update invoice amountPaid
    const invoice = await this.prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    const newAmountPaid = (invoice?.amountPaid || 0) + data.amount;
    await this.prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newAmountPaid >= invoice!.amount ? 'Paid' : 'Partial',
      },
    });

    return payment;
  }

  async getPayments(invoiceId?: string) {
    return this.prisma.payment.findMany({
      where: invoiceId ? { invoiceId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  // Expenses
  async createExpense(data: CreateExpenseDto) {
    return this.prisma.expense.create({ data });
  }

  async getExpenses(branchId: string, filters?: { status?: string; category?: string }) {
    return this.prisma.expense.findMany({
      where: { branchId, ...filters },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateExpenseStatus(id: string, status: string, approvedBy?: string) {
    return this.prisma.expense.update({
      where: { id },
      data: { status, approvedBy },
    });
  }

  // GL Entries
  async createGLEntry(accountId: string, debit: number, credit: number, reference?: string) {
    return this.prisma.gLEntry.create({
      data: { accountId, debit, credit, reference },
    });
  }

  async getGLEntries(accountId: string) {
    return this.prisma.gLEntry.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
