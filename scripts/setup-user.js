const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'admin@example.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Setting up user: ${email}`);

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('User exists, updating password...');
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                },
            });
        } else {
            console.log('User does not exist, creating...');
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Admin User',
                },
            });
        }

        console.log('User setup complete.');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (e) {
        console.error('Failed to setup user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
