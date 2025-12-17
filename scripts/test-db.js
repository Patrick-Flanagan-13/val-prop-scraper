const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const email = `test-${Date.now()}@example.com`;
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Attempting to create user: ${email}`);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Test User',
            },
        });

        console.log('User created successfully:', user);
    } catch (e) {
        console.error('Failed to create user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
