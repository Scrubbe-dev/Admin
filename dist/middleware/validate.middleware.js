"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const admin_utils_1 = require("../modules/admin-auth/admin.utils");
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    }
    catch (error) {
        const errorMessage = error.errors?.map((err) => err.message).join(', ') || 'Validation failed';
        next(new admin_utils_1.ApiError(400, errorMessage));
    }
};
exports.validate = validate;
