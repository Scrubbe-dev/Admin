// import prisma from "../config/database"
// import { randomUUID } from "crypto";

// const USER_ID = "cd52a9e9-35e5-41d3-8b55-97654bdf62d7";

// // Generate random timestamped data
// function generateGraphData(points = 20) {
//   const now = new Date();
//   return Array.from({ length: points }).map((_, i) => {
//     const timestamp = new Date(
//       now.getTime() - i * 3600000 * 6 // every 6 hours
//     ).toISOString();

//     return {
//       timestamp,
//       value: Math.floor(Math.random() * 100), // random value
//     };
//   });
// }

// async function main() {
//   const graphTypes = Object.values(GraphType);

//   for (const type of graphTypes) {
//     await prisma.graph.create({
//       data: {
//         id: randomUUID(),
//         userId: USER_ID,
//         type,
//         data: generateGraphData(30), // 30 data points
//       },
//     });
//   }

//   console.log(`Seeded graphs for user ${USER_ID}`);
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
