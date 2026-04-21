import { runSimulationController } from "@/controllers/simulation.controller";

export async function POST(req: Request) {
  return runSimulationController(req);
}
// Force reload 2