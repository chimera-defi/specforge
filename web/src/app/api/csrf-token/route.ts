import { NextResponse } from "next/server";
import { generateSignedCSRFToken } from "@/lib/csrf";

export async function GET(_request: Request) {
  const token = generateSignedCSRFToken();
  
  return NextResponse.json({ 
    token,
    message: 'Use this token in the x-csrf-token header for state-changing operations'
  });
}