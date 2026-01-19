import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PricingPagePayload = {
  title: "Pricing",
  subtitle: "Clear, outcome-focused pricing for web & mobile products",
  description:
    "We partner with startups, SMEs and enterprises to ship secure, maintainable products. Pricing below is indicative — a short discovery aligns scope to cost and risk.",
  offerings: [
    {
      id: "starter",
      title: "Starter (SME / Pilot)",
      taglineParts: ["Discovery", "Build", "Launch"],
      rangeUsd: [1000, 12000],
      bullets: [
        "Brochure / basic landing page",
        "Core web app / admin panel",
        "Product discovery",
        "Basic analytics",
      ],
      highlight: false,
    },
    {
      id: "scale",
      title: "Growth & Scale",
      tagline: "From MVP to product-market fit",
      rangeUsd: [15000, 120000],
      bullets: [
        "Robust backend & mobile app (iOS + Android)",
        "Cloud infrastructure & monitoring",
        "Automated CI/CD pipeline",
        "3-month post-launch support",
      ],
      highlight: true,
    },
    {
      id: "enterprise",
      title: "Enterprise & Platforms",
      tagline: "Dedicated teams, compliance & SLA",
      rangeUsd: [120000, 1000000],
      bullets: [
        "Dedicated engineering team",
        "Security & compliance",
        "On-premise or hybrid deployment options",
        "24/7 support & SLA",
      ],
      highlight: false,
    },
  ],
  quickEstimates: [
    { label: "Basic website (brochure / landing page)", low: 1000, high: 8000, note: "Marketing site, landing pages" },
    { label: "Web app (business portal)", low: 5000, high: 40000, note: "Customer portal, admin, integrations" },
    { label: "Mobile app (MVP)", low: 15000, high: 80000, note: "iOS + Android + backend APIs" },
    { label: "Platform / SaaS-like product", low: 40000, high: 350000, note: "Multi-tenant, billing, analytics" },
    { label: "AI / ML product", low: 60000, high: 500000, note: "Data pipelines, models, infra" },
  ],
  cta: { text: "Get a scoped quote", href: "/contact" },
};

async function main() {
  console.log("Seeding PricingPage...");

  const page = await prisma.pricingPage.create({
    data: {
      title: PricingPagePayload.title,
      subtitle: PricingPagePayload.subtitle,
      description: PricingPagePayload.description,
      cta: PricingPagePayload.cta,
      offerings: {
        create: PricingPagePayload.offerings.map((o) => ({
          title: o.title,
          tagline: o.tagline ?? null,
          taglineParts: o.taglineParts,
          rangeUsd: o.rangeUsd,
          bullets: o.bullets,
          highlight: o.highlight,
        })),
      },
      quickEstimates: {
        create: PricingPagePayload.quickEstimates.map((q) => ({
          label: q.label,
          low: q.low,
          high: q.high,
          note: q.note,
        })),
      },
    },
    include: {
      offerings: true,
      quickEstimates: true,
    },
  });

  console.log("PricingPage created with ID:", page.id);
  console.log("Offerings:", page.offerings.length);
  console.log("Quick estimates:", page.quickEstimates.length);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
