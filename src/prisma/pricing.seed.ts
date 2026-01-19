// backend/src/prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * Compute min/max amounts for costBreakdown from a tier range and percent ranges.
 * Returns an array of { label, percentRange, minAmount, maxAmount }.
 */
// Replace your current helper with this one
function applyCostBreakdownFromPercents(
  tierRangeUsd: number[] | undefined,
  breakdown: Array<{ label?: string; percentRange?: number[]; }>
) {
  // Accept number[] (or undefined). If only one element provided, use it for both low & high.
  const tr = Array.isArray(tierRangeUsd) ? tierRangeUsd : [];
  const low = typeof tr[0] === "number" ? tr[0] : 0;
  const high = typeof tr[1] === "number" ? tr[1] : low;

  return (breakdown ?? []).map((c) => {
    const pr = Array.isArray(c.percentRange) ? c.percentRange : [];
    const minPct = typeof pr[0] === "number" ? pr[0] : 0;
    const maxPct = typeof pr[1] === "number" ? pr[1] : pr[0] ?? 0;

    // clamp pct to [0,100]
    const minPctClamped = Math.max(0, Math.min(100, minPct));
    const maxPctClamped = Math.max(0, Math.min(100, maxPct));

    const computedMin = Math.round((minPctClamped / 100) * low);
    const computedMax = Math.round((maxPctClamped / 100) * high);

    return {
      label: c.label,
      percentRange: pr,
      minAmount: computedMin,
      maxAmount: computedMax,
    };
  });
}


/**
 * Data (copied from your message)
 * - pricingTiersData
 * - quickEstimatesData
 * - whyChooseUsData
 *
 * If this file grows you can move data to separate modules and import them.
 */

