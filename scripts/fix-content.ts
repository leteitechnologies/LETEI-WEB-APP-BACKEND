// scripts/fix-content.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function stripHtmlDocWrapper(html = '') {
  if (!html) return '';
  let s = html;
  s = s.replace(/<\s*html[^>]*>/gi, '');
  s = s.replace(/<\/\s*html\s*>/gi, '');
  s = s.replace(/<\s*head[^>]*>[\s\S]*?<\/head\s*>/gi, '');
  s = s.replace(/<\s*body[^>]*>/gi, '');
  s = s.replace(/<\/\s*body\s*>/gi, '');
  return s.trim();
}

async function main() {
  const posts = await prisma.blogPost.findMany();
  console.log(`Found ${posts.length} posts`);
  for (const p of posts) {
    const original = (p.content ?? '').toString();
    const stripped = stripHtmlDocWrapper(original);

    // If nothing changed, skip
    if (stripped === original.trim()) continue;

    // Ensure we write a string (Prisma expects string, not null)
    const newContent = stripped; // '' is OK if you want an empty body

    console.log(`Updating ${p.id} (${p.slug}) — content wrapper removed`);
    await prisma.blogPost.update({
      where: { id: p.id },
      data: { content: newContent },
    });
  }
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
