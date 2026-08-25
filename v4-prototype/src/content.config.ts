import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
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
  }),
});

export const collections = {
  guides,
};
