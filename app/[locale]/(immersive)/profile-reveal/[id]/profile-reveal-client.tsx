'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ARCHETYPES } from '@/lib/content';
import type { PersonalProfileData } from '@/lib/types';

const COLLAB_LABELS: Record<string, { en: string; zh: string }> = {
  D: { en: 'Leading', zh: '引领型' },
  I: { en: 'Inspiring', zh: '激发型' },
  S: { en: 'Anchoring', zh: '稳健型' },
  C: { en: 'Refining', zh: '精研型' },
};

interface ProfileRevealClientProps {
  profile: PersonalProfileData;
  userId: string;
  locale: string;
  dict: Record<string, string>;
}

export function ProfileRevealClient({ profile, userId, locale, dict: tp }: ProfileRevealClientProps) {
  const router = useRouter();

  // v3.0: No auto report generation — user explores profile first,
  // then manually triggers career report from the profile page.

  const archetypeCode = String(profile.archetype);
  const archetype = ARCHETYPES[archetypeCode];
  const archetypeLabel = locale === 'zh' ? archetype?.label_zh : archetype?.label_en;
  const archetypeTagline = locale === 'zh' ? archetype?.tagline_zh : archetype?.tagline_en;
  const archetypeColor = archetype?.colorHex || '#6366f1';

  const cognitiveLabel = profile.cognitiveStyleCode
    ? profile.cognitiveStyleCode
    : tp.cognitiveStyleBalancedLabel;

  const collabPrimary = profile.collabMapping?.primary;
  const collabLabel = collabPrimary
    ? (locale === 'zh' ? COLLAB_LABELS[collabPrimary]?.zh : COLLAB_LABELS[collabPrimary]?.en) || collabPrimary
    : null;

  const top3Values = profile.schwartzAnchors?.top3 || [];
  const valueDisplayNames = top3Values.map((v) => tp[v] || v);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50/30">
      <div className="mx-auto max-w-lg px-6 py-12 flex flex-col items-center min-h-screen justify-center">

        {/* Archetype reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: `${archetypeColor}15`, border: `3px solid ${archetypeColor}` }}
          >
            <span className="text-4xl font-bold" style={{ color: archetypeColor }}>
              {archetypeLabel?.charAt(0) || '?'}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{ backgroundColor: `${archetypeColor}15`, color: archetypeColor }}
          >
            {tp.archetypeBadge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-3xl font-bold tracking-tight mb-2"
            style={{ color: archetypeColor }}
          >
            {archetypeLabel}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-muted-foreground text-base max-w-xs mx-auto"
          >
            {archetypeTagline}
          </motion.p>
        </motion.div>

        {/* Key traits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="w-full space-y-3 mb-10"
        >
          {cognitiveLabel && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-sm border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 text-sm font-semibold">C</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.revealCognitiveStyle}</p>
                <p className="text-sm font-medium">{cognitiveLabel}</p>
              </div>
            </div>
          )}

          {collabLabel && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-sm border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 text-sm font-semibold">T</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.revealCollaborationStyle}</p>
                <p className="text-sm font-medium">{collabLabel}</p>
              </div>
            </div>
          )}

          {valueDisplayNames.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-sm border border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 text-sm font-semibold">V</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tp.revealCoreValues}</p>
                <p className="text-sm font-medium">{valueDisplayNames.join(' · ')}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* CTA Section — v3.0: Profile-first journey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => router.push(`/${locale}/profile/${userId}`)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-medium text-base shadow-md transition-all hover:shadow-lg"
            style={{ backgroundColor: archetypeColor }}
          >
            {tp.revealViewFullProfile}
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
