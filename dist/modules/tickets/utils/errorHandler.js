"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const apiResponse_1 = require("./apiResponse");
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
        return apiResponse_1.ApiResponse.validationError(res, [err.message]);
    }
    if (err.name === 'NotFoundError') {
        return apiResponse_1.ApiResponse.notFound(res, err.message);
    }
    return apiResponse_1.ApiResponse.error(res, 'Internal server error');
};
exports.errorHandler = errorHandler;
