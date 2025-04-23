import express from 'express';
import * as waitingController from './waiting.controller';
import { validate } from '../../middleware/validate.middleware';
import { createWaitingUserSchema, getWaitingUsersSchema } from './waiting.schema';

const router = express.Router();

router.post(
  '/post-waiting',
  validate(createWaitingUserSchema),
  waitingController.createWaitingUser
);

router.get(
  '/get-waiting',
  validate(getWaitingUsersSchema),
  waitingController.getWaitingUsers
);

router.get(
    '/get-waiting/:id',
    waitingController.deleteWaitingUser
  );
export default router;