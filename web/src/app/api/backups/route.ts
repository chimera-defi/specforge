import { NextResponse } from "next/server";
import { getBackupManager, createBackup } from "@/lib/backup";

/**
 * GET /api/backups - Get backups
 */
export async function GET() {
  const manager = getBackupManager();
  const backups = manager.getAllBackups();
  const stats = manager.getStats();

  return NextResponse.json({
    backups,
    stats,
  });
}

/**
 * POST /api/backups - Create a backup
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { type } = body as { type?: "database" | "files" | "full" };

  const backupId = await createBackup(type || "full");

  return NextResponse.json({
    backupId,
    status: "completed",
  });
}

/**
 * DELETE /api/backups - Delete a backup
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const backupId = searchParams.get("backupId");

  if (!backupId) {
    return NextResponse.json(
      { error: "backupId is required" },
      { status: 400 }
    );
  }

  const manager = getBackupManager();
  const backup = manager.getBackup(backupId);

  if (!backup) {
    return NextResponse.json(
      { error: "Backup not found" },
      { status: 404 }
    );
  }

  // Delete the backup file
  if (backup.path) {
    const { promises: fs } = await import("fs");
    try {
      await fs.unlink(backup.path);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  return NextResponse.json({
    backupId,
    status: "deleted",
  });
}