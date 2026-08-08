// ============================================================
// lib/quiz-timer.ts
//
// Server-authoritative quiz timing, shared by both quiz systems
// (job-application quizzes and the specialization quiz). Fixes two
// things at once:
//   1. A teacher can no longer just report whatever "time taken"
//      they want at submission — it's computed from a timestamp
//      recorded server-side the moment they actually started.
//   2. Refreshing the quiz page doesn't reset the timer — the first
//      GET for a given (teacher, quiz) pair is the one that counts.
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"

export type QuizContextType = "job" | "specialization"

/** Call from the GET route that serves quiz questions. Returns the
 *  authoritative start time — reuses an existing one if the teacher
 *  already started this exact quiz (e.g. refreshed the page). */
export async function getOrCreateQuizStart(
  supabase: SupabaseClient,
  teacherId: string,
  contextType: QuizContextType,
  contextKey: string
): Promise<string> {
  const { data: existing } = await supabase
    .from("quiz_starts")
    .select("started_at")
    .eq("teacher_id", teacherId)
    .eq("context_type", contextType)
    .eq("context_key", contextKey)
    .maybeSingle()

  if (existing?.started_at) return existing.started_at

  const startedAt = new Date().toISOString()
  const { error } = await supabase
    .from("quiz_starts")
    .insert({ teacher_id: teacherId, context_type: contextType, context_key: contextKey, started_at: startedAt })

  if (error) {
    // Race: two near-simultaneous GETs both tried to insert. Whoever
    // lost the unique-constraint race just reads back the winner's row.
    const { data: raceWinner } = await supabase
      .from("quiz_starts")
      .select("started_at")
      .eq("teacher_id", teacherId)
      .eq("context_type", contextType)
      .eq("context_key", contextKey)
      .maybeSingle()
    if (raceWinner?.started_at) return raceWinner.started_at
    console.error("getOrCreateQuizStart insert error:", error)
  }

  return startedAt
}

/** Call from the submission route. Returns real elapsed seconds since
 *  the server-recorded start — falls back to the client-reported value
 *  only if no start record exists (e.g. pre-migration in-flight quiz). */
export async function getServerElapsedSeconds(
  supabase: SupabaseClient,
  teacherId: string,
  contextType: QuizContextType,
  contextKey: string,
  fallbackSeconds: number
): Promise<number> {
  const { data } = await supabase
    .from("quiz_starts")
    .select("started_at")
    .eq("teacher_id", teacherId)
    .eq("context_type", contextType)
    .eq("context_key", contextKey)
    .maybeSingle()

  if (!data?.started_at) return fallbackSeconds

  return Math.max(0, Math.round((Date.now() - new Date(data.started_at).getTime()) / 1000))
}
