import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AccountingService } from "../accounting.service";
import { CreateInvoiceDto } from "../dto";

@Controller("accounting/invoices")
export class InvoiceController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  create(@Body() data: CreateInvoiceDto) {
    return this.accountingService.createInvoice(data);
  }

  @Get("branch/:branchId")
  findAll(
    @Param("branchId") branchId: string,
    @Query("status") status?: string,
    @Query("customerId") customerId?: string,
  ) {
    return this.accountingService.getInvoices(branchId, {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.accountingService.getInvoiceById(id);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.accountingService.updateInvoiceStatus(id, status);
  }
}