import { Response } from 'express';
import { AuthedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import * as knowledgeService from '../services/knowledge.service';
import * as audit from '../services/audit.service';
import { KnowledgeSearchInput, KnowledgeRetrieveInput } from '../schemas/knowledge.schema';

export async function search(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as KnowledgeSearchInput;
  const results = await knowledgeService.search(input);

  await audit.logEvent({
    eventType: 'knowledge_retrieval',
    action: 'knowledge.search',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    resourceType: 'knowledge',
    ipAddress: req.ip,
    payload: { query: input.query, category: input.category, resultCount: results.length },
  });

  sendSuccess(res, { results, count: results.length });
}

export async function retrieve(req: AuthedRequest, res: Response): Promise<void> {
  const { articleId } = req.body as KnowledgeRetrieveInput;
  const article = await knowledgeService.retrieve(articleId);

  await audit.logEvent({
    eventType: 'knowledge_retrieval',
    action: 'knowledge.retrieve',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    resourceType: 'knowledge',
    resourceId: articleId,
    ipAddress: req.ip,
  });

  sendSuccess(res, {
    id: article.id,
    title: article.title,
    content: article.content,
    category: article.category,
    tags: article.tags,
    version: article.version,
    citation: article.source_document, // FR-021
    source_document: article.source_document,
  });
}
