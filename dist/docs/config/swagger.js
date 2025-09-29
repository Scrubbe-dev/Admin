"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = require("../../../package.json");
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: package_json_1.name,
        version: package_json_1.version,
        description: package_json_1.description,
        contact: {
            name: 'API Support',
            url: 'https://admin-rul9.onrender.com/support',
            email: 'support@yourdomain.com'
        },
        license: {
            name: 'Commercial',
            url: 'https://admin-rul9.onrender.com'
        }
    },
    servers: [
        {
            url: 'https://admin-rul9.onrender.com/api/v1',
            description: 'Development server'
        },
        {
            url: 'https://admin-rul9.onrender.com/v1',
            description: 'Production server'
        }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            },
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'X-API-KEY'
            }
        },
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string', example: 'VALIDATION_ERROR' },
                            message: { type: 'string', example: 'Invalid request parameters' },
                            details: { type: 'array', items: { type: 'string' } }
                        }
                    }
                }
            },
            IPGeoResponse: {
                type: 'object',
                properties: {
                    ip: { type: 'string', example: '192.168.1.1' },
                    type: { type: 'string', enum: ['ipv4', 'ipv6'] },
                    city: { type: 'string', example: 'San Francisco' },
                    // ... other properties from your IPGeoResponse interface
                }
            }
        }
    }
};
const options = {
    swaggerDefinition,
    apis: [
        './src/routes/*.ts',
        './src/controllers/*.ts',
        './src/models/*.ts',
        './src/dtos/*.ts'
    ]
};
exports.default = options;
