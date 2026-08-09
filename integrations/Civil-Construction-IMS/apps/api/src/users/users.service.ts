import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        email: true,
        displayName: true,
        employeeNo: true,
        departmentId: true,
        organizationId: true,
        lastLoginAt: true,
        roles: { include: { role: true } },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: {
        organization: true,
        department: true,
        roles: {
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        },
      },
    });
    if (!user) throw new NotFoundException(`ユーザーが見つかりません: ${id}`);
    return user;
  }
}
