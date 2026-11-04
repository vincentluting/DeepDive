"use client"

import { useState } from "react"
import Link from "next/link"
import { Compass, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ReportCard } from "@/components/features/report-card"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"

interface Report {
  id: string
  summary: string
  summaryZh?: string
  createdAt: string
  reportType?: 'deep' | 'quick'
}

interface ReportsListProps {
  initialReports: Report[]
  locale?: string
}

export function ReportsList({ initialReports, locale = "en" }: ReportsListProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)

  const handleDelete = (id: string) => {
    setReports((prev) => prev.filter((report) => report.id !== id))
  }

  const t = getDictionaryClient(locale as "en" | "zh").reportsList

  if (reports.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-semibold mb-2 text-foreground">{t.noReports}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t.startJourney}</p>
        <Button asChild className="gap-2 rounded-full shadow-lg shadow-primary/20">
          <Link href={`/${locale}/deepdive`}>
            {t.beginDive}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-3"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {reports.map((report, index) => (
        <motion.div
          key={report.id}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
          }}
        >
          <ReportCard
            report={report}
            index={index}
            totalReports={reports.length}
            onDelete={handleDelete}
            locale={locale}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
