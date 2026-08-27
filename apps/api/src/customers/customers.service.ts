import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  create(data: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    status?: string;
  }) {
    return this.prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        country: data.country,
        status: data.status ?? "Active",
      },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      country?: string;
      status?: string;
    },
  ) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}