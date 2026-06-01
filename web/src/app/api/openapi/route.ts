import { NextResponse } from "next/server";
import { openAPISpec } from "@/lib/api/openapi-spec";

export async function GET() {
  return NextResponse.json(openAPISpec, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}