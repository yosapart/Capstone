import { getProjectsController, createProjectController } from "@/controllers/project.controller";

export async function GET() {
  return getProjectsController();
}

export async function POST(req: Request) {
  return createProjectController(req);
}