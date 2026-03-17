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
  if (!date) return 'Ni podan.';
  return time ? `${date} ob ${time}` : date;
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/task-plan', async (req, res) => {
  const body = req.body as PlannerRequestBody;
  const taskText = String(body?.taskText ?? '').trim();
  const deadline = String(body?.answers?.deadline ?? '').trim();
  const time = String(body?.answers?.time ?? '').trim();
  const materials = String(body?.answers?.materials ?? '').trim() || 'Ni navedeno';

  if (!taskText) {
    return res.status(400).json({ error: 'Manjka opis naloge.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'Manjka OPENAI_API_KEY v okolju. Dodaj ga v .env.local.' });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

    const response = await client.responses.create({
      model,
      instructions:
        'Ti si odlicen AI mentor za razclenjevanje nalog. Pomagaj uporabniku dobiti jasen, izvedljiv plan.',
      input: [
        'Pripravi strukturiran plan v slovenskem jeziku.',
        `Opis naloge: ${taskText}`,
        `Rok: ${formatDeadline(deadline, time)}`,
        `Stanje gradiva: ${materials}`,
        'Vrni 3 do 8 korakov.',
        'Koraki naj bodo v logicnem zaporedju, z realisticno casovno oceno po korakih.',
        'Poskusi predvideti tudi cas za pregled/oddajo na koncu.',
        'Odgovori samo z JSON objektom, brez markdown ograje.',
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
        error: 'Model je vrnil neveljaven plan. Poskusi znova.',
        raw: response.output_text,
      });
    }

    return res.json({ plan });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({
        error: error.message || 'OpenAI API napaka.',
      });
    }

    return res.status(500).json({
      error: 'Neznana napaka pri generiranju plana.',
    });
  }
});

const port = Number(process.env.API_PORT || 8787);
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
