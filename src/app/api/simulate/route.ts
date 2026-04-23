import { runSimulation } from '@/backend/controllers/simulation';

export async function POST(req: Request) {
  const body = await req.json();
  return runSimulation(body);
}