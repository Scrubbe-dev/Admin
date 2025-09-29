"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllWaitingUser = exports.getUserById = exports.deleteWaitingUser = exports.getUserByEmail = exports.searchById = exports.getWaitingUsers = exports.createWaitingUser = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const admin_utils_1 = require("../admin-auth/admin.utils");
const createWaitingUser = async (input) => {
    const existingUser = await (0, exports.getUserByEmail)(input.email);
    if (existingUser) {
        throw new admin_utils_1.ApiError(409, 'Email already exists in waiting list');
    }
    return client_1.default.waitingUser.create({
        data: input
    });
};
exports.createWaitingUser = createWaitingUser;
const getWaitingUsers = async (query) => {
    const { page, limit, role, search } = query;
    const where = {
        ...(role && { role }),
        ...(search && {
            OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } }
            ]
        })
    };
    const [users, total] = await Promise.all([
        client_1.default.waitingUser.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }),
        client_1.default.waitingUser.count({ where })
    ]);
    return {
        data: users,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
};
exports.getWaitingUsers = getWaitingUsers;
const searchById = async (id) => {
    const existingUser = await (0, exports.getUserById)(id);
    if (existingUser) {
        throw new admin_utils_1.ApiError(409, 'Email already exists in waiting list');
    }
    return client_1.default.waitingUser.findFirst({
        where: {
            id
        }
    });
};
exports.searchById = searchById;
const getUserByEmail = async (email) => {
    return client_1.default.waitingUser.findUnique({
        where: { email },
        select: {
            id: true,
            email: true
        }
    });
};
exports.getUserByEmail = getUserByEmail;
const deleteWaitingUser = async (id) => {
    const waitingUser = await client_1.default.waitingUser.findUnique({
        where: { id }
    });
    if (!waitingUser) {
        throw new admin_utils_1.ApiError(404, 'Waiting user not found');
    }
    return client_1.default.waitingUser.delete({
        where: { id }
    });
};
exports.deleteWaitingUser = deleteWaitingUser;
const getUserById = async (id) => {
    return client_1.default.waitingUser.findUnique({
        where: { id },
        select: {
            id: true,
            email: true
        }
    });
};
exports.getUserById = getUserById;
const getAllWaitingUser = async () => {
    const waitingUser = await client_1.default.waitingUser.findMany();
    if (!waitingUser) {
        throw new admin_utils_1.ApiError(404, 'No waiting users found');
    }
    return waitingUser;
};
exports.getAllWaitingUser = getAllWaitingUser;
