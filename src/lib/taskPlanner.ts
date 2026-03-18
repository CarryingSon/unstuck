import { normalizeTaskPlan, type TaskPlan } from '../../shared/taskPlan.ts';

export type PlannerAnswers = {
  deadline: string;
  time?: string;
  materials: string;
};

const ANALYSIS_TIMEOUT_MS = 45_000;

export const requestTaskPlan = async ({
  taskText,
  answers,
}: {
  taskText: string;
  answers: PlannerAnswers;
}): Promise<TaskPlan> => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), ANALYSIS_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('/api/task-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskText,
        answers,
      }),
      signal: abortController.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'AI analysis timed out after 45 seconds. Try again or check Vercel Function duration limits.'
      );
    }

    throw new Error('Could not reach the analysis endpoint. Check whether /api/task-plan exists.');
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body = payload as { plan?: unknown; error?: string } | null;

  if (!response.ok) {
    if (!body?.error && response.status === 404) {
      throw new Error('API route /api/task-plan was not found in deployment.');
    }
    throw new Error(body?.error || 'AI analysis failed. Please try again.');
  }

  const plan = normalizeTaskPlan(body?.plan);
  if (!plan) {
    throw new Error('AI response was not in the expected format.');
  }

  return plan;
};
