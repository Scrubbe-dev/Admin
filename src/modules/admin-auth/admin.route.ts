import express from 'express';
import * as adminController from './admin.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginAdminSchema, registerAdminSchema , updatePasswordSchema} from './admin.schema';

const router = express.Router();

router.post(
  '/register',
  validate(registerAdminSchema),
  adminController.registerAdmin
);

router.post(
  '/login',
  validate(loginAdminSchema),
  adminController.loginAdmin
);

router.put(
    '/password',
    validate(updatePasswordSchema),
    adminController.updatePassword
  );

export default router;