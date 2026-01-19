// scripts/fix-slugs.js
require('dotenv').config(); // load DATABASE_URL from .env if present
const { PrismaClient } = require('@prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.blogPost.findMany();
  for (const p of posts) {
    const base = (p.slug && String(p.slug).trim().length > 0) ? p.slug : p.title;
    const newSlug = slugify(String(base), { lower: true, strict: true }).slice(0, 200);
    if (newSlug !== p.slug) {
      console.log(`Updating ${p.id}: "${p.slug}" -> "${newSlug}"`);
      await prisma.blogPost.update({
        where: { id: p.id },
        data: { slug: newSlug },
      });
    } else {
      console.log(`Skipping ${p.id}: "${p.slug}" (unchanged)`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
