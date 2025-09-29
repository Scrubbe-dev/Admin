"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    }
    static error(res, message = 'Internal Server Error', statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message
        });
    }
    static notFound(res, message = 'Resource not found') {
        return res.status(404).json({
            success: false,
            message
        });
    }
    static validationError(res, errors, message = 'Validation failed') {
        return res.status(400).json({
            success: false,
            message,
            errors
        });
    }
}
exports.ApiResponse = ApiResponse;
