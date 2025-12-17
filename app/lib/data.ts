import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getTargetUrls() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const targets = await prisma.targetURL.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                scanResults: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        return targets;
    } catch (error) {
        console.error('Failed to fetch targets:', error);
        return [];
    }
}
