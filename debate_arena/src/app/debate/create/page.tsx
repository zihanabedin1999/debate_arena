"use client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { debates } from "../../../lib/debateStore";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  tags: z.string(),
  category: z.string().min(2),
  image: z.string().url().optional().or(z.literal("")),
  duration: z.enum(["1", "12", "24"]),
});

type FormData = z.infer<typeof schema>;

export default function CreateDebatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  if (!session) {
    return <div className="p-8 text-center">You must be logged in to create a debate.</div>;
  }

  const onSubmit = (data: FormData) => {
    setError("");
    try {
      debates.push({
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
        category: data.category,
        image: data.image,
        duration: parseInt(data.duration),
        creator: session.user?.email || "",
      });
      router.push("/home");
    } catch (e) {
      setError("Failed to create debate.");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Create a Debate</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input {...register("title")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea {...register("description")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
        </div>
        <hr className="my-4" />
        <div>
          <h2 className="font-semibold mb-2 text-purple-700">Tags</h2>
          <label className="block mb-1 font-medium">Tags <span className="text-xs text-gray-500">(comma separated)</span></label>
          <input {...register("tags")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>}
        </div>
        <hr className="my-4" />
        <div>
          <h2 className="font-semibold mb-2 text-purple-700">Category</h2>
          <label className="block mb-1 font-medium">Category</label>
          <input {...register("category")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>
        <hr className="my-4" />
        <div>
          <h2 className="font-semibold mb-2 text-purple-700">Debate Duration</h2>
          <label className="block mb-1 font-medium">Debate Duration</label>
          <select {...register("duration")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring">
            <option value="1">1 hour</option>
            <option value="12">12 hours</option>
            <option value="24">24 hours</option>
          </select>
          {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
        </div>
        <div>
          <label className="block mb-1 font-medium">Image URL (optional)</label>
          <input {...register("image")}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring"
          />
          {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>}
        </div>
        {error && <p className="text-red-600 text-center">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Debate"}
        </button>
      </form>
    </div>
  );
} 