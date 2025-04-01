// src/routes/soar.routes.ts
import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { IncidentController } from '../controllers/incident.controller';

const router = express.Router();
const controller = new IncidentController();

router.use(authenticate);
router.use(authorize(['ADMIN', 'SOAR_ENGINE']));

// SOAR Endpoints
router.post('/incidents', controller.createIncident.bind(controller));
router.put('/incidents/:id/status', controller.updateStatus.bind(controller));
router.post('/incidents/:id/playbooks', controller.executePlaybook.bind(controller));

export default router;