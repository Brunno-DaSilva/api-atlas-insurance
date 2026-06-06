import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Atlas Insurance Group — Virtual Agent API',
      version: '1.0.0',
      description:
        'RESTful CRUD API backing the Atlas Insurance Cognigy.AI virtual agent. ' +
        'Supports Eligibility Verification, First Notice of Loss (FNOL), and Claim Status.',
    },
    servers: [{ url: `http://localhost:${env.port}`, description: 'Local' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        serviceKey: { type: 'apiKey', in: 'header', name: 'x-service-key' },
      },
    },
    tags: [
      { name: 'Auth' },
      { name: 'Policies' },
      { name: 'Claims' },
      { name: 'Knowledge' },
      { name: 'Audit' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
