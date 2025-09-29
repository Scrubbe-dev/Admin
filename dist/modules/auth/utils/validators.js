"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validate = validate;
const error_1 = require("../error");
const zod_1 = require("zod");
/**
 * Validates the request body against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate (typically req.body)
 * @returns The validated data
 * @throws ValidationError if validation fails
 */
async function validateRequest(schema, data) {
    try {
        const validatedData = await schema.parseAsync(data);
        return validatedData;
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const details = error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            }));
            throw new error_1.ValidationError('Validation failed', details);
        }
        throw error;
    }
}
/**
 * Middleware factory that validates request data against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
function validate(schema) {
    return async (req, _res, next) => {
        try {
            const validatedData = await validateRequest(schema, req.body);
            req.body = validatedData;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
