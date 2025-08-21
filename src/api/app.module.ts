import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from 'src/common/mailer/mailer.module';
import { JwtModule } from '@nestjs/jwt';
import { VendorsModule } from './vendors/vendors.module';
import { ExampleModule } from './example/example.module';
import { BorrowersModule } from './borrowers/borrowers.module';
import { AlertsModule } from './alerts/alerts.module';
import { LoansModule } from './loans/loans.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentReminderModule } from '../infrastructure/payment-reminder/payment-reminder.module';
import { LoanPhotoModule } from './loan-photo/loan-photo.module';
import { BorrowerPhotoModule } from './borrower-photo/borrower-photo.module';
import { BorrowerPhoneModule } from './borrower-phone/borrower-phone.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UploadModule } from 'src/infrastructure/upload/upload.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AdminModule,
    MailModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    VendorsModule,
    ExampleModule,
    BorrowersModule,
    AlertsModule,
    LoansModule,
    PaymentReminderModule,
    LoanPhotoModule,
    BorrowerPhotoModule,
    BorrowerPhoneModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UploadModule,
  ],
})
export class AppModule {}
