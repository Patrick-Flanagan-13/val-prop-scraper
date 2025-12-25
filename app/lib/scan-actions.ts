'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function promoteScanToMaster(scanId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const scan = await prisma.scanResult.findUnique({
        where: { id: scanId },
        include: { targetUrl: true },
    });

    if (!scan) throw new Error('Scan not found');
    if (scan.targetUrl.userId !== session.user.id) throw new Error('Unauthorized');
    if (!scan.extractedData) throw new Error('No data to promote');

    // Update TargetURL with master data
    await prisma.targetURL.update({
        where: { id: scan.targetUrlId },
        data: {
            masterData: scan.extractedData,
        },
    });

    // Update ScanResult status
    await prisma.scanResult.update({
        where: { id: scanId },
        data: {
            reviewStatus: 'APPROVED',
        },
    });

    revalidatePath(`/dashboard/${scan.targetUrlId}`);
    revalidatePath(`/dashboard/scan/${scanId}`);

    return { success: true };
}

export async function rejectScan(scanId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const scan = await prisma.scanResult.findUnique({
        where: { id: scanId },
        include: { targetUrl: true },
    });

    if (!scan) throw new Error('Scan not found');
    if (scan.targetUrl.userId !== session.user.id) throw new Error('Unauthorized');

    // Update ScanResult status
    await prisma.scanResult.update({
        where: { id: scanId },
        data: {
            reviewStatus: 'REJECTED',
        },
    });

    revalidatePath(`/dashboard/${scan.targetUrlId}`);
    revalidatePath(`/dashboard/scan/${scanId}`);

    return { success: true };
}

export async function promoteFieldsToMaster(scanId: string, fieldsToPromote: Record<string, any>) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const scan = await prisma.scanResult.findUnique({
        where: { id: scanId },
        include: { targetUrl: true },
    });

    if (!scan) throw new Error('Scan not found');
    if (scan.targetUrl.userId !== session.user.id) throw new Error('Unauthorized');

    // Get current master data
    let currentMasterData: any = {};
    if (scan.targetUrl.masterData) {
        try {
            currentMasterData = JSON.parse(scan.targetUrl.masterData);
        } catch (e) {
            // If invalid JSON, treat as empty or raw string. 
            // If it was a raw string, we might lose it if we overwrite with JSON.
            // Assumption: we are moving to a structured world.
            console.error("Failed to parse existing master data", e);
        }
    }

    // Merge logic
    // We expect master data to be { summary: "...", structured: { ... } }
    // fieldsToPromote might contain "summary" or keys inside "structured".

    // Ensure structure exists
    if (!currentMasterData.structured) {
        // If current master data is basically empty or differently shaped, initialize it.
        // It might be that currentMasterData IS the structured object (legacy).
        // Let's normalize it to { summary: ..., structured: ... }
        if (!currentMasterData.summary && !currentMasterData.structured) {
            // It might be just flat Key-Values
            const { summary, ...rest } = currentMasterData;
            currentMasterData = {
                summary: summary || "",
                structured: rest
            };
        }
    }

    const newMasterData = { ...currentMasterData };
    if (!newMasterData.structured) newMasterData.structured = {};

    // Apply updates
    if (fieldsToPromote.summary !== undefined) {
        newMasterData.summary = fieldsToPromote.summary;
    }

    // Remove summary from fieldsToPromote to iterate over structured args
    const { summary: _, ...structuredFields } = fieldsToPromote;

    if (Object.keys(structuredFields).length > 0) {
        newMasterData.structured = {
            ...newMasterData.structured,
            ...structuredFields
        };
    }

    // Update TargetURL
    await prisma.targetURL.update({
        where: { id: scan.targetUrlId },
        data: {
            masterData: JSON.stringify(newMasterData),
        },
    });

    revalidatePath(`/dashboard/${scan.targetUrlId}`);
    revalidatePath(`/dashboard/scan/${scanId}`);

    return { success: true };
}
