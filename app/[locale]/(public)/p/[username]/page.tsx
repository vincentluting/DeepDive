// Public Profile Page — /p/{username}
// Linktree-style public card showing archetype, core insight, and social links

import { notFound } from 'next/navigation';
import { getPublicProfileByUsername } from '@/lib/db/profiles';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { getLocalizedField, pickLocaleText } from '@/lib/i18n/localize';
import { SCHWARTZ_VALUE_LABELS } from '@/lib/scoring/constants';
import { Linkedin, Github, Globe, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

const PLATFORM_ICONS: Record<string, typeof Linkedin> = {
  linkedin: Linkedin,
  github: Github,
  portfolio: Globe,
  twitter: ExternalLink,
  other: ExternalLink,
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  github: 'GitHub',
  portfolio: 'Portfolio',
  twitter: 'X / Twitter',
  other: 'Link',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, username } = await params;
  const data = await getPublicProfileByUsername(username);
  if (!data) return { title: 'Profile Not Found' };

  const loc = locale as 'en' | 'zh';
  const name = getLocalizedField(data.profileJson.archetype, 'label', loc);
  const tagline = getLocalizedField(data.profileJson.archetype, 'tagline', loc);

  return {
    title: `${name} — ${tagline}`,
    description: data.profileJson.narrativeSnapshots?.coreInsight || tagline,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { locale, username } = await params;
  const loc = locale as 'en' | 'zh';

  const data = await getPublicProfileByUsername(username);
  if (!data) notFound();

  const dict = await getDictionary(loc);
  const t = dict.profile;

  const { profileJson, socialLinks } = data;
  const archetypeName = getLocalizedField(profileJson.archetype, 'label', loc);
  const tagline = getLocalizedField(profileJson.archetype, 'tagline', loc);
  const coreInsight = profileJson.narrativeSnapshots?.coreInsight || '';

  // Top 3 Schwartz values
  const top3Labels = (profileJson.schwartzAnchors?.top3 ?? [])
    .slice(0, 3)
    .map(key => {
      const label = SCHWARTZ_VALUE_LABELS[key as keyof typeof SCHWARTZ_VALUE_LABELS];
      return label ? pickLocaleText(label, loc) : key;
    });

  // Collab style gradient
  const gradient = profileJson.collabMapping?.cssGradient;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Main card */}
        <div className="rounded-3xl border border-border/60 bg-card overflow-hidden shadow-lg">
          {/* Color bar from collab style */}
          {gradient && (
            <div className="h-2" style={{ background: gradient }} aria-hidden="true" />
          )}

          <div className="p-8 text-center">
            {/* Archetype identity */}
            <h1 className="text-2xl font-display font-bold text-foreground mb-1">
              {archetypeName}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">{tagline}</p>

            {/* Core insight */}
            {coreInsight && (
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 mb-6">
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  &ldquo;{coreInsight}&rdquo;
                </p>
              </div>
            )}

            {/* Values */}
            {top3Labels.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                {top3Labels.map((label, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium
                      bg-primary/10 text-primary border border-primary/20"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Social links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center justify-center gap-3 flex-wrap pt-4 border-t border-border/30">
                {socialLinks.map((link, i) => {
                  const Icon = PLATFORM_ICONS[link.platform] || ExternalLink;
                  const label = PLATFORM_LABELS[link.platform] || 'Link';
                  return (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                        bg-muted/50 hover:bg-muted text-foreground/80 hover:text-foreground
                        text-sm font-medium transition-colors group"
                      title={label}
                    >
                      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{label}</span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-muted/30 border-t border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground/50">
              {t.publicProfileFooter}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
