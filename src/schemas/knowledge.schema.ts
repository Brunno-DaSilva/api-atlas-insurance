import { z } from 'zod';

export const knowledgeSearchSchema = z.object({
  query: z.string().min(1, 'query is required'),
  category: z.enum(['policy', 'procedure', 'faq', 'compliance']).optional(),
  tags: z.array(z.string()).optional(),
});

export const knowledgeRetrieveSchema = z.object({
  articleId: z.string().uuid(),
});

export type KnowledgeSearchInput = z.infer<typeof knowledgeSearchSchema>;
export type KnowledgeRetrieveInput = z.infer<typeof knowledgeRetrieveSchema>;
