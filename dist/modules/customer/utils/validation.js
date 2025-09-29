"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = void 0;
class ValidationUtils {
    static validate(schema, data) {
        try {
            const validatedData = schema.parse(data);
            return { success: true, data: validatedData };
        }
        catch (error) {
            const errorMessage = error.errors?.[0]?.message || 'Validation failed';
            return { success: false, error: errorMessage };
        }
    }
    static handleValidationError(error) {
        if (error.errors) {
            return {
                success: false,
                message: 'Validation failed',
                error: error.errors[0]?.message
            };
        }
        return {
            success: false,
            message: 'Validation failed',
            error: 'Unknown validation error'
        };
    }
}
exports.ValidationUtils = ValidationUtils;
