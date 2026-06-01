import { NextResponse } from "next/server";
import { getJobQueue, registerDefaultJobHandlers } from "@/lib/jobs/queue";

// Initialize default handlers
registerDefaultJobHandlers();

/**
 * GET /api/jobs - Get all jobs or jobs by status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const queue = getJobQueue();

  if (status) {
    const jobs = queue.getJobsByStatus(status as "pending" | "processing" | "completed" | "failed" | "delayed");
    return NextResponse.json({ jobs });
  }

  const jobs = queue.getAllJobs();
  const stats = queue.getStats();

  return NextResponse.json({
    jobs,
    stats,
  });
}

/**
 * POST /api/jobs - Add a job to the queue
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { name, data, options } = body;

  if (!name || !data) {
    return NextResponse.json(
      { error: "name and data are required" },
      { status: 400 }
    );
  }

  const queue = getJobQueue();
  const jobId = await queue.addJob(name, data, options);

  return NextResponse.json({
    jobId,
    status: "pending",
  });
}