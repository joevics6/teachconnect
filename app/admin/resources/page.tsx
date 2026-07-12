"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { AdminShell } from "@/components/admin/AdminShell"

interface ResourcePost {
  id: string
  title: string
  slug: string
  category: string
  resource_type: string
  is_published: boolean
  created_at: string
}

export default function AdminResourcesPage() {
  const [posts, setPosts] = useState<ResourcePost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    fetch("/api/admin/resources")
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        setPosts(data.posts || [])
      })
      .catch((err) => console.error("Failed to load resources:", err))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const togglePublish = async (post: ResourcePost) => {
    setBusyId(post.id)
    try {
      const res = await fetch(`/api/admin/resources/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !post.is_published }),
      })
      if (res.ok) {
        setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, is_published: !p.is_published } : p))
      }
    } catch (err) {
      console.error("Toggle publish failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (post: ResourcePost) => {
    if (!confirm(`Delete "${post.title}"? This can't be undone.`)) return
    setBusyId(post.id)
    try {
      const res = await fetch(`/api/admin/resources/${post.id}`, { method: "DELETE" })
      if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== post.id))
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Resources</h1>
          <Link
            href="/admin/resources/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="h-4 w-4" />New Resource
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 text-green-600 animate-spin" /></div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500 text-sm">
            No resources yet. Create your first one.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{post.title}</td>
                    <td className="px-4 py-3 text-gray-600">{post.category}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{post.resource_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        post.is_published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {post.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(post.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={busyId === post.id}
                          onClick={() => togglePublish(post)}
                          title={post.is_published ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                        >
                          {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-green-600" />}
                        </button>
                        <Link href={`/admin/resources/${post.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 inline-block">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          disabled={busyId === post.id}
                          onClick={() => handleDelete(post)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-red-500 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  )
}
