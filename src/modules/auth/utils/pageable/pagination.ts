import prisma from "../../../../prisma-clients/client";
import { Pageable } from "./pageable";

/**
 * Generic paginate function for any Prisma model
 * @param modelName - Prisma model name (e.g., "user", "incident")
 * @param args - Prisma findMany arguments
 * @param page - Current page
 * @param limit - Items per page
 */
export async function paginate<T>(
  modelName: keyof typeof prisma,
  args: any,
  page: number,
  limit: number
): Promise<Pageable<T>> {
  const skip = (page - 1) * limit;

  const model = prisma[modelName] as any;

  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take: limit,
    }),
    model.count({
      where: args?.where,
    }),
  ]);

  return new Pageable<T>({
    data,
    total,
    page,
    limit,
  });
}
