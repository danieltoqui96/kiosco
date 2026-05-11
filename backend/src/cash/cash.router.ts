import { Router } from 'express';
import { CashController } from './cash.controller.js';

export const cashRouter = Router();

cashRouter.get('/', CashController.getSummaryByDay);
cashRouter.get('/day/:day', CashController.getDayDetail);
cashRouter.put('/day/:day/initial', CashController.updateInitialBalance);
cashRouter.post('/day/:day/withdrawals', CashController.createWithdrawal);
cashRouter.post('/day/:day/deposits', CashController.createDeposit);
cashRouter.post('/day/:day/withdrawals/:withdrawalId/void', CashController.voidWithdrawal);
