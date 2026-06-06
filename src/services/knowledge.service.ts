import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { KnowledgeArticle } from '../types';
import { KnowledgeSearchInput } from '../schemas/knowledge.schema';

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  category: string;
  source_document: string | null;
  tags: string[] | null;
}

/**
 * Case-insensitive search across title + content, restricted to active
 * articles only (FR-020). Optionally filtered by category and tags.
 */
export async function search(input: KnowledgeSearchInput): Promise<KnowledgeSearchResult[]> {
  const term = input.query.trim();

  let query = supabase
    .from('knowledge_articles')
    .select('id, title, category, source_document, tags')
    .eq('active', true);

  if (input.category) query = query.eq('category', input.category);
  if (input.tags && input.tags.length > 0) query = query.overlaps('tags', input.tags);
  if (term) query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);

  const { data, error } = await query.order('title', { ascending: true });
  if (error) throw AppError.internal(`Knowledge search failed: ${error.message}`);

  return (data as KnowledgeSearchResult[]) ?? [];
}

/** Retrieve a single active article including full content + citation. */
export async function retrieve(articleId: string): Promise<KnowledgeArticle> {
  const { data, error } = await supabase
    .from('knowledge_articles')
    .select('*')
    .eq('id', articleId)
    .eq('active', true)
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to retrieve article: ${error.message}`);
  if (!data) throw AppError.notFound('Knowledge article not found or inactive');
  return data as KnowledgeArticle;
}
