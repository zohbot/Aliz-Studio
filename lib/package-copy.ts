export type PackageMarketingCopy = {
  shortDescription: string;
  expandedDescription: string;
  bestFor: string;
  includes: string[];
  toneLine: string;
  badge?: string;
};

export const packageMarketingCopy: Record<string, PackageMarketingCopy> = {
  "basic-cut": {
    shortDescription: "A clean, dependable cut for regular upkeep.",
    expandedDescription:
      "The Basic Cut is built for a sharp reset without overcomplicating the appointment. It focuses on clean shape, even balance, neckline cleanup, and a confident everyday finish.",
    bestFor: "Routine maintenance, freshening up before work, school, or the weekend.",
    includes: [
      "Consultation on preferred length and shape",
      "Clean haircut finish",
      "Neckline and edge cleanup",
      "Light styling to finish"
    ],
    toneLine: "Simple, sharp, and easy to keep up with."
  },
  "plus-cut": {
    shortDescription: "A more detailed cut with extra finish time.",
    expandedDescription:
      "The Plus Cut gives the appointment more room for detail. It is a strong choice when the cut needs extra attention around blending, shape, edges, or styling while still staying efficient.",
    bestFor: "Clients who want a little more polish than a standard maintenance cut.",
    includes: [
      "Detailed haircut consultation",
      "Refined cutting and blending",
      "Edge and neckline cleanup",
      "Styling finish",
      "Extra time for precision"
    ],
    toneLine: "A balanced upgrade for a cleaner, more finished look."
  },
  "deluxe-cut": {
    shortDescription: "The signature grooming experience with the sharpest finish.",
    expandedDescription:
      "The Deluxe Cut is the most complete cut package. It gives the appointment the extra time needed for careful detail work, sharper shaping, cleaner finishing, and a more elevated studio experience.",
    bestFor: "Big events, photo days, first impressions, or anyone who wants the most polished result.",
    includes: [
      "Full haircut consultation",
      "Detailed cut and refinement",
      "Enhanced edge and neckline work",
      "Styling finish",
      "Extra time for final detail checks"
    ],
    toneLine: "The signature choice when the details matter.",
    badge: "Signature"
  },
  "kids-cut": {
    shortDescription: "A clean, patient cut for younger clients.",
    expandedDescription:
      "The Kids Cut keeps the appointment simple, comfortable, and focused. It is designed for a clean look without rushing the experience or making the process feel overwhelming.",
    bestFor: "Younger clients who need a fresh, neat cut with a calm appointment experience.",
    includes: [
      "Simple style consultation",
      "Age-appropriate haircut",
      "Neckline cleanup",
      "Light finishing"
    ],
    toneLine: "Fresh, neat, and comfortable."
  },
  "shape-up": {
    shortDescription: "A quick edge refresh between full cuts.",
    expandedDescription:
      "The Shape Up is for keeping the details crisp when the full cut can wait. It focuses on the hairline, edges, and neckline so the look stays cleaner between appointments.",
    bestFor: "Maintaining a fresh outline between full haircut appointments.",
    includes: ["Hairline and edge cleanup", "Neckline touch-up", "Quick detail finish"],
    toneLine: "Keep the outline sharp without booking a full cut."
  },
  "beard-trim": {
    shortDescription: "Clean beard shaping with a sharper profile.",
    expandedDescription:
      "The Beard Trim brings structure back to the beard. It focuses on shape, balance, neckline, cheek line, and a cleaner finish that works with the client's face and style.",
    bestFor: "Beard maintenance, reshaping, and cleaning up uneven growth.",
    includes: [
      "Beard shape consultation",
      "Trim and balance",
      "Cheek and neckline cleanup",
      "Light finishing"
    ],
    toneLine: "A cleaner beard changes the whole profile."
  },
  eyebrows: {
    shortDescription: "A subtle cleanup for a more finished look.",
    expandedDescription:
      "The Eyebrows service is a quick detail add-on for a cleaner, more intentional finish. The goal is subtle cleanup, not over-shaping.",
    bestFor: "Finishing touches before an event, photo, or fresh cut.",
    includes: ["Eyebrow cleanup", "Shape refinement", "Natural finish"],
    toneLine: "Small detail, noticeable difference."
  }
};

export function getPackageMarketingCopy(serviceId: string) {
  return packageMarketingCopy[serviceId];
}
