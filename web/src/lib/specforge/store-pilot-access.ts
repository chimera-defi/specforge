import { randomUUID } from "node:crypto";

import type {
  PilotAccessRequestRecord,
  StoreOptions,
  WorkspaceMembershipRecord,
} from "./store";
import {
  getDatabase,
  _resolveOptions as resolveOptions,
  _persistSnapshot as persistSnapshot,
} from "./store";

type PilotAccessRequestRow = {
  request_id: string;
  workspace_id: string;
  github_login: string;
  requested_name: string;
  requested_email: string | null;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  reviewed_by_actor_type: "human" | "agent" | null;
  reviewed_by_actor_id: string | null;
  reviewed_at: string | null;
  decision_reason: string | null;
  approved_membership_id: string | null;
  created_at: string;
};

type WorkspaceMemberRow = {
  membership_id: string;
  workspace_id: string;
  actor_id: string;
  actor_type: "human" | "agent";
  name: string;
  role: string;
  color: string;
  github_login: string | null;
  created_at: string;
};

export type CreatePilotAccessRequestInput = {
  workspace_id: string;
  github_login: string;
  requested_name?: string;
  requested_email?: string;
  note?: string;
};

export type ListPilotAccessRequestsOptions = StoreOptions & {
  status?: PilotAccessRequestRecord["status"];
  limit?: number;
};

export type ReviewPilotAccessRequestInput = {
  request_id: string;
  decision: "approve" | "reject";
  reviewed_by: {
    actor_type: "human" | "agent";
    actor_id: string;
  };
  decision_reason?: string;
  membership?: {
    name?: string;
    role?: string;
    color?: string;
  };
};

export type ReviewPilotAccessRequestResult = {
  request: PilotAccessRequestRecord;
  membership: WorkspaceMembershipRecord | null;
};

function normalizeGithubLogin(login: string) {
  return login.trim().replace(/^@+/, "").toLowerCase();
}

function mapPilotAccessRequestRow(row: PilotAccessRequestRow): PilotAccessRequestRecord {
  return {
    request_id: row.request_id,
    workspace_id: row.workspace_id,
    github_login: row.github_login,
    requested_name: row.requested_name,
    requested_email: row.requested_email ?? undefined,
    note: row.note ?? undefined,
    status: row.status,
    reviewed_by:
      row.reviewed_by_actor_type && row.reviewed_by_actor_id
        ? {
            actor_type: row.reviewed_by_actor_type,
            actor_id: row.reviewed_by_actor_id,
          }
        : undefined,
    reviewed_at: row.reviewed_at ?? undefined,
    decision_reason: row.decision_reason ?? undefined,
    approved_membership_id: row.approved_membership_id ?? undefined,
    created_at: row.created_at,
  };
}

function mapWorkspaceMembershipRow(row: WorkspaceMemberRow): WorkspaceMembershipRecord {
  return {
    membership_id: row.membership_id,
    workspace_id: row.workspace_id,
    actor_id: row.actor_id,
    actor_type: row.actor_type,
    name: row.name,
    role: row.role,
    color: row.color,
    github_login: row.github_login ?? undefined,
    created_at: row.created_at,
  };
}

function makeMembershipActorId(githubLogin: string) {
  const base =
    githubLogin
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "pilot_member";

  return `${base}_${randomUUID().slice(0, 6)}`;
}

export async function createPilotAccessRequest(
  input: CreatePilotAccessRequestInput,
  options?: StoreOptions,
): Promise<PilotAccessRequestRecord> {
  const database = await getDatabase(options);
  const { dbPath } = resolveOptions(options);
  const githubLogin = normalizeGithubLogin(input.github_login);
  const existing = await database.query<PilotAccessRequestRow>(
    `SELECT
      request_id,
      workspace_id,
      github_login,
      requested_name,
      requested_email,
      note,
      status,
      reviewed_by_actor_type,
      reviewed_by_actor_id,
      reviewed_at,
      decision_reason,
      approved_membership_id,
      created_at
    FROM pilot_access_requests
    WHERE workspace_id = $1 AND github_login = $2 AND status = 'pending'
    ORDER BY created_at DESC
    LIMIT 1`,
    [input.workspace_id, githubLogin],
  );

  if (existing.rows[0]) {
    return mapPilotAccessRequestRow(existing.rows[0]);
  }

  const now = new Date().toISOString();
  const requestId = `pilot_request_${randomUUID()}`;
  const requestedName = input.requested_name?.trim() || githubLogin;

  await database.query(
    `INSERT INTO pilot_access_requests (
      request_id,
      workspace_id,
      github_login,
      requested_name,
      requested_email,
      note,
      status,
      reviewed_by_actor_type,
      reviewed_by_actor_id,
      reviewed_at,
      decision_reason,
      approved_membership_id,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NULL, NULL, NULL, NULL, NULL, $7)`,
    [
      requestId,
      input.workspace_id,
      githubLogin,
      requestedName,
      input.requested_email?.trim() || null,
      input.note?.trim() || null,
      now,
    ],
  );

  await persistSnapshot(database, dbPath);

  return {
    request_id: requestId,
    workspace_id: input.workspace_id,
    github_login: githubLogin,
    requested_name: requestedName,
    requested_email: input.requested_email?.trim() || undefined,
    note: input.note?.trim() || undefined,
    status: "pending",
    created_at: now,
  };
}

