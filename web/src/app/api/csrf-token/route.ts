import { NextResponse } from "next/server";
import { generateSignedCSRFToken } from "@/lib/csrf";
import { withErrorHandling } from "@/lib/api-error-handler";

export async function GET(_request: Request) {
  return withErrorHandling(
    async () => {
      const token = generateSignedCSRFToken();
      
      return NextResponse.json({ 
        token,
        message: 'Use this token in the x-csrf-token header for state-changing operations'
      });
    },
    { action: "generate_csrf_token" }
  );
}