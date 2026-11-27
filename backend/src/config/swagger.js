export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Codeathon Platform API',
    version: '1.0.0',
    description: 'Production-ready Codeathon contest platform REST API documentation for 500+ concurrent students.',
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 root',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'access_token',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      cookieAuth: [],
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          200: {
            description: 'Health status and database/redis connectivity state',
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate participant or admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully with cookies set' },
        },
      },
    },
  },
};