export async function listPilotAccessRequests(
  workspaceId: string,
  options?: ListPilotAccessRequestsOptions,
): Promise<PilotAccessRequestRecord[]> {
  const database = await getDatabase(options);
  const params: unknown[] = [workspaceId];
  const where = ["workspace_id = $1"];

  if (options?.status) {
    params.push(options.status);
    where.push(`status = $${params.length}`);
  }

  let limitClause = "";
  if (typeof options?.limit === "number" && Number.isFinite(options.limit) && options.limit > 0) {
    params.push(Math.floor(options.limit));
    limitClause = `LIMIT $${params.length}`;
  }

  const result = await database.query<PilotAccessRequestRow>(
    `SELECT
      request_id,
      workspace_id,
      github_login,
      requested_name,
      requested_email,
      note,
      status,
      reviewed_by_actor_type,
      reviewed_by_actor_id,
      reviewed_at,
      decision_reason,
      approved_membership_id,
      created_at
    FROM pilot_access_requests
    WHERE ${where.join(" AND ")}
    ORDER BY created_at DESC
    ${limitClause}`,
    params,
  );

  return result.rows.map(mapPilotAccessRequestRow);
}

export async function reviewPilotAccessRequest(
  input: ReviewPilotAccessRequestInput,
  options?: StoreOptions,
): Promise<ReviewPilotAccessRequestResult> {
  const database = await getDatabase(options);
  const { dbPath } = resolveOptions(options);
  const now = new Date().toISOString();

  const { request, membership } = await database.transaction(async (tx) => {
    const requestResult = await tx.query<PilotAccessRequestRow>(
      `SELECT
        request_id,
        workspace_id,
        github_login,
        requested_name,
        requested_email,
        note,
        status,
        reviewed_by_actor_type,
        reviewed_by_actor_id,
        reviewed_at,
        decision_reason,
        approved_membership_id,
        created_at
      FROM pilot_access_requests
      WHERE request_id = $1
      LIMIT 1`,
      [input.request_id],
    );

    const requestRow = requestResult.rows[0];

    if (!requestRow) {
      throw new Error(`Pilot access request ${input.request_id} not found`);
    }

    if (requestRow.status !== "pending") {
      throw new Error(`Pilot access request ${input.request_id} is already ${requestRow.status}`);
    }

    let membershipRow: WorkspaceMemberRow | null = null;
    let approvedMembershipId: string | null = null;

    if (input.decision === "approve") {
      const normalizedLogin = normalizeGithubLogin(requestRow.github_login);
      const existingMembership = await tx.query<WorkspaceMemberRow>(
        `SELECT
          membership_id,
          workspace_id,
          actor_id,
          actor_type,
          name,
          role,
          color,
          github_login,
          created_at
        FROM workspace_members
        WHERE workspace_id = $1 AND github_login = $2
        LIMIT 1`,
        [requestRow.workspace_id, normalizedLogin],
      );

      if (existingMembership.rows[0]) {
        membershipRow = existingMembership.rows[0];
        approvedMembershipId = membershipRow.membership_id;
      } else {
        const membershipId = `membership_${randomUUID()}`;
        const createdAt = now;
        const name = input.membership?.name?.trim() || requestRow.requested_name;
        const role = input.membership?.role?.trim() || "Pilot member";
        const color = input.membership?.color?.trim() || "#0ea5e9";
        const actorId = makeMembershipActorId(normalizedLogin);

        const createdMembership = await tx.query<WorkspaceMemberRow>(
          `INSERT INTO workspace_members (
            membership_id,
            workspace_id,
            actor_id,
            actor_type,
            name,
            role,
            color,
            github_login,
            created_at
          ) VALUES ($1, $2, $3, 'human', $4, $5, $6, $7, $8)
          RETURNING
            membership_id,
            workspace_id,
            actor_id,
            actor_type,
            name,
            role,
            color,
            github_login,
            created_at`,
          [
            membershipId,
            requestRow.workspace_id,
            actorId,
            name,
            role,
            color,
            normalizedLogin,
            createdAt,
          ],
        );

        membershipRow = createdMembership.rows[0] ?? null;
        approvedMembershipId = membershipRow?.membership_id ?? null;
      }
    }

    const reviewedRequest = await tx.query<PilotAccessRequestRow>(
      `UPDATE pilot_access_requests
      SET
        status = $2,
        reviewed_by_actor_type = $3,
        reviewed_by_actor_id = $4,
        reviewed_at = $5,
        decision_reason = $6,
        approved_membership_id = $7
      WHERE request_id = $1
      RETURNING
        request_id,
        workspace_id,
        github_login,
        requested_name,
        requested_email,
        note,
        status,
        reviewed_by_actor_type,
        reviewed_by_actor_id,
        reviewed_at,
        decision_reason,
        approved_membership_id,
        created_at`,
      [
        input.request_id,
        input.decision === "approve" ? "approved" : "rejected",
        input.reviewed_by.actor_type,
        input.reviewed_by.actor_id,
        now,
        input.decision_reason?.trim() || null,
        approvedMembershipId,
      ],
    );

    const reviewedRow = reviewedRequest.rows[0];

    if (!reviewedRow) {
      throw new Error(`Pilot access request ${input.request_id} not found`);
    }

    return {
      request: mapPilotAccessRequestRow(reviewedRow),
      membership: membershipRow ? mapWorkspaceMembershipRow(membershipRow) : null,
    };
  });

  await persistSnapshot(database, dbPath);

  return {
    request,
    membership,
  };
}
