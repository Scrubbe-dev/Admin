// src/routes/docs.route.ts
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const router = Router();
const openApiSpec = YAML.load(path.join(__dirname, '../../openapi.yaml'));

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'API Interactive Docs',
}));

export default router;