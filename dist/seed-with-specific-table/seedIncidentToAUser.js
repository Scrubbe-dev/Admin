"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const incidentData_1 = require("./data/incidentData");
const prisma = new client_1.PrismaClient();
const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const CUSTOMER_ID = "25005a81-ae98-44f2-ab45-62962636c81f";
const ASSIGNEE_ID = "0acf0e7e-bb20-49b8-b95b-e7d1bba81a5e";
function randomDateWithinLast3Months() {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - 3);
    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
}
// @ts-ignore
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomTitle() {
    return `${randomElement(incidentData_1.anomalyTopics)} ${randomElement(incidentData_1.suffixes)}`;
}
function randomDescription() {
    return randomElement(incidentData_1.descriptions);
}
async function main() {
    const count = 200; // change to desired number
    const incidents = [];
    for (let i = 0; i < count; i++) {
        const createdAt = randomDateWithinLast3Months();
        const updatedAt = new Date(createdAt.getTime() + Math.random() * 3600000 * 48); // + up to 2 days
        //@ts-ignore
        incidents.push({
            id: (0, crypto_1.randomUUID)(),
            title: randomTitle(),
            description: randomDescription(),
            status: randomElement(statuses),
            priority: randomElement(priorities),
            createdAt,
            updatedAt,
            customerId: CUSTOMER_ID,
            assigneeId: ASSIGNEE_ID,
        });
    }
    await prisma.incident.createMany({
        data: incidents,
    });
    console.log(`Inserted ${count} incidents`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