const pricingTiersData = [
  {
    id: "starter",
    title: "Starter (SME / Pilot)",
    taglineParts: ["Discovery", "Build", "Launch"],
    // Updated: lower upper bound so starter isn't too expensive globally
    rangeUsd: [700, 3500],
    bullets: [
      "Brochure or simple landing site",
      "Core web application with a simple admin panel",
      "Product discovery and scope definition",
      "Basic analytics and managed hosting",
    ],
    highlight: false,
    estimatedTimelineWeeks: [2, 8],
    typicalTeam: [
      { role: "Product / PM", allocation: "part-time (0.1–0.3 FTE)" },
      { role: "Designer", allocation: "1 designer, 0.2–0.5 FTE" },
      { role: "Developer", allocation: "1 full-stack developer (0.5–1.0 FTE)" },
      { role: "QA", allocation: "part-time or ad-hoc (contracted testing)" },
    ],
    typicalDeliverables: [
      "A 2–6 page marketing site or a single-feature web app",
      "An admin panel for content and user management",
      "A short discovery report with prioritized scope and acceptance criteria",
      "Basic analytics (pageviews, key events) and hosting setup",
    ],
    costBreakdown: [
      // percentRange unchanged; min/max recomputed to match [700,3500]
      { label: "Engineering & Implementation", percentRange: [45, 55], minAmount: 315, maxAmount: 1925 },
      { label: "Design & UX", percentRange: [15, 25], minAmount: 105, maxAmount: 875 },
      { label: "Project Management", percentRange: [8, 12], minAmount: 56, maxAmount: 420 },
      { label: "QA & Testing", percentRange: [5, 10], minAmount: 35, maxAmount: 350 },
      { label: "Hosting, 3rd-party services & licenses", percentRange: [3, 8], minAmount: 21, maxAmount: 280 },
      { label: "Contingency / buffer", percentRange: [3, 5], minAmount: 21, maxAmount: 175 },
    ],
    whyItems: [
      {
        id: "starter-scope",
        icon: "InformationCircleIcon",
        title: "Scope can vary",
        description:
          "Starter projects range from a simple brochure site (low complexity) to a focused single-feature web app (moderate complexity). Lower-end work uses templates and minimal customization; higher-end work includes small custom features and light backend integration.",
        order: 0,
      },
      {
        id: "starter-team",
        icon: "UsersIcon",
        title: "Small cross-functional team",
        description:
          "Typically delivered by a single full-stack developer alongside a designer and a part-time product lead. Hourly rates and time allocations are the primary drivers of cost variation.",
        order: 1,
      },
      {
        id: "starter-hosting",
        icon: "ServerIcon",
        title: "Hosting and service costs",
        description:
          "Managed hosting, analytics tools and third-party integrations (forms, email providers) are usually modest but should be included in the overall budget.",
        order: 2,
      },
    ],
    assumptions: [
      "Client supplies brand assets (logo, copy) and example content",
      "Complex authentication and integrations are out of scope unless explicitly agreed",
      "Design revisions are limited to 1–2 rounds",
    ],
    exclusions: [
      "Ongoing marketing, content creation, advanced analytics or custom integrations (these are scoped and billed separately)",
      "Enterprise security, SSO or formal compliance work",
    ],
    paymentMilestones: [
      { label: "Deposit", percent: 25 },
      { label: "Design sign-off / mid-work", percent: 25 },
      { label: "Staging delivery", percent: 30 },
      { label: "Production handover", percent: 20 },
    ],
    recommendedBudgetGuidance: {
      minimum: 700,
      recommended: 2500,
      explanation:
        "Starter projects vary: lower-end template sites near the min, small custom work near the recommended figure.",
    },
    exampleScope:
      "A small marketing site or a minimal single-user web app with login and 2–3 screens.",
  },
  {
    id: "scale",
    title: "Growth & Scale",
    taglineParts: ["MVP", "Build", "Scale"],
    tagline: "From MVP to product-market fit",
    // keep a broad range for global market variability
    rangeUsd: [15000, 120000],
    bullets: [
      "MVP-quality web and/or native mobile apps",
      "Cloud infrastructure, monitoring and autoscaling",
      "Automated CI/CD and test automation",
      "3 months post-launch support",
    ],
    highlight: true,
    estimatedTimelineWeeks: [8, 24],
    typicalTeam: [
      { role: "Product Manager", allocation: "0.2–0.6 FTE" },
      { role: "Designer(s)", allocation: "1 product designer + 0.5 UX (contract)" },
      { role: "Frontend Engineers", allocation: "1–3 engineers depending on scope" },
      { role: "Backend Engineers", allocation: "1–2 engineers" },
      { role: "Mobile Engineers", allocation: "1–2 engineers (if mobile required)" },
      { role: "DevOps / SRE", allocation: "part-time for setup and automation" },
      { role: "QA / Test Engineer", allocation: "1 (part/full-time depending on cadence)" },
    ],
    typicalDeliverables: [
      "MVP-quality web app and/or native mobile apps with authentication and core flows",
      "A designed UI kit and reusable component library",
      "Automated tests, CI/CD pipeline and production monitoring",
      "Three months of post-launch bug fixes and stability support",
    ],
 costBreakdown: [
      { label: "Engineering & Implementation", percentRange: [45, 55], minAmount: 6750, maxAmount: 66000 },
      { label: "Cloud infrastructure & DevOps", percentRange: [10, 15], minAmount: 1500, maxAmount: 18000 },
      { label: "Design & Product", percentRange: [8, 12], minAmount: 1200, maxAmount: 14400 },
      { label: "QA, Testing & Automation", percentRange: [8, 10], minAmount: 1200, maxAmount: 12000 },
      { label: "Project Management & Product", percentRange: [7, 10], minAmount: 1050, maxAmount: 12000 },
      { label: "Licensing / third-party services", percentRange: [2, 5], minAmount: 300, maxAmount: 6000 },
      { label: "Contingency / risk buffer", percentRange: [5, 8], minAmount: 750, maxAmount: 9600 },
    ],
    whyItems: [
      {
        id: "scale-mvp",
        icon: "LightBulbIcon",
        title: "MVP vs production readiness",
        description:
          "An MVP focuses on validated core flows. Production readiness adds automated testing, load testing, robust error handling and runbooks—this increases effort and cost.",
        order: 0,
      },
      {
        id: "scale-infra",
        icon: "CloudArrowUpIcon",
        title: "Infrastructure & scalability",
        description:
          "Serverless vs containers, database design, caching and monitoring all affect cost. Proper configuration is important to support growth.",
        order: 1,
      },
      {
        id: "scale-mobile",
        icon: "DevicePhoneMobileIcon",
        title: "Native mobile adds complexity",
        description:
          "Building for iOS and Android (native or cross-platform) typically increases engineering time compared with a web-only product.",
        order: 2,
      },
      {
        id: "scale-data",
        icon: "ChartBarIcon",
        title: "Integrations and data",
        description:
          "Integrating external APIs, payment providers or migrating data can be unpredictable; allow time and budget for discovery and iteration.",
        order: 3,
      },
    ],
    assumptions: [
      "Product requirements and a prioritized backlog are available before sprints start",
      "Third-party APIs are reasonably documented and accessible",
      "Mobile app store accounts and vendor access will be provided by the client or arranged at extra cost",
    ],
    exclusions: [
      "Formal enterprise SSO, penetration testing or full compliance audits (these are scoped separately)",
      "Large-scale data migrations or bespoke reporting platforms",
    ],
    paymentMilestones: [
      { label: "Deposit", percent: 20 },
      { label: "Design & architecture sign-off", percent: 20 },
      { label: "Alpha / internal demo", percent: 20 },
      { label: "Beta / public test", percent: 20 },
      { label: "Production handover", percent: 20 },
    ],
    recommendedBudgetGuidance: {
      minimum: 15000,
      recommended: 50000,
      explanation:
        "For a production-quality MVP with CI/CD, monitoring and optional native mobile, budget near or above the recommended figure to cover testing, reliability and early operations.",
    },
    exampleScope:
      "MVP web plus mobile app with core user flows, payments integration, basic analytics, autoscaling infrastructure and three months of post-launch support.",
  },

  {
    id: "enterprise",
    title: "Enterprise & Platforms",
    taglineParts: ["Teams", "Compliance", "SLA"], 
    tagline: "Dedicated teams, compliance & SLA",
    rangeUsd: [120000, 1000000],
    bullets: [
      "Dedicated engineering team",
      "Security, compliance and audits",
      "On-premise or hybrid deployment options",
      "24/7 support with formal SLAs",
    ],
    highlight: false,
    estimatedTimelineWeeks: [16, 52],
    typicalTeam: [
      { role: "Product Director / Program Manager", allocation: "0.2–1.0 FTE" },
      { role: "Design & Research", allocation: "lead + UX researchers" },
      { role: "Engineering Team", allocation: "3–12 engineers (frontend, backend, mobile, data)" },
      { role: "DevOps / SRE", allocation: "1–2 engineers (full-time)" },
      { role: "Security & Compliance", allocation: "consultant or embedded engineer" },
      { role: "QA & Test Automation", allocation: "1–3 engineers" },
      { role: "Support / Ops", allocation: "on-call rotations or managed support" },
    ],
    typicalDeliverables: [
      "A multi-tenant platform or enterprise application integrated with CRM/ERP systems",
      "Formal security hardening and compliance checks (e.g., GDPR, SOC 2) where required",
      "SLA-backed hosting, on-call SRE and business continuity plans",
      "Operational runbooks, monitoring dashboards, training and handover documentation",
    ],
    costBreakdown: [
      {
        label: "Engineering (development & architecture)",
        percentRange: [40, 55],
        minAmount: 48000,
        maxAmount: 550000,
      },
      {
        label: "Cloud infra, SRE & operations",
        percentRange: [10, 20],
        minAmount: 12000,
        maxAmount: 200000,
      },
      {
        label: "Security, compliance & audits",
        percentRange: [7, 12],
        minAmount: 8400,
        maxAmount: 120000,
      },
      {
        label: "Project & Program Management",
        percentRange: [8, 10],
        minAmount: 9600,
        maxAmount: 100000,
      },
      {
        label: "QA, automation & reliability engineering",
        percentRange: [8, 10],
        minAmount: 9600,
        maxAmount: 100000,
      },
      {
        label: "Support, training & onboarding",
        percentRange: [5, 8],
        minAmount: 6000,
        maxAmount: 80000,
      },
      {
        label: "Contingency & risk mitigation",
        percentRange: [5, 10],
        minAmount: 6000,
        maxAmount: 100000,
      },
    ],
    whyItems: [
      {
        id: "enterprise-sla",
        icon: "ShieldCheckIcon",
        title: "SLA and 24/7 operations",
        description:
          "Enterprise customers often require guaranteed uptime, business continuity plans and staffed support. Meeting those needs requires people, tooling and ongoing operational budget.",
        order: 0,
      },
      {
        id: "enterprise-compliance",
        icon: "DocumentTextIcon",
        title: "Security and compliance",
        description:
          "Compliance work (data residency, GDPR, SOC 2, HIPAA) involves processes, documentation, testing and sometimes third-party audits — this increases scope and cost.",
        order: 1,
      },
      {
        id: "enterprise-integrations",
        icon: "PuzzlePieceIcon",
        title: "Complex integrations and migration",
        description:
          "Deep integrations with legacy systems or large data migrations need discovery, staging, reconciliation and iterative testing—these are time-consuming and resource intensive.",
        order: 2,
      },
      {
        id: "enterprise-scale",
        icon: "ServerStackIcon",
        title: "Performance and scale engineering",
        description:
          "High throughput, low latency or multi-region deployments add architectural complexity, more extensive testing and higher ongoing infrastructure costs.",
        order: 3,
      },
    ],
    assumptions: [
      "Enterprise stakeholders will participate in regular governance and prioritization",
      "Client will provide business process documentation, vendor access and sign-off stakeholders",
      "Legal and procurement timelines are managed separately and may extend lead times",
    ],
    exclusions: [
      "Third-party audit fees or certification costs (billed separately)",
      "Extensive on-premise hardware procurement (we can coordinate but will charge separately)",
    ],
    paymentMilestones: [
      { label: "Initial engagement & discovery", percent: 15 },
      { label: "Architecture & design sign-off", percent: 20 },
      { label: "Major milestones (iterative)", percent: 40 },
      { label: "Production release", percent: 15 },
      { label: "Post-release SLA / onboarding", percent: 10 },
    ],
    recommendedBudgetGuidance: {
      minimum: 120000,
      recommended: 350000,
      explanation:
        "Platform work with compliance, SRE and enterprise integrations typically requires a dedicated, multi-disciplinary team over many months; budget at or above the recommended figure to cover ongoing reliability and compliance needs.",
    },
    exampleScope:
      "A multi-tenant SaaS platform with SAML/OIDC single sign-on, dedicated SRE, compliance support and multi-region deployment; includes training and an SLA-backed support contract.",
  },
];

