import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CustomersService } from "./customers.service";

@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      status?: string;
    },
  ) {
    return this.customersService.create(body);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      status?: string;
    },
  ) {
    return this.customersService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.customersService.remove(id);
  }
}