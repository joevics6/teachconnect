import { ChevronDown, ListChecks, Wrench } from "lucide-react"
import type { ReactNode } from "react"

// Native <details> on purpose: the text is in the server-rendered HTML
// (so search engines read it) while staying collapsed for visitors,
// and it needs no client JavaScript.
function Accordion({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200">
      <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
        <h2 className="font-bold text-gray-900 text-base">{title}</h2>
        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{children}</div>
    </details>
  )
}

export interface JobSeoSectionsProps {
  responsibilities?: string[] | null
  skills?: string[] | null
  aboutRole?: string | null
  whoApply?: string | null
  standout?: string | null
}

export function JobSeoSections({ responsibilities, skills, aboutRole, whoApply, standout }: JobSeoSectionsProps) {
  const hasResp = !!responsibilities?.length
  const hasSkills = !!skills?.length
  if (!hasResp && !hasSkills && !aboutRole && !whoApply && !standout) return null

  return (
    <>
      {(hasResp || hasSkills) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {hasResp && (
            <>
              <h2 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-ink-500" />
                Key Responsibilities
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600 leading-relaxed">
                {responsibilities!.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </>
          )}
          {hasSkills && (
            <div className={hasResp ? "mt-6" : ""}>
              <h2 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-ink-500" />
                Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills!.map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {aboutRole && <Accordion title="About This Role"><p>{aboutRole}</p></Accordion>}
      {whoApply && <Accordion title="Who Should Apply"><p>{whoApply}</p></Accordion>}
      {standout && <Accordion title="How to Stand Out When Applying"><p>{standout}</p></Accordion>}
    </>
  )
}