const quickEstimatesData = [
  { label: "Basic website (brochure / landing page)", low: 1000, high: 8000, note: "Marketing site, landing pages" },
  { label: "Web app (business portal)", low: 5000, high: 40000, note: "Customer portal, admin, integrations" },
  { label: "Mobile app (MVP)", low: 15000, high: 80000, note: "iOS + Android + backend APIs" },
  { label: "Platform / SaaS-like product", low: 40000, high: 350000, note: "Multi-tenant, billing, analytics" },
  { label: "AI / ML product", low: 60000, high: 500000, note: "Data pipelines, models, infra" },
];

const whyChooseUsData = [
  {
    id: "security",
    icon: "ShieldCheckIcon",
    title: "Security-first",
    description: "Best practices for security, compliance, and data protection.",
  },
  {
    id: "speed",
    icon: "BoltIcon",
    title: "Fast Delivery",
    description: "Iterative release cycles, get value in weeks not months.",
  },
  {
    id: "team",
    icon: "UsersIcon",
    title: "Global Standards",
    description: "Local expertise with global best practices.",
  },
  {
    id: "support",
    icon: "ClockIcon",
    title: "Always Available",
    description: "Dedicated support throughout the lifecycle of your project.",
  },
];
const faqData = [
  
    {
      question: "Can I pay for software development in US Dollars or other currencies?",
      answer:
        "Yes, we accept payments in USD, EUR, GBP, and other major currencies. All estimates and invoices can be converted automatically based on current FX rates to ensure transparency.",
    },
    {
      question: "Do you offer discounts for African startups or SMEs?",
      answer:
        "Yes! We provide special pricing and flexible payment options for startups and SMEs across Africa. Contact our sales team for Africa-focused project packages.",
    },
    {
      question: "What payment methods are accepted for custom software projects?",
      answer:
        "We accept debit/credit cards, mobile money in Kenya, stripe and bank transfers. Our invoices clearly indicate the supported payment options for your region.",
    },
    {
      question: "How is the project timeline determined?",
      answer:
        "Project timelines depend on the complexity and requirements of your software. After understanding your needs, we provide a detailed development schedule with milestones to track progress.",
    },
    {
      question: "Do you provide support and maintenance after delivery?",
      answer:
        "Yes, we offer post-delivery support and maintenance plans for all bespoke software projects. You can choose a support package tailored to your needs.",
    },
    {
      question: "Are there any hidden costs for bespoke software?",
      answer:
        "No, our quotes are transparent. All costs, including design, development, testing, and deployment, are clearly outlined in your proposal before starting the project.",
    },
    {
      question: "Do you handle projects for clients outside Kenya?",
      answer:
        "Absolutely! We work with clients globally, providing estimates in multiple currencies and managing projects remotely with international collaboration tools.",
    },
];

