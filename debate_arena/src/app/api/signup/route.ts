import { NextRequest, NextResponse } from "next/server";
import { users, User } from "@/lib/userStore";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    // Check if user already exists
    const existing = users.find((u) => u.email === email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Create user
    const user: User = { id: uuidv4(), name, email, password: hashed };
    users.push(user);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 