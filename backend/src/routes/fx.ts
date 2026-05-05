import { Router } from 'express';
import { getFxRates } from '../fx';

const router = Router();

router.get('/', async (_req, res) => {
  const rates = await getFxRates();
  res.json({ rates });
});

export default router;
