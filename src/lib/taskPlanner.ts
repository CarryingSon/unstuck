import { normalizeTaskPlan, type TaskPlan } from '../../shared/taskPlan.ts';

export type PlannerAnswers = {
  deadline: string;
  time?: string;
  materials: string;
};

export const requestTaskPlan = async ({
  taskText,
  answers,
}: {
  taskText: string;
  answers: PlannerAnswers;
}): Promise<TaskPlan> => {
  const response = await fetch('/api/task-plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      taskText,
      answers,
    }),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const body = payload as { plan?: unknown; error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error || 'AI analiza trenutno ni uspela.');
  }

  const plan = normalizeTaskPlan(body?.plan);
  if (!plan) {
    throw new Error('AI odgovor ni bil v pricakovani obliki.');
  }

  return plan;
};
