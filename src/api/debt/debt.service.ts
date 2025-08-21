import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { successResponse } from 'src/infrastructure/responseCode/responde';
import { DebtFilterDto } from './dto/debt-filter.dto';
import { DebtDaterDto } from './dto/debt-date.dto';

@Injectable()
export class DebtService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDebtDto: CreateDebtDto, userId: string) {
    const debtor = await this.prisma.debtor.findFirst({
      where: { id: createDebtDto.debtorId },
    });
    if (!debtor) throw new BadRequestException('debtor not found');
    const { images, ...rest } = createDebtDto;
    const base = Math.floor(createDebtDto.amount / createDebtDto.term);
    const remainder = createDebtDto.amount % createDebtDto.term;
    let createdDebt: any;

    try {
      await this.prisma.$transaction(async (tx) => {
        const debt = await tx.debt.create({
          data: {
            ...rest,
            sellerId: userId,
            ...(images?.length
              ? {
                  ImgOfDebt: {
                    create: images.map((img) => ({
                      name: img,
                    })),
                  },
                }
              : {}),
          },
        });

        const payments: {
          debtId: string;
          amount: number;
          month: number;
          date: Date;
        }[] = [];

        const startDate = new Date(createDebtDto.date);

        for (let month = 1; month <= createDebtDto.term; month++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + (month - 1));

          payments.push({
            debtId: debt.id,
            amount: base + (month === 1 ? remainder : 0),
            month,
            date,
          });
        }

        await tx.payment.createMany({ data: payments });
        createdDebt = debt;
      });
    } catch (error) {
      throw new BadRequestException(`Error creating debt: ${error.message}`);
    }

    return successResponse(createdDebt, 'Debt created', 201);
  }

  async oneMonthPay(debtId: string) {
    try {
      const debt = await this.prisma.debt.findFirst({ where: { id: debtId } });
      if (!debt) throw new BadRequestException('debt not found');
      const seller = await this.prisma.seller.findFirst({
        where: { id: debt.sellerId },
      });
      if (!seller) throw new BadRequestException('seller not found');

      await this.prisma.$transaction(async (tx) => {
        const payments = await tx.payment.findMany({
          where: { debtId, isActive: true },
          orderBy: { month: 'asc' },
        });

        if (!payments.length)
          throw new BadRequestException('There are no active debts');

        const firstPayment = payments[0];

        await tx.paymentHistory.create({
          data: {
            amount: firstPayment.amount,
            debtorId: debt.debtorId,
            debtId,
            paidAt: new Date(),
          },
        });

        await tx.seller.update({
          where: { id: seller.id },
          data: { wallet: seller.wallet + firstPayment.amount },
        });

        await tx.payment.update({
          where: { id: firstPayment.id },
          data: { isActive: false, amount: 0 },
        });
      });

      return successResponse({}, 'One month debt is paid', 200);
    } catch (error) {
      throw new BadRequestException(`Error paying one month: ${error.message}`);
    }
  }

  async anyQuantityPay(debtId: string, amount: bigint) {
    try {
      const debt = await this.prisma.debt.findFirst({ where: { id: debtId } });
      if (!debt) throw new BadRequestException('debt not found');

      const seller = await this.prisma.seller.findFirst({
        where: { id: debt.sellerId },
      });
      if (!seller) throw new BadRequestException('seller not found');

      const payments = await this.prisma.payment.findMany({
        where: { debtId, isActive: true },
        orderBy: { month: 'asc' },
      });
      if (!payments.length)
        throw new BadRequestException('There are no active debts');

      const originalAmount = amount;
      const payedIds: string[] = [];
      let partialPaymentId: string | null = null;
      let partialAmountLeft = BigInt(0);

      for (const payment of payments) {
        if (amount >= payment.amount) {
          amount -= payment.amount;
          payedIds.push(payment.id);
        } else {
          partialPaymentId = payment.id;
          partialAmountLeft = payment.amount - amount;
          amount = BigInt(0);
          break;
        }
      }

      await this.prisma.$transaction(async (tx) => {
        if (payedIds.length) {
          await Promise.all(
            payedIds.map((id) =>
              tx.payment.update({
                where: { id },
                data: { isActive: false, amount: 0 },
              }),
            ),
          );
        }

        await tx.paymentHistory.create({
          data: {
            amount: originalAmount,
            debtorId: debt.debtorId,
            debtId,
            paidAt: new Date(),
          },
        });

        await tx.seller.update({
          where: { id: seller.id },
          data: { wallet: seller.wallet + originalAmount },
        });

        if (partialPaymentId && partialAmountLeft) {
          await tx.payment.update({
            where: { id: partialPaymentId },
            data: { amount: partialAmountLeft },
          });
        }
      });

      return successResponse({}, `${payedIds.length} payments are paid`, 200);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(`Error paying debts: ${error.message}`);
    }
  }

  async manyMonthPay(debtId: string, months: Array<number>) {
    try {
      const debt = await this.prisma.debt.findFirst({ where: { id: debtId } });
      if (!debt) throw new BadRequestException('debt not found');

      const seller = await this.prisma.seller.findFirst({
        where: { id: debt.sellerId },
      });
      if (!seller) throw new BadRequestException('seller not found');

      const payments = await this.prisma.payment.findMany({
        where: {
          debtId,
          isActive: true,
          month: {
            in: months,
          },
        },
      });

      if (!payments.length)
        throw new BadRequestException('There are no active debts');

      const payedIds = payments.map((p) => p.id);
      const payedAmount = payments.reduce(
        (sum, p) => sum + p.amount,
        BigInt(0),
      );

      await this.prisma.$transaction(async (tx) => {
        await Promise.all(
          payedIds.map((id) =>
            tx.payment.update({
              where: { id },
              data: { isActive: false, amount: 0 },
            }),
          ),
        );

        await tx.paymentHistory.create({
          data: {
            amount: payedAmount,
            debtorId: debt.debtorId,
            debtId,
            paidAt: new Date(),
          },
        });
        await tx.seller.update({
          where: { id: seller.id },
          data: { wallet: seller.wallet + payedAmount },
        });
      });

      return successResponse({}, `${payedIds.length} months debt is paid`, 200);
    } catch (error) {
      throw new BadRequestException(
        `Error paying multiple months: ${error.message}`,
      );
    }
  }

  async paymentsHistory(sellerId: string) {
    try {
      const seller = await this.prisma.seller.findFirst({
        where: { id: sellerId },
      });
      if (!seller) throw new BadRequestException('seller not found');

      const paymentHistories = await this.prisma.paymentHistory.findMany({
        where: {
          Debt: { sellerId },
        },
        include: {
          Debtor: { include: { Phone: true } },
        },
        orderBy: { paidAt: 'desc' },
      });

      return successResponse(
        paymentHistories,
        'payment histories fetched',
        200,
      );
    } catch (error) {
      throw new BadRequestException(
        `Error fetching payment histories: ${error.message}`,
      );
    }
  }

  async debtDate(filter: DebtDaterDto, sellerId: string) {
    const { date } = filter;

    const seller = await this.prisma.seller.findFirst({
      where: { id: sellerId },
    });
    if (!seller) throw new BadRequestException('seller not found');

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const unpaidForDay = await this.prisma.payment.findMany({
      where: {
        isActive: true,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
        Debt: { sellerId },
      },
      include: { Debt: { include: { Debtor: true } } },
    });

    const ForMonth = await this.prisma.payment.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        Debt: { sellerId },
      },
      select: { amount: true },
    });

    const totalForMonth = ForMonth.reduce(
      (acc, p) => acc + p.amount,
      BigInt(0),
    );

    return successResponse(
      { unpaidForDay, totalForMonth },
      'Unpaid payments fetched',
      200,
    );
  }

  async findAll(filter: DebtFilterDto, sellerId: string) {
    try {
      const seller = await this.prisma.seller.findFirst({
        where: { id: sellerId },
      });
      if (!seller) throw new BadRequestException('seller not found');

      const { debtorId, search, page = 1, limit = 10, isActive } = filter;
      const sortBy = 'createdAt';

      const where: any = { sellerId };
      if (search) where.productName = { contains: search, mode: 'insensitive' };
      if (debtorId) where.debtorId = debtorId;

      const debts = await this.prisma.debt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: 'asc' },
        include: {
          Payment:
            typeof isActive === 'boolean' ? { where: { isActive } } : true,
          Seller: true,
        },
      });

      const enriched = debts.map((debt) => ({
        ...debt,
        totalPayments: debt.Payment.reduce(
          (acc, payment) => acc + payment.amount,
          BigInt(0),
        ),
      }));

      const total = await this.prisma.debt.count({ where });

      return successResponse(enriched, 'Debts retrieved successfully', 200, {
        total,
        page,
        limit,
      });
    } catch (error) {
      throw new BadRequestException(`Error fetching debts: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const debt = await this.prisma.debt.findFirst({
        where: { id },
        include: {
          Debtor: true,
          ImgOfDebt: true,
          Payment: { where: { isActive: true }, orderBy: { month: 'asc' } },
          Seller: true,
        },
      });
      if (!debt) throw new BadRequestException('debt not found');

      const totalPayments = debt.Payment.reduce(
        (acc, payment) => acc + payment.amount,
        BigInt(0),
      );

      return successResponse({ totalPayments, ...debt }, 'Debt fetched', 200);
    } catch (error) {
      throw new BadRequestException(`Error fetching debt: ${error.message}`);
    }
  }

  async update(id: string, updateDebtDto: UpdateDebtDto) {
    if (updateDebtDto.debtorId) {
      const debtor = await this.prisma.debtor.findFirst({
        where: { id: updateDebtDto.debtorId },
      });
      if (!debtor) throw new BadRequestException('debtor not found');
    }

    try {
      const debt = await this.prisma.debt.findFirst({ where: { id } });
      if (!debt) throw new BadRequestException('debt not found');

      const { amount, term, date, images, ...restData } = updateDebtDto;

      const updatedDebt = await this.prisma.$transaction(async (tx) => {
        const debtUpdated = await tx.debt.update({
          where: { id },
          data: {
            ...restData,
            ...(amount !== undefined ? { amount } : {}),
            ...(term !== undefined ? { term } : {}),
            ...(date !== undefined ? { date } : {}),
          },
        });

        const amountValue =
          typeof amount === 'bigint' ? Number(amount) : amount;
        const termValue = typeof term === 'bigint' ? Number(term) : term;
        const startDate = date ? new Date(date) : debt.date;

        if (
          amountValue != null &&
          termValue != null &&
          !isNaN(amountValue) &&
          !isNaN(termValue) &&
          termValue > 0
        ) {
          const base = Math.floor(amountValue / termValue);
          const remainder = amountValue % termValue;

          await tx.payment.deleteMany({ where: { debtId: id } });

          const payments: {
            debtId: string;
            amount: number;
            month: number;
            date: Date;
          }[] = [];
          for (let month = 1; month <= termValue; month++) {
            const paymentDate = new Date(startDate);
            paymentDate.setMonth(paymentDate.getMonth() + (month - 1));
            payments.push({
              debtId: id,
              amount: base + (month === 1 ? remainder : 0),
              month,
              date: paymentDate,
            });
          }
          await tx.payment.createMany({ data: payments });
        }

        if (images !== undefined) {
          await tx.imgOfDebt.deleteMany({ where: { debtId: id } });
          if (images.length) {
            await tx.imgOfDebt.createMany({
              data: images.map((img) => ({
                debtId: id,
                name: img,
              })),
            });
          }
        }

        return debtUpdated;
      });

      return successResponse(updatedDebt, 'Debt updated', 200);
    } catch (error) {
      throw new BadRequestException(`Error updating debt: ${error.message}`);
    }
  }

  async remove(id: string) {
    try {
      const debt = await this.prisma.debt.findFirst({ where: { id } });
      if (!debt) throw new BadRequestException('Debt not found');

      await this.prisma.$transaction(async (tx) => {
        await tx.imgOfDebt.deleteMany({ where: { debtId: id } });
        await tx.payment.deleteMany({ where: { debtId: id } });
        await tx.paymentHistory.deleteMany({ where: { debtId: id } });
        await tx.debt.delete({ where: { id } });
      });

      return successResponse({}, 'Debt is deleted', 200);
    } catch (error) {
      throw new BadRequestException(`Error deleting debt: ${error.message}`);
    }
  }
}
