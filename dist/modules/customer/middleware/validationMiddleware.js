"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate({
            body: req.body,
            query: req.query,
            params: req.params,
        }, { abortEarly: false, allowUnknown: true, stripUnknown: true });
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            const response = {
                success: false,
                message: 'Validation failed',
                error: errorMessage,
            };
            return res.status(400).json(response);
        }
        next();
    };
};
exports.validateRequest = validateRequest;
