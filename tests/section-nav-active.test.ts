import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { activeSection } from "../src/lib/activeSection";

const builderSrc = readFileSync(
  new URL("../src/pages/Builder.tsx", import.meta.url),
  "utf8",
);

const KEYS = [
  "contact",
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "custom",
];
const ZONE_TOP = 110;
/** Production anchor tops at 1280×800, scrollY 0 (R848 evidence) */
const AT_TOP = new Map([
  ["contact", 853],
  ["summary", 1273],
  ["experience", 1485],
  ["education", 2297],
  ["projects", 2803],
  ["skills", 3055],
  ["custom", 3439],
]);
const shifted = (dy: number) =>
  new Map([...AT_TOP].map(([k, top]) => [k, top - dy]));

describe("R848: the section-nav highlight follows the page after a jump the observer only saw the end of", () => {
  it("prefers the first section intersecting the zone", () => {
    expect(
      activeSection(
        KEYS,
        new Set(["summary", "experience"]),
        shifted(1200),
        ZONE_TOP,
      ),
    ).toBe("summary");
    expect(
      activeSection(KEYS, new Set(["education"]), shifted(2400), ZONE_TOP),
    ).toBe("education");
  });

  it("at the page top nothing intersects — the first section is highlighted, not the one the user left", () => {
    expect(activeSection(KEYS, new Set(), AT_TOP, ZONE_TOP)).toBe("contact");
    expect(activeSection(KEYS, new Set(), shifted(300), ZONE_TOP)).toBe(
      "contact",
    );
  });

  it("in a gap between sections the section the user has scrolled past stays highlighted", () => {
    // projects card ends at 2861 and skills starts at 3055 (page-top coordinates)
    expect(
      activeSection(KEYS, new Set(), shifted(2861 - ZONE_TOP + 1), ZONE_TOP),
    ).toBe("projects");
  });

  it("keeps the previous choice while the editor pane is hidden (no anchor laid out)", () => {
    expect(activeSection(KEYS, new Set(), new Map(), ZONE_TOP)).toBeNull();
  });

  it("the Builder observer measures the anchors and uses the shared decision", () => {
    const nav = builderSrc.slice(
      builderSrc.indexOf("function SectionNav("),
      builderSrc.indexOf("data-sticky-subnav"),
    );
    expect(nav).toMatch(
      /activeSection\(keys, visible, tops, SECTION_ZONE_TOP\)/,
    );
    expect(nav).toMatch(/rootMargin: `-\$\{SECTION_ZONE_TOP\}px 0px -55% 0px`/);
    expect(builderSrc).toMatch(/const SECTION_ZONE_TOP = 110/);
  });
});
