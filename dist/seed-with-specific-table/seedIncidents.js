"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const incidentData_1 = require("./data/incidentData");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
//@ts-ignore
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomTitle() {
    return `${randomElement(incidentData_1.anomalyTopics)} ${randomElement(incidentData_1.suffixes)}`;
}
function randomDescription() {
    return randomElement(incidentData_1.descriptions);
}
function randomDateWithinLast3Months() {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 6);
    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
}
async function main() {
    // Fetch all customers and users
    const customers = await prisma.customer.findMany({ select: { id: true } });
    const users = await prisma.user.findMany({ select: { id: true } });
    if (customers.length === 0) {
        throw new Error("No customers found in the database. Seed or create some customers first.");
    }
    if (users.length === 0) {
        throw new Error("No users found in the database. Seed or create some users first.");
    }
    const count = 1; // adjust for volume
    const incidents = [];
    for (let i = 0; i < count; i++) {
        const createdAt = randomDateWithinLast3Months();
        const updatedAt = new Date(createdAt.getTime() + Math.random() * 3600000 * 24); // up to a day
        incidents.push({
            id: (0, crypto_1.randomUUID)(),
            title: randomTitle(),
            description: randomDescription(),
            status: randomElement(statuses),
            priority: randomElement(priorities),
            createdAt,
            updatedAt,
            customerId: randomElement(customers).id,
            assigneeId: randomElement(users).id,
        });
    }
    await prisma.incident.createMany({ data: incidents });
    console.log(`Inserted ${count} incidents with random customers/users`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
