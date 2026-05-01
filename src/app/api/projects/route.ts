import { 
  getProjectsController, 
  createProjectController, 
  updateProjectController, 
  deleteProjectController 
} from "@/controllers/project.controller";

export async function GET() {
  return getProjectsController();
}

export async function POST(req: Request) {
  return createProjectController(req);
}

export async function PUT(req: Request) {
  return updateProjectController(req);
}

export async function DELETE(req: Request) {
  return deleteProjectController(req);
}