"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { debates, Debate } from "@/lib/debateStore";
import { useState, useEffect } from "react";

const bannedWords = ["stupid", "idiot", "dumb"];

// In-memory arguments and participation
const argumentsStore: {
  [debateId: string]: Array<{
    id: string;
    content: string;
    side: "support" | "oppose";
    author: string;
    timestamp: number;
    votes: number;
    upvoters: string[];
    downvoters: string[];
    edited: boolean;
  }>;
} = {};
const participation: { [debateId: string]: { [user: string]: "support" | "oppose" } } = {};

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}h ${m}m ${s}s`;
}

export default function DebateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const debate = debates.find((d) => d.id === id);
  const [side, setSide] = useState<"support" | "oppose" | null>(null);
  const [argument, setArgument] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [args, setArgs] = useState(argumentsStore[id as string] || []);
  const [winner, setWinner] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Participation
  useEffect(() => {
    if (session && session.user && session.user.email && participation[id as string]) {
      setSide(participation[id as string][session.user.email] || null);
    }
  }, [session, id]);

  if (!debate) return <div className="p-8 text-center">Debate not found.</div>;

  // Calculate end time
  const createdAt = parseInt(debate.id);
  const durationMs = debate.duration * 60 * 60 * 1000;
  const endsAt = createdAt + durationMs;
  const expired = now >= endsAt;
  const timeLeft = formatTime(endsAt - now);

  // Winner calculation
  useEffect(() => {
    if (expired && !winner) {
      const supportVotes = args.filter((a) => a.side === "support").reduce((sum, a) => sum + a.votes, 0);
      const opposeVotes = args.filter((a) => a.side === "oppose").reduce((sum, a) => sum + a.votes, 0);
      if (supportVotes > opposeVotes) setWinner("Support");
      else if (opposeVotes > supportVotes) setWinner("Oppose");
      else setWinner("Tie");
    }
  }, [expired, args, winner]);

  // Join side
  const handleJoin = (chosen: "support" | "oppose") => {
    if (!session || !session.user || !session.user.email) return;
    if (!participation[id as string]) participation[id as string] = {};
    participation[id as string][session.user.email] = chosen;
    setSide(chosen);
  };

  // Post argument
  const handlePost = () => {
    setError("");
    if (!argument.trim()) return setError("Argument cannot be empty.");
    if (bannedWords.some((w) => argument.toLowerCase().includes(w))) {
      return setError("Your argument contains inappropriate language.");
    }
    if (!session || !session.user || !session.user.email || !side) return;
    const newArg = {
      id: Date.now().toString(),
      content: argument,
      side,
      author: session.user.email,
      timestamp: Date.now(),
      votes: 0,
      upvoters: [],
      downvoters: [],
      edited: false,
    };
    if (!argumentsStore[id as string]) argumentsStore[id as string] = [];
    argumentsStore[id as string].push(newArg);
    setArgs([...argumentsStore[id as string]]);
    setArgument("");
  };

  // Vote
  const handleVote = (argId: string, type: "up" | "down") => {
    if (!session || !session.user || !session.user.email) return;
    const idx = args.findIndex((a) => a.id === argId);
    if (idx === -1) return;
    const arg = args[idx];
    const user = session.user.email;
    if (arg.upvoters.includes(user) || arg.downvoters.includes(user)) return;
    if (type === "up") {
      arg.votes += 1;
      arg.upvoters.push(user);
    } else {
      arg.votes -= 1;
      arg.downvoters.push(user);
    }
    setArgs([...args]);
  };

  // Edit/delete (within 5 min)
  const canEdit = (arg: any) => session && session.user && session.user.email === arg.author && now - arg.timestamp < 5 * 60 * 1000;
  const handleEdit = (argId: string, newContent: string) => {
    const idx = args.findIndex((a) => a.id === argId);
    if (idx === -1) return;
    args[idx].content = newContent;
    args[idx].edited = true;
    setArgs([...args]);
  };
  const handleDelete = (argId: string) => {
    const idx = args.findIndex((a) => a.id === argId);
    if (idx === -1) return;
    args.splice(idx, 1);
    setArgs([...args]);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{debate.title}</h1>
      <p className="mb-2 text-gray-700">{debate.description}</p>
      {debate.image && <img src={debate.image} alt="Debate banner" className="w-full max-h-40 object-cover rounded mb-2" />}
      <div className="mb-2 flex gap-2 flex-wrap">
        {debate.tags.map((tag) => (
          <span key={tag} className="bg-gray-200 text-xs px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <div className="mb-2 text-sm text-gray-500">Category: {debate.category}</div>
      <div className="mb-2 text-sm text-gray-500">Duration: {debate.duration} hour(s)</div>
      <div className="mb-2 text-sm text-gray-500">Created by: {debate.creator}</div>
      <div className="mb-4 text-lg font-semibold">Time left: {expired ? "Debate closed" : timeLeft}</div>
      {winner && <div className="mb-4 text-xl font-bold text-green-600">Winner: {winner}</div>}
      {session && !side && !expired && (
        <div className="mb-4 flex gap-4">
          <button onClick={() => handleJoin("support")} className="bg-green-600 text-white px-4 py-2 rounded">Join as Support</button>
          <button onClick={() => handleJoin("oppose")} className="bg-red-600 text-white px-4 py-2 rounded">Join as Oppose</button>
        </div>
      )}
      {side && <div className="mb-4">You joined: <span className={side === "support" ? "text-green-600" : "text-red-600"}>{side.charAt(0).toUpperCase() + side.slice(1)}</span></div>}
      {session && side && !expired && (
        <div className="mb-4">
          <textarea
            value={argument}
            onChange={(e) => setArgument(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
            placeholder="Write your argument..."
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button onClick={handlePost} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Post Argument</button>
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Arguments</h2>
        <div className="flex gap-8 flex-wrap">
          <div className="w-full md:w-1/2">
            <h3 className="font-semibold mb-4 text-green-700 text-lg">Support</h3>
            {args.filter((a) => a.side === "support").length === 0 && <p className="text-gray-400">No arguments yet.</p>}
            {args.filter((a) => a.side === "support").map((arg) => (
              <div key={arg.id} className="rounded-xl bg-white shadow-md p-4 mb-4 border border-green-100">
                <div className="text-xs text-gray-500 mb-2">By: <span className="font-semibold text-green-700">{arg.author}</span> | {new Date(arg.timestamp).toLocaleString()} {arg.edited && <span>(edited)</span>}</div>
                <div className="mb-3 text-base text-gray-800">{arg.content}</div>
                <div className="flex gap-3 items-center mt-2">
                  <span className={
                    arg.votes > 0 ? "font-semibold text-green-700" : arg.votes < 0 ? "font-semibold text-red-700" : "font-semibold text-gray-700"
                  }>Votes: {arg.votes}</span>
                  {!expired && (session && session.user && session.user.email ? session.user.email : "") !== arg.author && !arg.upvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && !arg.downvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <>
                      <button onClick={() => handleVote(arg.id, "up")} className="bg-gradient-to-r from-green-400 to-green-600 text-white px-3 py-1 rounded-full font-semibold shadow hover:from-green-500 hover:to-green-700 transition flex items-center gap-1">
                        <span role="img" aria-label="Upvote">👍</span> Upvote
                      </button>
                      <button onClick={() => handleVote(arg.id, "down")} className="bg-gradient-to-r from-pink-400 to-red-600 text-white px-3 py-1 rounded-full font-semibold shadow hover:from-pink-500 hover:to-red-700 transition flex items-center gap-1">
                        <span role="img" aria-label="Downvote">👎</span> Downvote
                      </button>
                    </>
                  )}
                  {!expired && arg.upvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <span className="text-green-600 flex items-center gap-1"><svg width="18" height="18" fill="currentColor" className="inline"><path d="M6.5 13.5l-4-4 1.41-1.41L6.5 10.67l7.09-7.09L15 4.5z"/></svg>Upvoted</span>
                  )}
                  {!expired && arg.downvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <span className="text-red-600 flex items-center gap-1"><svg width="18" height="18" fill="currentColor" className="inline"><path d="M6.5 13.5l-4-4 1.41-1.41L6.5 10.67l7.09-7.09L15 4.5z"/></svg>Downvoted</span>
                  )}
                  {canEdit(arg) && !expired && (
                    <button onClick={() => handleEdit(arg.id, prompt("Edit argument:", arg.content) || arg.content)} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold hover:bg-yellow-200 transition">Edit</button>
                  )}
                  {canEdit(arg) && !expired && (
                    <button onClick={() => handleDelete(arg.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold hover:bg-red-200 transition">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full md:w-1/2">
            <h3 className="font-semibold mb-4 text-red-700 text-lg">Oppose</h3>
            {args.filter((a) => a.side === "oppose").length === 0 && <p className="text-gray-400">No arguments yet.</p>}
            {args.filter((a) => a.side === "oppose").map((arg) => (
              <div key={arg.id} className="rounded-xl bg-white shadow-md p-4 mb-4 border border-red-100">
                <div className="text-xs text-gray-500 mb-2">By: <span className="font-semibold text-red-700">{arg.author}</span> | {new Date(arg.timestamp).toLocaleString()} {arg.edited && <span>(edited)</span>}</div>
                <div className="mb-3 text-base text-gray-800">{arg.content}</div>
                <div className="flex gap-3 items-center mt-2">
                  <span className={
                    arg.votes > 0 ? "font-semibold text-green-700" : arg.votes < 0 ? "font-semibold text-red-700" : "font-semibold text-gray-700"
                  }>Votes: {arg.votes}</span>
                  {!expired && (session && session.user && session.user.email ? session.user.email : "") !== arg.author && !arg.upvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && !arg.downvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <>
                      <button onClick={() => handleVote(arg.id, "up")} className="bg-gradient-to-r from-green-400 to-green-600 text-white px-3 py-1 rounded-full font-semibold shadow hover:from-green-500 hover:to-green-700 transition flex items-center gap-1">
                        <span role="img" aria-label="Upvote">👍</span> Upvote
                      </button>
                      <button onClick={() => handleVote(arg.id, "down")} className="bg-gradient-to-r from-pink-400 to-red-600 text-white px-3 py-1 rounded-full font-semibold shadow hover:from-pink-500 hover:to-red-700 transition flex items-center gap-1">
                        <span role="img" aria-label="Downvote">👎</span> Downvote
                      </button>
                    </>
                  )}
                  {!expired && arg.upvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <span className="text-green-600 flex items-center gap-1"><svg width="18" height="18" fill="currentColor" className="inline"><path d="M6.5 13.5l-4-4 1.41-1.41L6.5 10.67l7.09-7.09L15 4.5z"/></svg>Upvoted</span>
                  )}
                  {!expired && arg.downvoters.includes((session && session.user && session.user.email ? session.user.email : "")) && (
                    <span className="text-red-600 flex items-center gap-1"><svg width="18" height="18" fill="currentColor" className="inline"><path d="M6.5 13.5l-4-4 1.41-1.41L6.5 10.67l7.09-7.09L15 4.5z"/></svg>Downvoted</span>
                  )}
                  {canEdit(arg) && !expired && (
                    <button onClick={() => handleEdit(arg.id, prompt("Edit argument:", arg.content) || arg.content)} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold hover:bg-yellow-200 transition">Edit</button>
                  )}
                  {canEdit(arg) && !expired && (
                    <button onClick={() => handleDelete(arg.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold hover:bg-red-200 transition">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 