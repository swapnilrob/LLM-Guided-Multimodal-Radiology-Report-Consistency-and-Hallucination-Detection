const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Radiology Report Hallucination Detection API',
      version: '1.0.0',
      description:
        'REST API for institutional access to radiology report analysis, hallucination detection, and team collaboration features.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Institutional API (API key auth)',
      },
      {
        url: '/api',
        description: 'Internal API (JWT auth)',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for institutional access. Generate one from the Settings page.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated users.',
        },
      },
      schemas: {
        AnalysisSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            imageUrl: { type: 'string', example: 'https://res.cloudinary.com/...' },
            reliabilityScore: { type: 'number', example: 72 },
            status: { type: 'string', enum: ['processing', 'complete', 'failed'] },
            claimCount: { type: 'integer', example: 5 },
            hallucinationCount: { type: 'integer', example: 1 },
            consistencyViolationCount: { type: 'integer', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Claim: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            text: { type: 'string', example: 'Large left-sided pleural effusion noted.' },
            anatomicalRegion: { type: 'string', example: 'Left Lung Lower Lobe' },
            verdict: { type: 'string', enum: ['supported', 'uncertain', 'hallucinated'] },
            riskScore: { type: 'number', example: 85 },
            explanation: { type: 'string' },
            boundingBox: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
              },
            },
          },
        },
        ConsistencyViolation: {
          type: 'object',
          properties: {
            findingsSentence: { type: 'string' },
            impressionSentence: { type: 'string' },
            explanation: { type: 'string' },
          },
        },
        AnalysisDetail: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            imageUrl: { type: 'string' },
            originalReportText: { type: 'string' },
            correctedReportText: { type: 'string', nullable: true },
            reliabilityScore: { type: 'number' },
            status: { type: 'string' },
            claims: {
              type: 'array',
              items: { $ref: '#/components/schemas/Claim' },
            },
            consistencyViolations: {
              type: 'array',
              items: { $ref: '#/components/schemas/ConsistencyViolation' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TeamSummary: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', example: 'Radiology Dept A' },
            memberCount: { type: 'integer', example: 4 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiKeyResponse: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            key: { type: 'string', description: 'Shown only at creation time' },
            prefix: { type: 'string', example: 'rh_a1b2c3' },
            scopes: {
              type: 'array',
              items: { type: 'string' },
            },
            expiresAt: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    paths: {
      '/api/v1/analyses': {
        get: {
          tags: ['Institutional API'],
          summary: 'List analyses',
          description: 'Returns paginated list of analyses for the API key owner.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['processing', 'complete', 'failed'] },
              description: 'Filter by analysis status',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 20, maximum: 100 },
              description: 'Number of results per page',
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0 },
              description: 'Number of results to skip',
            },
          ],
          responses: {
            200: {
              description: 'List of analyses',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' },
                      analyses: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AnalysisSummary' },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid or missing API key',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/analyses/{id}': {
        get: {
          tags: ['Institutional API'],
          summary: 'Get analysis detail',
          description: 'Returns full analysis with claims, verdicts, and consistency violations.',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Analysis ID',
            },
          ],
          responses: {
            200: {
              description: 'Full analysis detail',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      analysis: { $ref: '#/components/schemas/AnalysisDetail' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Analysis not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/v1/teams': {
        get: {
          tags: ['Institutional API'],
          summary: 'List teams',
          description: 'Returns teams the API key owner belongs to.',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            200: {
              description: 'List of teams',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      teams: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TeamSummary' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/api-keys': {
        post: {
          tags: ['API Key Management'],
          summary: 'Generate API key',
          description: 'Creates a new API key. The raw key is returned only once.',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', example: 'Production Key' },
                    scopes: {
                      type: 'array',
                      items: {
                        type: 'string',
                        enum: ['read:analyses', 'write:analyses', 'read:teams'],
                      },
                      default: ['read:analyses'],
                    },
                    expiryDays: {
                      type: 'integer',
                      enum: [30, 90, 365],
                      description: 'Key expiry in days. Omit for no expiry.',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'API key created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      apiKey: { $ref: '#/components/schemas/ApiKeyResponse' },
                    },
                  },
                },
              },
            },
          },
        },
        get: {
          tags: ['API Key Management'],
          summary: 'List your API keys',
          description: 'Returns all API keys for the logged-in user (without the raw key).',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of API keys',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      apiKeys: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ApiKeyResponse' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;