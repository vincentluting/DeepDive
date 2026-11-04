// ============================================================
// Test: Keyboard shortcut handler logic for IPIP 5-point
// and PVQ 6-point Likert scales.
//
// The actual keyboard handlers are useEffect-bound event
// listeners inside React components. We test the core logic:
// - digits 1-5 trigger onChange for IPIP (5-point)
// - digits 1-6 trigger onChange for PVQ (6-point)
// - out-of-range digits are ignored
// - input/textarea targets are ignored
// ============================================================

import { describe, it, expect, vi } from "vitest";

// Extract the keyboard handler logic for testability.
// This mirrors the onKeyDown handler pattern used in both components.

function createKeyboardHandler(
  maxScale: number,
  handleSelect: (rating: number) => void,
) {
  return (e: { key: string; target: { tagName: string } | null }) => {
    const tag = e.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const num = parseInt(e.key, 10);
    if (num >= 1 && num <= maxScale) {
      handleSelect(num);
    }
  };
}

describe("IPIP 5-point keyboard handler", () => {
  const maxScale = 5;

  it('pressing "1" triggers handleSelect(1)', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "1", target: { tagName: "DIV" } });
    expect(handleSelect).toHaveBeenCalledWith(1);
  });

  it('pressing "5" triggers handleSelect(5)', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "5", target: { tagName: "DIV" } });
    expect(handleSelect).toHaveBeenCalledWith(5);
  });

  it('pressing "3" triggers handleSelect(3)', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "3", target: { tagName: "DIV" } });
    expect(handleSelect).toHaveBeenCalledWith(3);
  });

  it('pressing "6" on IPIP 5-point does nothing', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "6", target: { tagName: "DIV" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('pressing "0" does nothing', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "0", target: { tagName: "DIV" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("pressing a letter key does nothing", () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "a", target: { tagName: "DIV" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("ignores keys when target is INPUT", () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "3", target: { tagName: "INPUT" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("ignores keys when target is TEXTAREA", () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "3", target: { tagName: "TEXTAREA" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });
});

describe("PVQ 6-point keyboard handler", () => {
  const maxScale = 6;

  it('pressing "1" through "6" all trigger handleSelect', () => {
    for (let i = 1; i <= 6; i++) {
      const handleSelect = vi.fn();
      const handler = createKeyboardHandler(maxScale, handleSelect);
      handler({ key: String(i), target: { tagName: "DIV" } });
      expect(handleSelect).toHaveBeenCalledWith(i);
    }
  });

  it('pressing "7" on PVQ 6-point does nothing', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "7", target: { tagName: "DIV" } });
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('pressing "6" on PVQ 6-point triggers handleSelect(6)', () => {
    const handleSelect = vi.fn();
    const handler = createKeyboardHandler(maxScale, handleSelect);
    handler({ key: "6", target: { tagName: "DIV" } });
    expect(handleSelect).toHaveBeenCalledWith(6);
  });
});
