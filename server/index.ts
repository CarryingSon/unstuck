import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';
import { normalizeTaskPlan, TASK_PLAN_JSON_SCHEMA } from '../shared/taskPlan.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

type PlannerRequestBody = {
  taskText?: unknown;
  answers?: {
    deadline?: unknown;
    time?: unknown;
    materials?: unknown;
  };
};

const app = express();
app.use(express.json({ limit: '1mb' }));

const parseModelJson = (rawText: string) => {
  const text = rawText.trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const formatDeadline = (date: string, time: string) => {
  if (!date) return 'Not provided.';
  return time ? `${date} at ${time}` : date;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/task-plan', async (req, res) => {
  const body = req.body as PlannerRequestBody;
  const taskText = String(body?.taskText ?? '').trim();
  const deadline = String(body?.answers?.deadline ?? '').trim();
  const time = String(body?.answers?.time ?? '').trim();
  const materials = String(body?.answers?.materials ?? '').trim() || 'Not specified';

  if (!taskText) {
    return res.status(400).json({ error: 'Task description is missing.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'OPENAI_API_KEY is missing in the environment. Add it to .env.local.' });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

    const response = await client.responses.create({
      model,
      instructions:
        'You are an excellent AI mentor for breaking down tasks. Help the user get a clear, actionable plan.',
      input: [
        'Prepare a structured plan in English.',
        `Task description: ${taskText}`,
        `Due date: ${formatDeadline(deadline, time)}`,
        `Available materials: ${materials}`,
        'Return 3 to 8 steps.',
        'Steps should be in logical order, with realistic time estimates per step.',
        'Include time for final review/submission at the end.',
        'Respond with JSON only, without markdown fences.',
      ].join('\n'),
      max_output_tokens: 1200,
      text: {
        verbosity: 'low',
        format: {
          type: 'json_schema',
          name: 'task_plan',
          strict: true,
          schema: TASK_PLAN_JSON_SCHEMA,
        },
      },
    });

    const parsedJson = parseModelJson(response.output_text);
    const plan = normalizeTaskPlan(parsedJson);

    if (!plan) {
      return res.status(502).json({
        error: 'The model returned an invalid plan. Please try again.',
        raw: response.output_text,
      });
    }

    return res.json({ plan });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: error.message || 'OpenAI API error.',
      });
    }

    return res.status(500).json({
      error: 'Unknown error while generating the plan.',
    });
  }
});

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
