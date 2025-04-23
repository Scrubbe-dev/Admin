import express from 'express';
import * as adminController from './admin.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginAdminSchema, registerAdminSchema , updatePasswordSchema} from './admin.schema';

const router = express.Router();

router.post(
  '/admin/register',
  validate(registerAdminSchema),
  adminController.registerAdmin
);

router.post(
  '/admin/login',
  validate(loginAdminSchema),
  adminController.loginAdmin
);

router.put(
    '/admin/password',
    validate(updatePasswordSchema),
    adminController.updatePassword
  );

router.delete(
  '/admin/:adminId',
  adminController.deleteAdmin
)

export default router;