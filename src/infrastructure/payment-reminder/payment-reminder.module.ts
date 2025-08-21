import { Module } from '@nestjs/common';
import { PaymentReminderService } from './payment-reminder.service';

@Module({
  providers: [PaymentReminderService]
})
export class PaymentReminderModule {}
