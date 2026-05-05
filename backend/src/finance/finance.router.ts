import { Router } from 'express';
import { FinanceController } from './finance.controller.js';

export const financeRouter = Router();

financeRouter.get('/daily', FinanceController.getDailySummary);
financeRouter.get('/daily/:day', FinanceController.getDailyDetail);
