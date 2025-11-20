import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { canteenSchemas } from '../validations/canteenValidation.js';
import { createUser, listUsers, createRoom, assignRoom, getSummaryReport } from '../controllers/adminController.js';
import { createTransaction } from '../controllers/canteenController.js';

const router = Router();

router.use(protect, allowRoles('ADMIN'));

router.post('/users', createUser);
router.get('/users', listUsers);
router.post('/rooms', createRoom);
router.patch('/rooms/:id/assign', assignRoom);
router.get('/reports/summary', getSummaryReport);
router.post('/canteen/transactions', validate(canteenSchemas.transaction), createTransaction);

export default router;

