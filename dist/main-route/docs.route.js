"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/docs.route.ts
const express_1 = require("express");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const openApiSpec = yamljs_1.default.load(path_1.default.join(__dirname, '../../openapi.yaml'));
router.use('/', swagger_ui_express_1.default.serve);
router.get('/', swagger_ui_express_1.default.setup(openApiSpec, {
    customSiteTitle: 'API Interactive Docs',
}));
exports.default = router;
