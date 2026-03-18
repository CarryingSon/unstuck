import dotenv from 'dotenv';
import express from 'express';
import { createTaskPlan, type PlannerRequestBody, PlannerServiceError } from './taskPlannerService.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/task-plan', async (req, res) => {
  try {
    const plan = await createTaskPlan({
      body: req.body as PlannerRequestBody,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    });

    return res.json({ plan });
  } catch (error) {
    if (error instanceof PlannerServiceError) {
      if (error.status >= 500) {
        console.error('[task-plan] Planner service failure', error);
      }

      const payload: Record<string, unknown> = { error: error.message };
      if (error.details && process.env.NODE_ENV !== 'production') {
        payload.details = error.details;
      }

      return res.status(error.status).json(payload);
    }

    console.error('[task-plan] Unexpected failure', error);
    return res.status(500).json({
      error: 'Unknown error while generating the plan.',
    });
  }
});

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
