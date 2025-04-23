import express from 'express';
import * as waitingController from './waiting.controller';
import { validate } from '../../middleware/validate.middleware';
import { createWaitingUserSchema, getWaitingUsersSchema } from './waiting.schema';

const router = express.Router();

router.post(
  '/',
  validate(createWaitingUserSchema),
  waitingController.createWaitingUser
);

router.get(
  '/',
  validate(getWaitingUsersSchema),
  waitingController.getWaitingUsers
);

export default router;