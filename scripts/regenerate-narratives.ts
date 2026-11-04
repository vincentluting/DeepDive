/**
 * Regenerate identity narratives for an existing profile.
 * Usage: npx tsx scripts/regenerate-narratives.ts [assessmentId] [locale] [--anthropic]
 * Default: latest assessment, zh, uses Groq
 */
import { config } from 'dotenv';
config({ path: '.env.local', override: true });

// Default: use Groq (free). Pass --anthropic flag to force Anthropic.
const useAnthropic = process.argv.includes('--anthropic');
if (!useAnthropic) {
  process.env.E2E_USE_GROQ = 'true';
} else {
  process.env.E2E_USE_GROQ = 'false';
}

console.log('=== Regenerate Identity Narratives ===');
console.log('Provider:', useAnthropic ? 'Anthropic (Claude Sonnet)' : 'Groq (Llama)');

async function main() {
  const { neon } = await import('@neondatabase/serverless');
  const { generateIdentityNarratives } = await import('../lib/profile-generation/generate-identity-narratives');

  const sql = neon(process.env.DATABASE_URL!);
  const args = process.argv.filter(a => !a.startsWith('--'));
  const assessmentId = args[2] || '8d11fd5c-bb39-4ee6-b0f8-48d2a5658351';
  const locale = (args[3] || 'zh') as 'en' | 'zh';

  // Fetch profile
  const rows = await sql`
    SELECT id, "profileJson" FROM "PersonalProfile"
    WHERE "assessmentId" = ${assessmentId}
    ORDER BY "createdAt" DESC LIMIT 1
  `;
  if (rows.length === 0) { console.error('No profile found'); process.exit(1); }

  const profileId = rows[0].id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DB JSONB column has no static type
  const profile = rows[0].profileJson as any;
  const algo = profile.algoSnapshot;
  if (!algo) { console.error('No algoSnapshot'); process.exit(1); }

  console.log(`Archetype: ${profile.archetype?.label_zh}, Locale: ${locale}\n`);

  const t0 = Date.now();
  try {
    const narratives = await generateIdentityNarratives(profile, algo, locale);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`Done in ${elapsed}s\n`);

    if (!narratives) {
      console.log('⚠️  No narratives returned');
      return;
    }

    // Check if LLM or fallback
    const isFallback = (narratives.bigFiveNarrative || '').includes('/100');
    console.log(isFallback ? '⚠️  FALLBACK (LLM failed)' : '✅ LLM-GENERATED');

    for (const [key, value] of Object.entries(narratives)) {
      const v = value as string;
      console.log(`\n--- ${key} (${v.length} chars) ---`);
      console.log(v);
    }

    // Update DB
    const updated = {
      ...profile,
      narrativeSnapshots: { ...profile.narrativeSnapshots, ...narratives, populatedAt: new Date().toISOString() },
    };
    await sql`UPDATE "PersonalProfile" SET "profileJson" = ${JSON.stringify(updated)}::jsonb WHERE id = ${profileId}`;
    console.log('\n✅ DB updated! Refresh profile page.');
  } catch (err) {
    console.error(`\n❌ Failed after ${((Date.now() - t0) / 1000).toFixed(1)}s:`, err);
  }
}

main();
