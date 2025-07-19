"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { debates, Debate } from "@/lib/debateStore";
import { useState } from "react";

// Helper to get unique tags and categories
const getUnique = (arr: Debate[], key: keyof Debate) => {
  const set = new Set<string>();
  arr.forEach((d) => {
    if (key === "tags") d.tags.forEach((t) => set.add(t));
    else set.add((d[key] as string) || "");
  });
  return Array.from(set).filter(Boolean);
};

export default function HomePage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");

  const uniqueTags = getUnique(debates, "tags");
  const uniqueCategories = getUnique(debates, "category");

  const filteredDebates = debates.filter((debate) => {
    const matchesSearch =
      debate.title.toLowerCase().includes(search.toLowerCase()) ||
      debate.description.toLowerCase().includes(search.toLowerCase()) ||
      debate.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
      debate.category.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !tag || debate.tags.includes(tag);
    const matchesCategory = !category || debate.category === category;
    const matchesDuration = !duration || debate.duration === parseInt(duration);
    return matchesSearch && matchesTag && matchesCategory && matchesDuration;
  });

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col items-center min-h-[80vh]">
      <h1 className="text-4xl font-extrabold mb-6 text-center tracking-tight">Community Debate Arena</h1>
      {session ? (
        <div className="flex flex-col items-center w-full mb-8">
          <Link href="/debate/create" className="btn text-lg px-8 py-3 mb-6 shadow-lg">Create Debate</Link>
        </div>
      ) : (
        <div className="mb-6 text-center text-gray-600 dark:text-gray-300">
          <p>Please <Link href="/login" className="underline">login</Link> or <Link href="/signup" className="underline">sign up</Link> to create or join debates.</p>
        </div>
      )}
      <div className="w-full max-w-xl mb-8 space-y-4">
        <input
          type="text"
          placeholder="Search debates by title, tag, or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-5 py-3 border border-gray-300 rounded-full shadow focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition"
        />
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium mb-1">Tag</label>
            <select value={tag} onChange={e => setTag(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">All</option>
              {uniqueTags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">All</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-sm font-medium mb-1">Duration</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2 border rounded">
              <option value="">All</option>
              <option value="1">1 hour</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>
        </div>
      </div>
      <div className="w-full">
        {filteredDebates.length === 0 ? (
          <div className="text-center text-gray-500 text-lg">No debates yet. Be the first to create one!</div>
        ) : (
          <ul className="space-y-6">
            {filteredDebates.map((debate: Debate) => (
              <li key={debate.id} className="card transition hover:shadow-xl border-0">
                <h2 className="text-2xl font-bold mb-2">{debate.title}</h2>
                <p className="text-gray-600 mb-2 text-lg">{debate.description}</p>
                {debate.image && (
                  <img src={debate.image} alt="Debate banner" className="w-full max-h-40 object-cover rounded mb-2" />
                )}
                <div className="mt-2 flex gap-2 flex-wrap">
                  {debate.tags.map((tag: string) => (
                    <span key={tag} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">Category: {debate.category}</div>
                <div className="mt-1 text-sm text-gray-500">Duration: {debate.duration} hour(s)</div>
                <div className="mt-1 text-sm text-gray-500">Created by: {debate.creator}</div>
                <Link href={`/debate/${debate.id}`} className="btn mt-4 inline-block px-6 py-2 text-base">View / Join Debate</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 