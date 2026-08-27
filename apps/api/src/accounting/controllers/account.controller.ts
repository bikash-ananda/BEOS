import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AccountingService } from "../accounting.service";
import { CreateAccountDto } from "../dto";

@Controller("accounting/accounts")
export class AccountController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post()
  create(@Body() data: CreateAccountDto) {
    return this.accountingService.createAccount(data);
  }

  @Get("branch/:branchId")
  findAll(@Param("branchId") branchId: string) {
    return this.accountingService.getAccounts(branchId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.accountingService.getAccountById(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() data: Partial<CreateAccountDto>,
  ) {
    return this.accountingService.updateAccount(id, data);
  }
}