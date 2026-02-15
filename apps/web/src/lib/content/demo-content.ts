import type { PageContent } from "@/lib/types";

/**
 * 5 hand-curated pages for demo mode.
 * Designed for a 3-minute demo with visual variety and pacing:
 *   Page 1: Easy news — obvious fake, slow decay, teaches mechanics
 *   Page 2: Easy social — fun topic, teaches section selection
 *   Page 3: Medium blog — subtle misinfo, teaches tools
 *   Page 4: Medium wiki — encyclopedic feel, teaches careful reading
 *   Page 5: Hard news — fast decay, mixed truth/lies, creates clutch tension
 */
export const DEMO_PAGES: PageContent[] = [
  // ─── PAGE 1: EASY NEWS — teaches basic mechanic ───
  {
    id: "demo-news-1",
    title: "Scientists Discover New High-Temperature Superconductor",
    contentType: "news",
    author: "Michael Torres",
    date: "February 13, 2026",
    url: "https://sciencedaily-report.com/physics/superconductor-2026",
    difficulty: 1,
    decayDuration: 55,
    sections: [
      {
        id: "d1-s1",
        text: "A team of researchers at the Max Planck Institute for Chemistry has announced the discovery of a new material that exhibits superconducting properties at relatively high temperatures, potentially revolutionizing energy transmission.",
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: "d1-s2",
        text: "The material, a modified lanthanum hydride compound, achieves superconductivity at -23°C (250K) under standard atmospheric pressure, making it the first room-temperature ambient-pressure superconductor confirmed by peer review.",
        isTrue: false,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d1-s3",
        text: "Current superconductors require either extreme cold (near absolute zero) or enormous pressures to function, severely limiting their practical applications in everyday power grids and computing.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d1-s4",
        text: "\"If this result is replicated independently, it would represent a paradigm shift in condensed matter physics,\" said Dr. Anna Müller, a physicist not involved in the study.",
        isTrue: true,
        category: "quote",
        decayOrder: 4,
        archiveCost: 1,
      },
      {
        id: "d1-s5",
        text: "The global superconductor market was valued at approximately $8.4 billion in 2024 and is projected to grow to $14 billion by 2030, driven by demand in medical imaging, quantum computing, and fusion energy research.",
        isTrue: false,
        category: "statistic",
        decayOrder: 2,
        archiveCost: 1,
      },
    ],
    factCheckData: {
      sourceCredibility: 40,
      dateAccuracy: true,
      emotionalLanguageScore: 30,
      crossReferenceHits: [
        "No confirmed ambient-pressure room-temperature superconductor has been peer-reviewed as of 2026",
        "Max Planck Institute is a real research institution",
        "Market size figures are inflated — actual estimates are around $6-7 billion in 2024",
        "Current superconductor limitations are accurately described",
      ],
      authorHistory: "No verified journalist by this name at this outlet",
    },
  },

  // ─── PAGE 2: EASY SOCIAL — fun topic, teaches selection ───
  {
    id: "demo-social-2",
    title: "Thread: The wildest facts about deep-sea creatures 🌊",
    contentType: "social",
    author: "OceanNerd_Maya",
    date: "February 12, 2026",
    url: "https://threads.social/@oceannerd_maya/deep-sea-thread",
    difficulty: 2,
    decayDuration: 50,
    sections: [
      {
        id: "d2-s1",
        text: "THREAD: I've spent 6 years studying deep-sea biology and these facts still blow my mind. Let's go 🧵🌊",
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: "d2-s2",
        text: "1/ The Mariana Trench is about 36,000 feet deep — if you placed Mount Everest at the bottom, the peak would still be over a mile underwater. The pressure down there is over 1,000 times atmospheric pressure at sea level.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d2-s3",
        text: "2/ Giant squid can grow up to 60 feet long, but we've only ever filmed them alive ONCE — in 2012 by a Japanese research team. We literally know more about the surface of Mars than we do about the deep ocean.",
        isTrue: false,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d2-s4",
        text: "3/ There are organisms living near hydrothermal vents at temperatures above 120°C (248°F), surviving without ANY sunlight. They get energy through chemosynthesis — converting chemicals from the vents into food.",
        isTrue: true,
        category: "body",
        decayOrder: 4,
        archiveCost: 1,
      },
      {
        id: "d2-s5",
        text: "4/ Over 80% of the ocean remains unexplored and unmapped. NOAA estimates we've only identified about one-third of the species living in the deep sea. Every expedition finds dozens of new species.",
        isTrue: true,
        category: "statistic",
        decayOrder: 2,
        archiveCost: 1,
      },
    ],
    factCheckData: {
      sourceCredibility: 50,
      dateAccuracy: true,
      emotionalLanguageScore: 45,
      crossReferenceHits: [
        "Mariana Trench depth and Everest comparison are accurate",
        "Giant squid have been filmed alive multiple times since 2012, not just once",
        "Giant squid max length is debated but 43 feet is the largest confirmed — 60 feet is exaggerated",
        "Hydrothermal vent organisms are well-documented",
        "80% unexplored figure is widely cited by NOAA",
      ],
      authorHistory: "Marine biology enthusiast account — mostly accurate but occasionally exaggerates",
    },
  },

  // ─── PAGE 3: MEDIUM BLOG — teaches tools usage ───
  {
    id: "demo-blog-3",
    title: "How Sleep Deprivation Is Silently Destroying Your Health",
    contentType: "blog",
    author: "Dr. Rachel Nguyen",
    date: "February 6, 2026",
    url: "https://healthinsight.blog/sleep-deprivation-effects",
    difficulty: 4,
    decayDuration: 40,
    sections: [
      {
        id: "d3-s1",
        text: "As a neurologist with 15 years of clinical experience, I've watched sleep deprivation become the most underdiagnosed public health crisis of our generation. The research is clear, even if our culture isn't listening.",
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: "d3-s2",
        text: "The CDC reports that about one-third of American adults get less than the recommended 7 hours of sleep per night. This chronic deficit has measurable effects on immune function, cognitive performance, and emotional regulation.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d3-s3",
        text: "A landmark 2023 study in The Lancet followed 500,000 adults over 10 years and found that sleeping less than 6 hours per night increased the risk of cardiovascular disease by 48% and all-cause mortality by 33%.",
        isTrue: false,
        category: "statistic",
        decayOrder: 2,
        archiveCost: 1,
      },
      {
        id: "d3-s4",
        text: "Sleep is when your brain's glymphatic system clears metabolic waste, including beta-amyloid plaques associated with Alzheimer's disease. Disrupted sleep literally prevents your brain from cleaning itself.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d3-s5",
        text: "Japan has officially recognized \"karoshi\" — death from overwork — as a medical condition since 1987. The Japanese government reported 745 karoshi-related deaths in 2024, with sleep deprivation cited as a contributing factor in 91% of cases.",
        isTrue: false,
        category: "body",
        decayOrder: 4,
        archiveCost: 1,
      },
      {
        id: "d3-s6",
        text: "The economic cost of sleep deprivation is staggering. The RAND Corporation estimates that insufficient sleep costs the U.S. economy up to $411 billion annually in lost productivity.",
        isTrue: true,
        category: "statistic",
        decayOrder: 2,
        archiveCost: 1,
      },
    ],
    factCheckData: {
      sourceCredibility: 60,
      dateAccuracy: true,
      emotionalLanguageScore: 50,
      crossReferenceHits: [
        "CDC one-third sleep deprivation statistic is accurate",
        "No Lancet study with those exact figures exists — real studies show elevated risk but with different percentages",
        "Glymphatic system research is legitimate and well-supported",
        "Karoshi is real but the 91% sleep deprivation figure is fabricated — official statistics don't break down causes this way",
        "RAND $411 billion estimate is real and widely cited",
      ],
      authorHistory: "Health blog by a claimed neurologist — credentials not independently verified",
    },
  },

  // ─── PAGE 4: MEDIUM WIKI — teaches careful reading ───
  {
    id: "demo-wiki-4",
    title: "The Library of Alexandria",
    contentType: "wiki",
    author: "Encyclopedia Contributors",
    date: "Last edited: February 10, 2026",
    url: "https://freeencyclopedia.org/wiki/Library_of_Alexandria",
    difficulty: 5,
    decayDuration: 38,
    sections: [
      {
        id: "d4-s1",
        text: "The Royal Library of Alexandria, or Ancient Library of Alexandria, was one of the largest and most significant libraries of the ancient world. Located in Alexandria, Egypt, it was part of a larger research institution called the Mouseion.",
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: "d4-s2",
        text: "Founded during the reign of Ptolemy I Soter (323-283 BC) and expanded by Ptolemy II Philadelphus, the library aimed to collect all the world's knowledge. At its peak, it is estimated to have held between 400,000 and 700,000 scrolls.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d4-s3",
        text: "The library was destroyed in a single catastrophic fire set by Julius Caesar's forces in 48 BC during the Siege of Alexandria. This event is widely considered the greatest loss of knowledge in human history, setting scientific progress back by an estimated 1,000 years.",
        isTrue: false,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d4-s4",
        text: "Notable scholars who worked at the library include Euclid (geometry), Eratosthenes (who calculated the Earth's circumference with remarkable accuracy), and Archimedes.",
        isTrue: true,
        category: "body",
        decayOrder: 4,
        archiveCost: 1,
      },
      {
        id: "d4-s5",
        text: "Ships arriving at the port of Alexandria were required to surrender any scrolls they carried for copying. The originals were often kept by the library, with copies returned to the owners — a practice known as the \"decree of the ships.\"",
        isTrue: true,
        category: "body",
        decayOrder: 2,
        archiveCost: 1,
      },
      {
        id: "d4-s6",
        text: "Modern historians believe the library's decline was gradual rather than the result of a single event. Budget cuts, political upheaval, and the expulsion of scholars contributed to its deterioration over several centuries.",
        isTrue: true,
        category: "attribution",
        decayOrder: 1,
        archiveCost: 1,
      },
    ],
    factCheckData: {
      sourceCredibility: 72,
      dateAccuracy: true,
      emotionalLanguageScore: 15,
      crossReferenceHits: [
        "The library was NOT destroyed in a single event — the 'Caesar's fire' narrative is an oversimplification",
        "The '1,000 years of lost progress' claim is a popular myth with no historical basis",
        "Scroll count estimates of 400,000-700,000 are within scholarly range",
        "The 'decree of the ships' is documented by Galen",
        "Scholars listed (Euclid, Eratosthenes) are accurately associated with Alexandria",
      ],
      authorHistory: "Community-edited encyclopedia — generally reliable but this article conflates popular myths with historical consensus",
    },
  },

  // ─── PAGE 5: HARD NEWS — fast decay, clutch tension ───
  {
    id: "demo-news-5",
    title: "Global Renewable Energy Capacity Surpasses Fossil Fuels for First Time",
    contentType: "news",
    author: "Emma Blackwell",
    date: "February 11, 2026",
    url: "https://globalenergymonitor.net/renewables-milestone-2026",
    difficulty: 7,
    decayDuration: 25,
    sections: [
      {
        id: "d5-s1",
        text: "The International Energy Agency confirmed that global renewable energy generation capacity exceeded fossil fuel capacity for the first time in December 2025, marking a historic milestone in the energy transition.",
        isTrue: true,
        category: "headline",
        decayOrder: 5,
        archiveCost: 1,
      },
      {
        id: "d5-s2",
        text: "Solar and wind power led the surge, with solar capacity alone growing by 87% in 2025 — driven largely by massive installations in China, India, and the European Union.",
        isTrue: false,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d5-s3",
        text: "However, capacity does not equal generation. Renewable sources accounted for approximately 30% of global electricity generation in 2024, as intermittency issues mean solar and wind operate at lower capacity factors than fossil fuel plants.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d5-s4",
        text: "\"This is an irreversible trend,\" said IEA Executive Director Fatih Birol. \"The economics now favor renewables in the majority of the world. New solar is cheaper than existing coal in most markets.\"",
        isTrue: true,
        category: "quote",
        decayOrder: 4,
        archiveCost: 1,
      },
      {
        id: "d5-s5",
        text: "Battery storage capacity grew by 130% in 2025, reaching 450 GWh globally. China accounts for roughly 60% of global battery manufacturing, giving it significant leverage in the energy transition supply chain.",
        isTrue: false,
        category: "statistic",
        decayOrder: 2,
        archiveCost: 1,
      },
      {
        id: "d5-s6",
        text: "Critics point out that the transition remains uneven. Sub-Saharan Africa, home to 17% of the world's population, accounts for less than 3% of global renewable energy investment.",
        isTrue: true,
        category: "body",
        decayOrder: 3,
        archiveCost: 1,
      },
      {
        id: "d5-s7",
        text: "The shift has major geopolitical implications. Countries dependent on oil and gas exports face mounting pressure to diversify their economies as demand projections for fossil fuels plateau.",
        isTrue: true,
        category: "body",
        decayOrder: 2,
        archiveCost: 1,
      },
    ],
    factCheckData: {
      sourceCredibility: 68,
      dateAccuracy: true,
      emotionalLanguageScore: 22,
      crossReferenceHits: [
        "IEA has reported milestones in renewable capacity but the specific timing may differ",
        "Solar capacity grew significantly in 2025 but 87% growth is inflated — actual growth was around 30-40%",
        "Capacity vs generation distinction is accurate and important",
        "Battery storage growth is real but the 450 GWh figure and 130% growth rate are exaggerated",
        "Sub-Saharan Africa renewable investment disparity is well-documented",
        "Fatih Birol has made similar statements about irreversible trends",
      ],
      authorHistory: "Global Energy Monitor is a reputable organization but this article inflates some growth figures",
    },
  },
];

/**
 * Get all demo pages in order.
 */
export function getDemoPages(): PageContent[] {
  return DEMO_PAGES;
}

/**
 * Get a specific demo page by index (0-based).
 */
export function getDemoPage(index: number): PageContent {
  return DEMO_PAGES[index % DEMO_PAGES.length]!;
}
