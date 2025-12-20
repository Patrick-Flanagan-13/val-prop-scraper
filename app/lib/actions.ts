'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { redirect } from 'next/navigation';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
    });

    const data = schema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
    });

    if (!data.success) {
        return 'Invalid fields';
    }

    const { email, password, name } = data.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return 'User already exists.';

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
    } catch (error) {
        return 'Failed to create user.';
    }

    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function createTarget(
    prevState: string | undefined,
    formData: FormData,
) {
    const session = await auth();
    if (!session?.user?.id) return 'Not authenticated';

    const schema = z.object({
        name: z.string().min(1),
        url: z.string().url(),
        schedule: z.string(),
        prompt: z.string().optional(),
        customFields: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
    });

    const data = schema.safeParse({
        name: formData.get('name'),
        url: formData.get('url'),
        schedule: formData.get('schedule'),
        prompt: formData.get('prompt'),
        customFields: formData.get('customFields'),
    });

    if (!data.success) {
        return 'Invalid fields';
    }

    try {
        await prisma.targetURL.create({
            data: {
                ...data.data,
                userId: session.user.id,
                // If customFields is undefined, Prisma uses default from schema
            },
        });
    } catch (error) {
        return 'Failed to create target.';
    }

    redirect('/dashboard');
}

import { scrapeAndProcess } from './scraper';

export async function triggerScan(targetId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    // Verify ownership
    const target = await prisma.targetURL.findUnique({
        where: { id: targetId },
    });

    if (!target || target.userId !== session.user.id) {
        return { error: 'Unauthorized' };
    }

    // Run scan (this might take a while, ideally should be background job)
    // For MVP, we await it.
    const result = await scrapeAndProcess(targetId);

    if (result.success) {
        redirect(`/dashboard/${targetId}`);
    } else {
        return { error: 'Scan failed' };
    }
}

export async function updateTargetConfig(
    targetId: string,
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    const schema = z.object({
        schedule: z.string(),
        prompt: z.string().optional(),
        customFields: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(Boolean) : undefined),
        active: z.coerce.boolean(),
    });

    const data = schema.safeParse({
        schedule: formData.get('schedule'),
        prompt: formData.get('prompt'),
        customFields: formData.get('customFields'),
        active: formData.get('active'),
    });

    if (!data.success) {
        return { error: 'Invalid fields' };
    }

    const { schedule, prompt, customFields } = data.data;

    // Verify ownership
    const target = await prisma.targetURL.findUnique({
        where: { id: targetId },
    });

    if (!target || target.userId !== session.user.id) {
        return { error: 'Unauthorized' };
    }

    try {
        // Only update customFields if provided (handle undefined vs empty array)
        const updateData: any = {
            schedule,
            prompt: prompt || null,
            active,
        };

        if (customFields !== undefined) {
            updateData.customFields = customFields;
        }

        await prisma.targetURL.update({
            where: { id: targetId },
            data: updateData,
        });
    } catch (error) {
        return { error: 'Failed to update configuration' };
    }

    redirect(`/dashboard/${targetId}`);
}

export async function createUser(
    prevState: string | undefined,
    formData: FormData,
) {
    const session = await auth();
    if (!session?.user?.id) return 'Not authenticated';

    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
    });

    const data = schema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name'),
    });

    if (!data.success) {
        return 'Invalid fields';
    }

    const { email, password, name } = data.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return 'User already exists.';

        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
    } catch (error) {
        return 'Failed to create user.';
    }

    redirect('/dashboard/users');
}

export async function updateUserPassword(
    userId: string,
    formData: FormData
) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    const schema = z.object({
        password: z.string().min(6),
    });

    const data = schema.safeParse({
        password: formData.get('password'),
    });

    if (!data.success) {
        return { error: 'Password must be at least 6 characters' };
    }

    const { password } = data.data;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    } catch (error) {
        return { error: 'Failed to update password' };
    }

    // Don't redirect, just return success so UI can show a toast or message
    return { success: 'Password updated successfully' };
}

export async function deleteTarget(targetId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated' };

    // Verify ownership
    const target = await prisma.targetURL.findUnique({
        where: { id: targetId },
    });

    if (!target || target.userId !== session.user.id) {
        return { error: 'Unauthorized' };
    }

    try {
        await prisma.targetURL.delete({
            where: { id: targetId },
        });
    } catch (error) {
        return { error: 'Failed to delete target' };
    }

    redirect('/dashboard');
}
