import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from './accounting.service';
import { AccountController } from './controllers/account.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { PaymentController } from './controllers/payment.controller';
import { ExpenseController } from './controllers/expense.controller';

@Module({
  controllers: [AccountController, InvoiceController, PaymentController, ExpenseController],
  providers: [PrismaService, AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
