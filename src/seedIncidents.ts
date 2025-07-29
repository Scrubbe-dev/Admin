import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const CUSTOMER_ID = '25005a81-ae98-44f2-ab45-62962636c81f';
const ASSIGNEE_ID = '2939b349-424f-453b-856e-a72be2c9007b';

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
  const topics = [
    'Security Breach Investigation',
    'Database Outage',
    'DDoS Attack',
    'Phishing Campaign',
    'Cloud Storage Failure',
    'Privilege Escalation',
    'Certificate Expiration',
    'Malware Infection',
    'API Latency Spike',
    'Firewall Misconfiguration'
  ];
  const suffix = ['- Enterprise', '- Internal', '- Customer Report', '- External Endpoint'];
  return `${randomElement(topics)} ${randomElement(suffix)}`;
}

function randomDescription() {
  const templates = [
    'Suspicious activity detected affecting core services. Investigation ongoing.',
    'Critical system failure causing widespread impact to users.',
    'High traffic anomaly resembling DDoS patterns. Mitigation in progress.',
    'Privilege escalation vulnerability discovered in admin portal.',
    'Malware activity detected on several endpoints. Containment initiated.',
    'Unexpected outage impacting payment services in production environment.',
    'Firewall misconfiguration exposed sensitive services. Access restricted.'
  ];
  return randomElement(templates);
}

async function main() {
  const count = 50; // change to desired number
  const incidents = [];

  for (let i = 0; i < count; i++) {
    const createdAt = randomDateWithinLast3Months();
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 3600000 * 48); // + up to 2 days

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
      assigneeId: ASSIGNEE_ID
    });
  }

  await prisma.incident.createMany({
    data: incidents
  });

  console.log(`Inserted ${count} incidents`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
