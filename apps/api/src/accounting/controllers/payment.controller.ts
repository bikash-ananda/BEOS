import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { AccountingService } from "../accounting.service";
import { CreatePaymentDto } from "../dto";

@Controller("accounting/payments")
export class PaymentController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  create(@Body() data: CreatePaymentDto) {
    return this.accountingService.recordPayment(data);
  }

  @Get()
  findAll(@Query("invoiceId") invoiceId?: string) {
    return this.accountingService.getPayments(invoiceId);
  }
}