// ============================================================
// LLM Test Fixtures — pre-recorded responses for E2E/CI testing
//
// Used when LLM_TEST_MODE=mock. Returns deterministic responses
// so tests are fast, free, and never flaky.
// ============================================================

const FIXTURES: Record<
  string,
  { text: string; inputTokens: number; outputTokens: number }
> = {
  "profile-narrative": {
    text: JSON.stringify({
      identitySummary:
        "A creative analyst who thrives at the intersection of art and investigation.",
      archetypeNarrative:
        "Your Artistic-Investigative profile suggests a deep curiosity paired with creative expression.",
      bigFiveNarrative:
        "High openness combined with moderate conscientiousness creates a balance between exploration and follow-through.",
      valueNarrative:
        "Your core values center on self-direction and universalism.",
      sjtTensionNarrative:
        "You navigate workplace tensions by seeking understanding before action.",
      crossDimensionNarrative:
        "The interplay between your creative drive and analytical rigor creates unique career opportunities.",
      growthMapInsight:
        "Your growth edge lies in translating creative vision into structured outcomes.",
    }),
    inputTokens: 3000,
    outputTokens: 1500,
  },
  "career-match-narrative": {
    text: JSON.stringify({
      directions: [
        {
          whySuitable: "Strong alignment with creative problem-solving skills.",
          challenges: "May need to develop technical depth.",
        },
        {
          whySuitable: "Natural fit for research-oriented roles.",
          challenges: "Requires patience with administrative tasks.",
        },
        {
          whySuitable: "Excellent match for cross-functional team leadership.",
          challenges: "May find routine operations unstimulating.",
        },
      ],
    }),
    inputTokens: 2500,
    outputTokens: 800,
  },
  integration: {
    text: JSON.stringify({
      coreInsight:
        "Your unique blend of artistic sensitivity and investigative rigor positions you as a bridge-builder between creative and analytical teams.",
      letterToUser:
        "Dear Explorer, your journey through this assessment reveals someone who sees patterns where others see chaos...",
    }),
    inputTokens: 2000,
    outputTokens: 600,
  },
  "career-pathway": {
    text: JSON.stringify({
      pathway: {
        immediate: "Explore UX research roles",
        medium: "Build portfolio of case studies",
        long: "Lead design research team",
      },
      actionPlan: [
        { day: 1, action: "Update LinkedIn profile" },
        { day: 7, action: "Complete online UX course module 1" },
        { day: 30, action: "Conduct 3 informational interviews" },
      ],
    }),
    inputTokens: 1500,
    outputTokens: 400,
  },
  coaching: {
    text: "I can see from your profile that you have a fascinating combination of creative and analytical strengths. Your Artistic-Investigative archetype suggests you thrive when you can explore ideas deeply while expressing them in novel ways. What aspect of your career exploration would you like to focus on today?",
    inputTokens: 2000,
    outputTokens: 300,
  },
  "coaching-summary": {
    text: JSON.stringify({
      summary:
        "User explored UX design career paths and expressed interest in research-oriented roles.",
      keyInsights: [
        "Strong interest in UX research",
        "Values creative problem-solving",
      ],
      nextSteps: ["Research UX bootcamps", "Connect with UX professionals"],
    }),
    inputTokens: 1000,
    outputTokens: 200,
  },
  "memory-extract": {
    text: JSON.stringify({
      memories: [
        {
          category: "career_interest",
          keyword: "UX Design",
          insight: "User is interested in UX design careers",
        },
      ],
    }),
    inputTokens: 800,
    outputTokens: 150,
  },
  "resume-parse": {
    text: JSON.stringify({
      experience: [
        {
          title: "UX Designer",
          company: "Test Corp",
          industry: "technology",
          durationMonths: 36,
          responsibilities: ["UI design", "User research", "Prototyping"],
        },
      ],
      skills: ["Design", "Research", "Analysis", "Figma", "User Testing"],
      languages: [{ language: "English", proficiency: "native" }],
      industries: ["technology"],
      education: [
        { degree: "Bachelor", field: "Design", institution: "Test University" },
      ],
      yearsOfExperience: 3,
      seniority: "mid",
    }),
    inputTokens: 500,
    outputTokens: 200,
  },
};

/**
 * Get a mock response for a given task.
 * Returns null if no fixture exists (caller should fall through to real API).
 */
export function getMockResponse(
  task: string,
): { text: string; inputTokens: number; outputTokens: number } | null {
  return FIXTURES[task] ?? null;
}

/**
 * Create a mock streaming Response for coaching tasks.
 * Simulates SSE-style streaming with small delays.
 */
export function getMockStreamResponse(task: string): Response {
  const fixture = FIXTURES[task];
  const text = fixture?.text ?? "Mock coaching response for testing.";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send text in small chunks to simulate streaming
      const words = text.split(" ");
      let i = 0;
      const interval = setInterval(() => {
        if (i < words.length) {
          controller.enqueue(encoder.encode(words[i] + " "));
          i++;
        } else {
          clearInterval(interval);
          controller.close();
        }
      }, 10); // 10ms per word = fast but realistic
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
