import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MerchantsModule } from './merchants/merchants.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [AuthModule, PrismaModule, MerchantsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
