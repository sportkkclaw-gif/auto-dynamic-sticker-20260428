import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  encodeDemoToken,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required." },
        { status: 400 }
      );
    }

    const result = await verifyCredentials(email, password);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        },
      },
      { status: 200 }
    );

    // Set HttpOnly cookie (secure + sameSite in production)
    response.cookies.set("auth_token", encodeDemoToken(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err) {
    console.error("[login] unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
