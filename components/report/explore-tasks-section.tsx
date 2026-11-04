'use client'

import type { Locale } from "@/lib/i18n/config";
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Compass,
  PartyPopper,
  ArrowRight,
} from 'lucide-react'
import {
  generateExploreTasks,
  renderTaskDescription,
  loadExploreTaskStates,
  saveExploreTaskStates,
  type ExploreTask,
} from '@/lib/content/explore-tasks-templates'

interface ExploreTasksSectionProps {
  directionRank: number
  directionTitle: string
  reportId: string
  locale: Locale
  t: Record<string, string>
  totalDirections: number
  onNavigateNext?: () => void
}

export function ExploreTasksSection({
  directionRank,
  directionTitle,
  reportId,
  locale,
  t,
  totalDirections,
  onNavigateNext,
}: ExploreTasksSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({})
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)

  const tasks = generateExploreTasks(directionRank, directionTitle)

  useEffect(() => {
    setTaskStates(loadExploreTaskStates(reportId))
  }, [reportId])

  const toggleTask = useCallback(
    (taskId: string) => {
      setTaskStates((prev) => {
        const next = { ...prev, [taskId]: !prev[taskId] }
        saveExploreTaskStates(reportId, next)
        return next
      })
    },
    [reportId],
  )

  const handleCopyKeyword = async (taskId: string) => {
    try {
      await navigator.clipboard.writeText(directionTitle)
      setCopiedTaskId(taskId)
      setTimeout(() => setCopiedTaskId(null), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = directionTitle
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedTaskId(taskId)
      setTimeout(() => setCopiedTaskId(null), 2000)
    }
  }

  const completedCount = tasks.filter((task) => taskStates[task.id]).length
  const allCompleted = completedCount === tasks.length
  const hasNextDirection = directionRank < totalDirections

  return (
    <div className="mt-3 border-t border-border/50 pt-3">
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between h-auto py-2 px-2 text-sm hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="flex items-center gap-2 text-muted-foreground/80">
          <Compass className="h-4 w-4 text-primary" />
          {t.exploreTasks}
          {completedCount > 0 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {completedCount}/{tasks.length}
            </Badge>
          )}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {/* Task list */}
      {isExpanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {tasks.map((task) => (
            <ExploreTaskItem
              key={task.id}
              task={task}
              checked={!!taskStates[task.id]}
              onToggle={() => toggleTask(task.id)}
              onCopyKeyword={() => handleCopyKeyword(task.id)}
              isCopied={copiedTaskId === task.id}
              locale={locale}
              t={t}
            />
          ))}

          {/* Encouragement & next direction */}
          {allCompleted && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg mt-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-1">
                <PartyPopper className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  {t.exploreTasksComplete}
                </p>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                {t.exploreTasksCompleteDesc}
              </p>
              {hasNextDirection && onNavigateNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 ml-4 text-xs text-primary hover:text-primary/80"
                  onClick={onNavigateNext}
                >
                  {t.exploreNextDirection}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExploreTaskItem({
  task,
  checked,
  onToggle,
  onCopyKeyword,
  isCopied,
  locale: _locale,
  t,
}: {
  task: ExploreTask
  checked: boolean
  onToggle: () => void
  onCopyKeyword: () => void
  isCopied: boolean
  locale: Locale
  t: Record<string, string>
}) {
  const description = renderTaskDescription(task.templateKey, task.keyword, t)

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        checked
          ? 'bg-primary/5 border-primary/20'
          : 'bg-transparent border-border hover:bg-muted/30'
      }`}
    >
      <label className="flex items-start gap-3 flex-1 cursor-pointer min-w-0">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <p
          className={`text-sm leading-relaxed ${
            checked
              ? 'line-through text-muted-foreground/60'
              : 'text-foreground'
          }`}
        >
          {description}
        </p>
      </label>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 shrink-0 text-xs text-muted-foreground hover:text-foreground"
        onClick={onCopyKeyword}
      >
        {isCopied ? (
          <>
            <Check className="h-3 w-3 mr-1" />
            {t.copied}
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            {t.copyKeyword}
          </>
        )}
      </Button>
    </div>
  )
}
