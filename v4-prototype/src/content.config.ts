import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({
    pattern: '*/index.{md,mdx}',
    base: './src/content/guides',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.enum([
      'basic',
      'design-pattern',
      'migration',
    ]),
    order: z.number().default(0),
    tags: z.array(z.string()).optional(),
    demoTitle: z.string().optional(),
    demoDescription: z.string().optional(),
    demoScript: z.string().optional(),
    hasDemo: z.boolean().default(true),
  }),
});

const tests = defineCollection({
  loader: glob({
    pattern: '*/index.{md,mdx}',
    base: './src/content/tests',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    category: z.enum([
      'manual',
      'regression',
    ]),
    order: z.number().default(0),
    tags: z.array(z.string()).optional(),
    testTitle: z.string().optional(),
    testDescription: z.string().optional(),
    testScript: z.string().optional(),
    hasHarness: z.boolean().default(true),
  }),
});

export const collections = {
  guides,
  tests,
};
