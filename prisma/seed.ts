// seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { generateApiKey } from 'generate-api-key';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // Cleanup existing data (order matters for foreign key constraints)
  await prisma.$transaction([
    prisma.refreshToken.deleteMany(),
    prisma.playbookExecution.deleteMany(),
    prisma.incidentComment.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.securityEvent.deleteMany(),
    prisma.detectionRule.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
    prisma.waitingUser.deleteMany(),  
    prisma.admin.deleteMany(),
  ]);

  // Create admin user
  const adminPassword = await hash(
    process.env.ADMIN_PASSWORD || 'SecurePassword123!',
    12
  );
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      isActive: true,
    },
  });

  

  // Create enterprise customers
  const customers = await prisma.$transaction(
    Array.from({ length: 5 }).map((_, i) =>
      prisma.customer.create({
        data: {
          name: `Enterprise Customer ${i + 1}`,
          contactEmail: `security-${i + 1}@customer${i + 1}.com`,
          tenantId: `tenant-${i + 1}-${Date.now()}`,
          contracts: {
            create: {
              serviceLevel: 'ENTERPRISE',
              startDate: new Date(),
              endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
          },
        },
      })
    )
  );

  // Create security users
  const users = await Promise.all(
    customers.flatMap((customer) =>
      Array.from({ length: 3 }).map(async (_, i) => {
        const email = `user${i + 1}@${customer.name.replace(/\s/g, '').toLowerCase()}.com`;
        return prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            passwordHash: await hash('SecureUserPassword123!', 12),
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            role: 'CUSTOMER',
            apiKey: generateApiKey({ method: 'uuidv4' }) as string,
            Customer: {
              connect: { id: customer.id },
            },
          },
        });
      })
    )
  );

  // Create detection rules
  const detectionRules = await prisma.$transaction(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.detectionRule.create({
        data: {
          name: `Enterprise Threat Rule ${i + 1}`,
          description: faker.lorem.sentence(),
          condition: { pattern: `event.severity > ${i + 3}` },
          severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][i % 4] as any,
          status: 'ACTIVE',
          type: ['THRESHOLD', 'ANOMALY', 'CORRELATION'][i % 3] as any,
          mitreTactics: ['TA0001', 'TA0002'],
          mitreTechniques: ['T1059', 'T1068'],
          whocreated:`Enterprise Threat Rule ${i + 1}`,
          createdById: admin.id,
          autoGenerateIncident: i % 2 === 0,
        },
      })
    )
  );

  // Create sample incidents with related data
  await prisma.$transaction(
    customers.map((customer) =>
      prisma.incident.create({
        data: {
          title: `Security Breach Investigation - ${customer.name}`,
          description: faker.lorem.paragraphs(3),
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          customer: { connect: { id: customer.id } },
          assignee: { connect: { id: users[0].id } },
          comments: {
            create: {
              content: 'Initial investigation started',
              isInternal: true,
              author: { connect: { id: users[0].id } },
            },
          },
          alerts: {
            create: {
              rule: { connect: { id: detectionRules[0].id } },
              status: 'OPEN',
              severity: 8,
            },
          },
        },
      })
    )
  );

  const securityEvents = await prisma.$transaction(
    Array.from({ length: 50 }).map(() =>
      prisma.securityEvent.create({
        data: {
          source: faker.internet.ipv4(),
          type: faker.helpers.arrayElement([
            'AUTH_FAILURE',
            'MALWARE_DETECTED',
            'DATA_EXFILTRATION',
            'UNAUTHORIZED_ACCESS'
          ]),
          severity: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
          rawData: {
            description: faker.lorem.sentence(),
            additionalInfo: faker.lorem.paragraph(),
            sourceIp: faker.internet.ipv4(),
            userAgent: faker.internet.userAgent()
          },
          customer: faker.datatype.boolean(0.7) ? { // 70% chance of customer association
            connect: { id: faker.helpers.arrayElement(customers).id }
          } : undefined,
          timestamp: faker.date.recent({ days: 7 }),
          processed: faker.datatype.boolean(),
          alert: faker.datatype.boolean(0.3) ? { // 30% chance of alert association
            create: {
              severity: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
              rule: {
                connect: { id: faker.helpers.arrayElement(detectionRules).id }
              },
              status: faker.helpers.arrayElement(['OPEN', 'IN_PROGRESS', 'RESOLVED']),
              createdAt: new Date()
            }
          } : undefined
        }
      })
    )
  );

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });