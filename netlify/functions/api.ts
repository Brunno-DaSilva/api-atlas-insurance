import serverless from 'serverless-http';
import { app } from '../../src/app';

/**
 * Netlify Functions entry point. Wraps the Express app so it runs on AWS
 * Lambda. Netlify invokes the function at `/.netlify/functions/api/...`, so we
 * strip that prefix (and an optional `/api` alias) before handing the request
 * to Express, which has its routes defined at `/auth`, `/policies`, etc.
 */
const wrapped = serverless(app);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any, context: any) => {
  const original: string = event.path || '/';
  event.path =
    original
      .replace(/^\/\.netlify\/functions\/api/, '')
      .replace(/^\/api(?=\/|$)/, '') || '/';
  return wrapped(event, context);
};
