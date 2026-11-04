"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"

interface DepthLayerFooterProps {
  currentDepth: 'quick' | 'deep'
  locale: 'en' | 'zh'
}

type NodeState = 'completed' | 'current' | 'future'
type NodeKey = 'quick' | 'deep' | 'ultra'

interface DepthNode {
  key: NodeKey
  nameKey: string
  descKey: string
}

const NODES: DepthNode[] = [
  { key: 'quick', nameKey: 'depthNodeNameQuick', descKey: 'depthNodeDescQuick' },
  { key: 'deep', nameKey: 'depthNodeNameDeep', descKey: 'depthNodeDescDeep' },
  { key: 'ultra', nameKey: 'depthNodeNameUltra', descKey: 'depthNodeDescUltra' },
]

function getNodeState(nodeKey: NodeKey, currentDepth: 'quick' | 'deep'): NodeState {
  const order: NodeKey[] = ['quick', 'deep', 'ultra']
  const currentIdx = order.indexOf(currentDepth)
  const nodeIdx = order.indexOf(nodeKey)
  if (nodeIdx < currentIdx) return 'completed'
  if (nodeIdx === currentIdx) return 'current'
  return 'future'
}

export function DepthLayerFooter({ currentDepth, locale }: DepthLayerFooterProps) {
  const t = getDictionaryClient(locale).reportPanels

  const copy = currentDepth === 'quick' ? t.depthCopyQuick : t.depthCopyDeep

  const ctaText = t.startDeepDive
  const ctaLink = `/${locale}/deepdive`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto py-10 px-6 mt-10"
      style={{
        background: 'var(--report-card-bg)',
        borderTop: '1px solid var(--report-card-border)',
      }}
    >
      {/* Three-node horizontal progression */}
      <div className="relative flex items-start justify-between">
        {/* Connecting line spanning from node 1 center to node 3 center */}
        <div
          className="absolute"
          style={{
            top: 11,
            left: '16.67%',
            right: '16.67%',
            height: 1,
            background: 'var(--report-card-border)',
            opacity: 0.2,
          }}
        />

        {NODES.map((node) => {
          const state = getNodeState(node.key, currentDepth)
          const isFuture = state === 'future'
          const isCompleted = state === 'completed'
          const isUltra = node.key === 'ultra'

          const circleStyle: React.CSSProperties = {
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: isFuture ? 'var(--report-card-border)' : 'var(--module-explore)',
            background: isFuture ? 'var(--report-card-bg)' : 'var(--module-explore)',
            opacity: isFuture ? 0.25 : isCompleted ? 0.5 : 1,
            position: 'relative',
            zIndex: 1,
          }

          const textOpacity = isFuture ? 0.25 : isCompleted ? 0.5 : 1

          return (
            <div key={node.key} className="flex flex-col items-center gap-2 flex-1">
              <div style={circleStyle} />
              <div className="text-center px-1" style={{ opacity: textOpacity }}>
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{ color: 'var(--report-text-primary)' }}
                >
                  {t[node.nameKey]}
                </p>
                <p
                  className="text-[10px] mt-0.5 leading-tight"
                  style={{ color: 'var(--report-text-secondary)' }}
                >
                  {t[node.descKey]}
                </p>
                {isUltra && (
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: 'var(--module-explore)', opacity: 0.6 }}
                  >
                    {t.comingSoon}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Copy + optional CTA */}
      <div className="mt-8 text-center">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--report-text-secondary)' }}>
          {copy}
        </p>
        {currentDepth === 'quick' && (
          <Link
            href={ctaLink}
            className="inline-block mt-4 px-5 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: 'var(--module-explore)',
              color: '#fff',
            }}
          >
            {ctaText}
          </Link>
        )}
      </div>
    </motion.div>
  )
}
