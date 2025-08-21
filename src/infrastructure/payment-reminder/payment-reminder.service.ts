import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class PaymentReminderService {
  private readonly logger = new Logger(PaymentReminderService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendPaymentReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const paymentsDueToday = await this.prisma.payment.findMany({
      where: {
        isActive: true,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        Debt: {
          include: {
            Seller: true,
          },
        },
      },
    });

    if (!paymentsDueToday.length) {
      this.logger.log('Сегодня платежей нет');
      return;
    }

    for (const payment of paymentsDueToday) {
      const userId = payment.Debt.sellerId;
      const amount = payment.amount;
      const debtId = payment.Debt.id;
      this.logger.log(`🔔 Напоминание: Пользователь ${userId} должен оплатить ${amount} сум по долгу #${debtId} сегодня`);
    }
  }
}
