"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-900 shadow">
      <Link href="/" className="text-xl font-bold">Debate Arena</Link>
      <nav className="flex gap-4 items-center">
        <Link href="/">Home</Link>
        {!session && <Link href="/login">Login</Link>}
        {!session && <Link href="/signup">Sign Up</Link>}
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
} 