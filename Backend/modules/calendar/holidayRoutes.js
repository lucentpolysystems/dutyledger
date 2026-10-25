import express from 'express';
import { addHoliday, getHolidays } from './holidayController.js';

const router = express.Router();

router.post('/holidays/add', addHoliday);
router.get('/holidays', getHolidays);

export default router;
