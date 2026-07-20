import { Router, Response } from 'express';
import AppSettings from '../models/AppSettings';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function getOrCreateSettings() {
  let settings = await AppSettings.findOne();
  if (!settings) settings = await AppSettings.create({});
  return settings;
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

router.put('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const settings = await getOrCreateSettings();
  const { orderSourceOptions, notArrivedThresholdDays, notCollectedThresholdDays } = req.body;
  if (orderSourceOptions !== undefined) settings.orderSourceOptions = orderSourceOptions;
  if (notArrivedThresholdDays !== undefined) settings.notArrivedThresholdDays = notArrivedThresholdDays;
  if (notCollectedThresholdDays !== undefined) settings.notCollectedThresholdDays = notCollectedThresholdDays;
  await settings.save();
  res.json(settings);
});

export default router;
