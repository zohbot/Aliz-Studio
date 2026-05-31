import type { Service } from "@/lib/domain";

export const baseServices: Service[] = [
  {
    id: "basic-cut",
    name: "Basic Cut",
    shortName: "Basic",
    price: 30,
    durationMinutes: 30,
    deposit: 10,
    description: "Clean clippers, crisp shape, and a fresh finish.",
    detail: "A dependable appointment for regular upkeep, clean edges, and a confident reset.",
    image: "/images/aliz-style-high-fade.png",
    accent: "Precision",
    styleNote: "Best for weekly or bi-weekly maintenance.",
    inclusions: ["Consultation", "Clipper cut", "Neck cleanup", "Finishing style"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 10
  },
  {
    id: "plus-cut",
    name: "Plus Cut",
    shortName: "Plus",
    price: 35,
    durationMinutes: 40,
    deposit: 10,
    description: "A more detailed cut with extra time for refinement.",
    detail: "Built for clients who want more shaping, texture control, or a little extra precision.",
    image: "/images/aliz-style-burst-fade.png",
    accent: "Texture",
    styleNote: "A stronger choice for fades, curls, and shape work.",
    inclusions: ["Consultation", "Detailed fade", "Texture shaping", "Razor edge finish"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 20
  },
  {
    id: "deluxe-cut",
    name: "Deluxe Cut",
    shortName: "Deluxe",
    price: 40,
    durationMinutes: 50,
    deposit: 15,
    description: "Premium grooming with a sharper finish and detail work.",
    detail: "A full service appointment for a polished cut, beard balance, and clean presentation.",
    image: "/images/aliz-style-classic-taper.png",
    accent: "Signature",
    styleNote: "The complete appointment for the sharpest finish.",
    inclusions: ["Style consultation", "Premium haircut", "Beard balance", "Hot towel finish"],
    active: true,
    featured: true,
    publicVisible: true,
    sortOrder: 30
  },
  {
    id: "kids-cut",
    name: "Kids Cut",
    shortName: "Kids",
    price: 25,
    durationMinutes: 30,
    deposit: 10,
    description: "Patient, clean, and appointment-paced for younger clients.",
    detail: "A relaxed haircut experience designed to keep the visit easy for kids and parents.",
    image: "/images/aliz-style-burst-fade.png",
    accent: "Fresh",
    styleNote: "A calm, quick cut with room for patience.",
    inclusions: ["Simple consultation", "Age-appropriate cut", "Line cleanup", "Parent-friendly pacing"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 40
  },
  {
    id: "shape-up",
    name: "Shape Up",
    shortName: "Shape",
    price: 15,
    durationMinutes: 20,
    deposit: 5,
    description: "Fast edge cleanup for a sharper look between cuts.",
    detail: "Lineup and finishing work for clients who need definition without a full haircut.",
    image: "/images/aliz-style-high-fade.png",
    accent: "Crisp",
    styleNote: "Made for keeping edges clean between full appointments.",
    inclusions: ["Hairline cleanup", "Neckline cleanup", "Razor detail", "Quick finish"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 50
  },
  {
    id: "beard-trim",
    name: "Beard Trim",
    shortName: "Beard",
    price: 20,
    durationMinutes: 25,
    deposit: 5,
    description: "Balanced beard shaping, neckline cleanup, and edge detail.",
    detail: "Focused facial-hair grooming with the same appointment-only care as the full services.",
    image: "/images/aliz-style-classic-taper.png",
    accent: "Balance",
    styleNote: "For clean beard shape without a full haircut.",
    inclusions: ["Beard consultation", "Shape and trim", "Cheek line detail", "Neckline finish"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 60
  },
  {
    id: "eyebrows",
    name: "Eyebrows",
    shortName: "Brows",
    price: 10,
    durationMinutes: 15,
    deposit: 5,
    description: "Subtle eyebrow cleanup for a finished look.",
    detail: "A small add-on or standalone appointment for clean details that do not feel overdone.",
    image: "/images/aliz-hero-gentleman.png",
    accent: "Detail",
    styleNote: "Small detail, big difference in the final look.",
    inclusions: ["Natural brow cleanup", "Shape refinement", "Stray hair removal", "Balanced finish"],
    active: true,
    featured: false,
    publicVisible: true,
    sortOrder: 70
  }
];

export function sortServices(services: Service[]) {
  return [...services].sort((left, right) => {
    const leftOrder = left.sortOrder ?? 999;
    const rightOrder = right.sortOrder ?? 999;

    return leftOrder - rightOrder || left.name.localeCompare(right.name);
  });
}

export function withServiceDefaults(service: Service, index = 0): Service {
  return {
    ...service,
    active: service.active ?? true,
    featured: service.featured ?? service.id === "deluxe-cut",
    publicVisible: service.publicVisible ?? true,
    sortOrder: service.sortOrder ?? (index + 1) * 10
  };
}

export function cloneServices(services: readonly Service[]) {
  return services.map((service, index) => ({
    ...withServiceDefaults(service, index),
    inclusions: [...service.inclusions]
  }));
}
