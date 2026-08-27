import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { PrismaService } from "./prisma/prisma.service";
import { CustomersModule } from "./customers/customers.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),

    CustomersModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,
    PrismaService,
  ],

  exports: [
    PrismaService,
  ],
})
export class AppModule {}