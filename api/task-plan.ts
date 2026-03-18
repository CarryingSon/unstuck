import { createTaskPlan, type PlannerRequestBody, PlannerServiceError } from '../server/taskPlannerService.ts';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const plan = await createTaskPlan({
      body: (req.body ?? {}) as PlannerRequestBody,
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL,
    });

    return res.status(200).json({ plan });
  } catch (error) {
    if (error instanceof PlannerServiceError) {
      if (error.status >= 500) {
        console.error('[api/task-plan] Planner service failure', error);
      }

      return res.status(error.status).json({
        error: error.message,
      });
    }

    console.error('[api/task-plan] Unexpected failure', error);
    return res.status(500).json({
      error: 'Unknown error while generating the plan.',
    });
  }
}
