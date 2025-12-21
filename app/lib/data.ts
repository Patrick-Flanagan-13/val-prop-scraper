'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getTargetUrls(
    query?: string,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    status: 'all' | 'active' | 'suspended' = 'all'
) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const where: any = { userId: session.user.id };

    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { url: { contains: query, mode: 'insensitive' } },
        ];
    }

    if (status !== 'all') {
        where.active = status === 'active';
    }

    return prisma.targetURL.findMany({
        where,
        include: {
            scanResults: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { [sort]: order },
    });
}

export async function getUsers() {
    // Basic admin check could be added here
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function getProposals() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.proposedTarget.findMany({
        where: {
            userId: session.user.id,
            status: 'PENDING',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function getUserSettings() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timezone: true },
    });

    return user;
}
