// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import * as z from "zod";
import { SignJWT } from "jose";

// Zod schema for request validation
const userSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    // ✅ Check secret at runtime, not top-level
    const secretStr = process.env.JWT_SECRET;
    if (!secretStr) {
      console.error("JWT_SECRET missing in environment");
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
    const secret = new TextEncoder().encode(secretStr);

    // Parse request body
    const body = await req.json();
    const { email, password } = userSchema.parse(body);

    // Find user in DB
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT payload
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Sign JWT
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // Remove passwordHash from response
    const { passwordHash, ...userWithoutPassword } = user;

    // Send response with cookie
    const res = NextResponse.json({ user: userWithoutPassword }, { status: 200 });
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return res;

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
