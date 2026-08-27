import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AccountingService } from "../accounting.service";
import { CreateExpenseDto } from "../dto";

@Controller("accounting/expenses")
export class ExpenseController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  create(@Body() data: CreateExpenseDto) {
    return this.accountingService.createExpense(data);
  }

  @Get("branch/:branchId")
  findAll(
    @Param("branchId") branchId: string,
    @Query("status") status?: string,
    @Query("category") category?: string,
  ) {
    return this.accountingService.getExpenses(branchId, {
      ...(status ? { status } : {}),
      ...(category ? { category } : {}),
    });
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body("status") status: string,
    @Body("approvedBy") approvedBy?: string,
  ) {
    return this.accountingService.updateExpenseStatus(
      id,
      status,
      approvedBy,
    );
  }
}