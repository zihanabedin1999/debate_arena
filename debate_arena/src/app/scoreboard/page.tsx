"use client";
import { useState } from "react";
import { debates, Debate } from "../../../lib/debateStore";

// Import argumentsStore from the debate detail page file
// (In a real app, this would be a shared module or API)
const argumentsStore: {
  [debateId: string]: Array<{
    id: string;
    content: string;
    side: "support" | "oppose";
    author: string;
    timestamp: number;
    votes: number;
    voters: string[];
    edited: boolean;
  }>;
} = (typeof window !== "undefined" && (window as any).argumentsStore) || {};

const getAllArguments = () =>
  Object.values(argumentsStore).flat();

const getUserStats = (filter: "all" | "week" | "month") => {
  const now = Date.now();
  let minTime = 0;
  if (filter === "week") minTime = now - 7 * 24 * 60 * 60 * 1000;
  if (filter === "month") minTime = now - 30 * 24 * 60 * 60 * 1000;
  const args = getAllArguments().filter((a) => a.timestamp >= minTime);
  const userMap: Record<string, { votes: number; debates: Set<string> }> = {};
  args.forEach((a) => {
    if (!userMap[a.author]) userMap[a.author] = { votes: 0, debates: new Set() };
    userMap[a.author].votes += a.votes;
    userMap[a.author].debates.add(a.debateId || "");
  });
  return Object.entries(userMap).map(([user, stats]) => ({
    user,
    votes: stats.votes,
    debates: stats.debates.size,
  }));
};

export default function ScoreboardPage() {
  const [filter, setFilter] = useState<"all" | "week" | "month">("all");
  const stats = getUserStats(filter).sort((a, b) => b.votes - a.votes);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboard</h1>
      <div className="flex justify-center gap-4 mb-6">
        <button className={`btn px-4 py-2 ${filter === "week" ? "ring-2 ring-purple-400" : ""}`} onClick={() => setFilter("week")}>Weekly</button>
        <button className={`btn px-4 py-2 ${filter === "month" ? "ring-2 ring-purple-400" : ""}`} onClick={() => setFilter("month")}>Monthly</button>
        <button className={`btn px-4 py-2 ${filter === "all" ? "ring-2 ring-purple-400" : ""}`} onClick={() => setFilter("all")}>All Time</button>
      </div>
      <table className="w-full bg-white rounded-xl shadow-md overflow-hidden">
        <thead className="bg-purple-100">
          <tr>
            <th className="py-2 px-4 text-left">Username</th>
            <th className="py-2 px-4 text-left">Total Votes</th>
            <th className="py-2 px-4 text-left">Debates Participated</th>
          </tr>
        </thead>
        <tbody>
          {stats.length === 0 ? (
            <tr><td colSpan={3} className="text-center py-6 text-gray-500">No data yet.</td></tr>
          ) : (
            stats.map((row) => (
              <tr key={row.user} className="border-b last:border-b-0">
                <td className="py-2 px-4 font-semibold">{row.user}</td>
                <td className="py-2 px-4">{row.votes}</td>
                <td className="py-2 px-4">{row.debates}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 