const PricingPagePayload = {
  title: "Pricing",
  subtitle: "Clear, outcome-focused pricing for web & mobile products",
  description:
    "We partner with startups, SMEs and enterprises to ship secure, maintainable products. Pricing below is indicative — a short discovery aligns scope to cost and risk.",
  offerings: pricingTiersData,
  quickEstimates: quickEstimatesData,
  whyChooseUs: whyChooseUsData,
  cta: { text: "Get a scoped quote", href: "/contact" },
};

async function main() {
  console.log("Seeding PricingPage...");

  // Optionally clear existing content for a clean seed
  try {
    // remove existing page(s) and related children for a clean seed run
    await prisma.pricingTier.deleteMany();
    await prisma.quickEstimate.deleteMany();
    await prisma.whyChooseUsItem.deleteMany();
    await prisma.paymentMethod.deleteMany();
    await prisma.pricingPage.deleteMany();
  } catch (e) {
    // ignore deletion errors if relations don't exist yet
    console.warn("Pre-seed cleanup issue (continuing):", (e as any)?.message ?? e);
  }

const page = await prisma.pricingPage.create({
  data: {
    title: PricingPagePayload.title,
    subtitle: PricingPagePayload.subtitle,
    description: PricingPagePayload.description,
    cta: PricingPagePayload.cta,

    faq: faqData,     
    payments: {
      create: []   // REQUIRED FIX
    },

offerings: {
  create: PricingPagePayload.offerings.map((o) => {
    // compute costBreakdown entries for this tier
    const computedCostBreakdown = applyCostBreakdownFromPercents(o.rangeUsd ?? [0, 0], o.costBreakdown ?? []);

    return {
      title: o.title,
      tagline: o.tagline ?? null,
      taglineParts: o.taglineParts ?? [],
      rangeUsd: o.rangeUsd ?? [],
      bullets: o.bullets ?? [],
      highlight: o.highlight ?? false,
      estimatedTimelineWeeks: o.estimatedTimelineWeeks ?? [],
      typicalTeam: o.typicalTeam ?? null,
      typicalDeliverables: o.typicalDeliverables ?? [],
      // updated: compute costBreakdown create payload
      costBreakdown: {
        create: computedCostBreakdown.map((cb) => ({
          label: cb.label,
          percentRange: cb.percentRange,
          minAmount: cb.minAmount,
          maxAmount: cb.maxAmount,
        })),
      },
      assumptions: o.assumptions ?? [],
      exclusions: o.exclusions ?? [],
      paymentMilestones: o.paymentMilestones ?? null,
      recommendedBudgetGuidance: o.recommendedBudgetGuidance ?? null,
      exampleScope: o.exampleScope ?? null,

      whyItems: {
        create: o.whyItems?.map((w) => ({
          icon: w.icon ?? null,
          title: w.title,
          description: w.description ?? null,
          order: w.order ?? 0,
        })) ?? [],
      }
    };
  })
},


    quickEstimates: {
      create: PricingPagePayload.quickEstimates.map((q) => ({
        label: q.label,
        low: q.low,
        high: q.high,
        note: q.note ?? null,
      })),
    },

    whyChooseUs: {
      create: PricingPagePayload.whyChooseUs.map((w) => ({
        icon: w.icon ?? null,
        title: w.title,
        description: w.description ?? null,
      })),
    },
  },
});



}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
