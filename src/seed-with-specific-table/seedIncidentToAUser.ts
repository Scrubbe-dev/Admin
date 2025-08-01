import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { anomalyTopics, descriptions, suffixes } from "./data/incidentData";

const prisma = new PrismaClient();

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const CUSTOMER_ID = "25005a81-ae98-44f2-ab45-62962636c81f";
const ASSIGNEE_ID = "cd52a9e9-35e5-41d3-8b55-97654bdf62d7";

function randomDateWithinLast3Months() {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - 3);
  const randomTime =
    past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

// @ts-ignore
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTitle() {
  return `${randomElement(anomalyTopics)} ${randomElement(suffixes)}`;
}

function randomDescription() {
  return randomElement(descriptions);
}

async function main() {
  const count = 200; // change to desired number
  const incidents = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDateWithinLast3Months();
    const updatedAt = new Date(
      createdAt.getTime() + Math.random() * 3600000 * 48
    ); // + up to 2 days

    //@ts-ignore
    incidents.push({
      id: randomUUID(),
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
