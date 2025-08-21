import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { successResponse } from 'src/infrastructure/responseCode/responde';
import { DebtorFilterDto } from './dto/debtor-filter.dto';
import { AdminRole } from '@prisma/client';

@Injectable()
export class DebtorService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDebtorDto: CreateDebtorDto, userId: string) {
    try {
      const user = await this.prisma.seller.findFirst({
        where: { id: userId },
      });
      if (!user) throw new BadRequestException('user not found');

      const { phones, images, ...debtorData } = createDebtorDto;

      const debtor = await this.prisma.debtor.create({
        data: {
          ...debtorData,
          sellerId: userId,
          Phone: {
            create: phones.map((phone) => ({
              phoneNumber: phone,
            })),
          },
          ImgOfDebtor: {
            create: images.map((img) => ({
              name: img,
            })),
          },
        },
        include: {
          Phone: true,
        },
      });

      return successResponse(debtor, 'Debtor created', 201);
    } catch (error) {
      throw new BadRequestException(`Error creating debtor: ${error.message}`);
    }
  }

  async findAll(filter: DebtorFilterDto, userId: string) {
    const { search, page, limit, sortBy, sortOrder } = filter;
    const sortField = sortBy ?? 'createdAt';
    const direction = sortOrder ?? 'desc';

    const where: any = { sellerId: userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const debtors = await this.prisma.debtor.findMany({
        where,
        skip: (page || 1 - 1) * (limit || 0),
        take: limit,
        orderBy: {
          [sortField]: direction,
        },
        include: {
          Debt: {
            include: {
              Payment: { where: { isActive: true }, select: { amount: true } },
            },
          },
          Seller: true,
          Phone: true,
        },
      });

      const enriched = debtors.map((debtor) => {
        const totalDebt = debtor.Debt.reduce((acc, debt) => {
          const activePaymentsSum = debt.Payment.reduce(
            (sum, payment) => sum + payment.amount,
            BigInt(0),
          );
          return acc + activePaymentsSum;
        }, BigInt(0));

        return { ...debtor, totalDebt };
      });

      const total = await this.prisma.debtor.count({ where });

      return successResponse(enriched, 'Debtors retrieved successfully', 200, {
        total,
        page,
        limit,
      });
    } catch (error) {
      throw new BadRequestException(`Error fetching debtors: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const debtor = await this.prisma.debtor.findFirst({
        where: { id },
        include: {
          Debt: {
            include: {
              Payment: {
                orderBy: { date: 'asc' },
              },
            },
          },
          ImgOfDebtor: true,
          Phone: true,
          Seller: true,
        },
      });

      if (!debtor) throw new BadRequestException('debtor not found');
      const enrichedDebts = debtor.Debt.map((debt) => {
        const totalPayments = debt.Payment.reduce(
          (acc, payment) => acc + payment.amount,
          BigInt(0),
        );

        const nextPayment =
          debt.Payment.filter((p) => p.isActive).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )[0] || null;

        return {
          ...debt,
          totalPayments,
          nextPayment,
        };
      });

      const totalAmount = enrichedDebts.reduce(
        (acc, debt) => acc + debt.totalPayments,
        BigInt(0),
      );

      return successResponse(
        { ...debtor, Debt: enrichedDebts, totalAmount },
        'debtor fetched successfully',
        200,
      );
    } catch (error) {
      throw new BadRequestException(`Error fetching debtor: ${error.message}`);
    }
  }

  async updateStar(id: string) {
    const debtor = await this.prisma.debtor.findFirst({ where: { id } });
    if (!debtor) throw new BadRequestException('debtor not found');
    try {
      await this.prisma.debtor.update({
        where: { id },
        data: { star: !debtor.star },
      });
    } catch (error) {
      throw new BadRequestException(`Error updating debtor: ${error.message}`);
    }
    return successResponse({}, 'Debtor star updated', 200);
  }

  async update(
    id: string,
    updateDebtorDto: UpdateDebtorDto,
    user: { id: string; role: AdminRole },
  ) {
    try {
      const debtor = await this.prisma.debtor.findFirst({ where: { id } });
      if (!debtor) throw new BadRequestException('debtor not found');

      if (
        debtor.sellerId !== user.id &&
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN'
      ) {
        throw new ForbiddenException('Access denied');
      }

      const { phones, images, ...debtorData } = updateDebtorDto;

      const [_, __, updatedDebtor] = await this.prisma.$transaction([
        this.prisma.phoneOfDebtor.deleteMany({
          where: { debtorId: id },
        }),
        this.prisma.imgOfDebtor.deleteMany({
          where: { debtorId: id },
        }),
        this.prisma.debtor.update({
          where: { id },
          data: {
            ...debtorData,
            ...(phones?.length
              ? {
                  Phone: {
                    create: phones.map((phone) => ({
                      phoneNumber: phone,
                    })),
                  },
                }
              : {}),
            ...(images?.length
              ? {
                  ImgOfDebtor: {
                    create: images.map((img) => ({
                      name: img,
                    })),
                  },
                }
              : {}),
          },
          include: {
            Phone: true,
            ImgOfDebtor: true,
          },
        }),
      ]);

      return successResponse(updatedDebtor, 'Debtor updated', 200);
    } catch (error) {
      throw new BadRequestException(`Error updating debtor: ${error.message}`);
    }
  }

  async remove(id: string, user: { id: string; role: AdminRole }) {
    try {
      const debtor = await this.prisma.debtor.findFirst({ where: { id } });
      if (!debtor) throw new BadRequestException('Debtor not found');

      if (
        debtor.sellerId !== user.id &&
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN'
      ) {
        throw new ForbiddenException('Access denied');
      }

      await this.prisma.$transaction(async (tx) => {
        const debts = await tx.debt.findMany({ where: { debtorId: id } });

        for (const debt of debts) {
          await tx.paymentHistory.deleteMany({ where: { debtId: debt.id } });
          await tx.payment.deleteMany({ where: { debtId: debt.id } });
          await tx.imgOfDebt.deleteMany({ where: { debtId: debt.id } });
        }
        await tx.debt.deleteMany({ where: { debtorId: id } });
        await tx.imgOfDebtor.deleteMany({ where: { debtorId: id } });
        await tx.phoneOfDebtor.deleteMany({ where: { debtorId: id } });
        await tx.notification.deleteMany({ where: { debtorId: id } });
        await tx.debtor.delete({ where: { id } });
      });

      return successResponse({}, 'Debtor deleted', 200);
    } catch (error) {
      throw new BadRequestException(`Error deleting debtor: ${error.message}`);
    }
  }
}
