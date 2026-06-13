import { environment } from './environment';

/**
 * Static OpenAPI 3.0 spec for the Fabric IQ Ontology AI Generator API.
 *
 * Hand-written (rather than JSDoc-driven) so the schema lives in one place
 * and `npm run build` does not depend on annotation scanning.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fabric IQ Ontology AI Generator API',
    version: '0.1.0',
    description:
      'REST API powering the Fabric IQ Ontology AI Generator. Provides ' +
      'authentication (OTP + Microsoft Entra), user management, ontology CRUD ' +
      'and workflow transitions, Foundry agent chat, and Microsoft Fabric ' +
      'deployment triggers.',
    license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' }
  },
  servers: [
    { url: '/', description: 'Same-origin (default)' }
  ],
  tags: [
    { name: 'Health' },
    { name: 'Auth', description: 'OTP and Microsoft Entra sign-in' },
    { name: 'Users', description: 'App-owner user administration' },
    { name: 'Ontologies', description: 'Business ontology CRUD + workflow' },
    { name: 'Datasources', description: 'Fabric lakehouse / OneLake configuration' },
    { name: 'Generate', description: 'AI-assisted ontology drafting' },
    { name: 'Agents', description: 'Foundry agent chat proxies' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Application JWT issued by /api/auth/otp/verify or /api/auth/entra/login.'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          code: { type: 'string' }
        },
        required: ['message']
      },
      AuthMethodRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      },
      AuthMethodResponse: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          method: { type: 'string', enum: ['otp', 'entra_id'] }
        }
      },
      OtpRequest: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } }
      },
      OtpVerifyRequest: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 4, maxLength: 8 }
        }
      },
      EntraLoginRequest: {
        type: 'object',
        required: ['idToken'],
        properties: { idToken: { type: 'string' } }
      },
      AuthSession: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'Bearer JWT' },
          expiresAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          role: { type: 'string', enum: ['guest', 'business_user', 'it_user', 'admin', 'app_owner'] },
          authMethod: { type: 'string', enum: ['otp', 'entra_id', 'guest'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          lastLoginAt: { type: 'string', format: 'date-time' }
        }
      },
      UserCreateRequest: {
        type: 'object',
        required: ['email', 'role', 'authMethod'],
        properties: {
          email: { type: 'string', format: 'email' },
          displayName: { type: 'string' },
          role: { type: 'string', enum: ['guest', 'business_user', 'it_user', 'admin', 'app_owner'] },
          authMethod: { type: 'string', enum: ['otp', 'entra_id', 'guest'] }
        }
      },
      UserUpdateRequest: {
        type: 'object',
        properties: {
          displayName: { type: 'string' },
          role: { type: 'string', enum: ['guest', 'business_user', 'it_user', 'admin', 'app_owner'] },
          authMethod: { type: 'string', enum: ['otp', 'entra_id', 'guest'] }
        }
      },
      LoginAuditRecord: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          at: { type: 'string', format: 'date-time' },
          method: { type: 'string', enum: ['otp', 'entra_id', 'guest'] },
          outcome: { type: 'string', enum: ['success', 'failure'] },
          email: { type: 'string', format: 'email' },
          userId: { type: 'string' },
          displayName: { type: 'string' },
          role: { type: 'string', enum: ['guest', 'business_user', 'it_user', 'admin', 'app_owner'] },
          reason: { type: 'string' },
          ipAddress: { type: 'string' },
          userAgent: { type: 'string' }
        }
      },
      Ontology: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['draft', 'pending-binding', 'pending-deployment', 'deployed']
          },
          entities: {
            type: 'array',
            items: { $ref: '#/components/schemas/OntologyEntity' }
          },
          relationships: {
            type: 'array',
            items: { $ref: '#/components/schemas/OntologyRelationship' }
          },
          owner: { type: 'string', format: 'email' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      OntologyEntity: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          properties: {
            type: 'array',
            items: { $ref: '#/components/schemas/OntologyProperty' }
          }
        }
      },
      OntologyProperty: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          dataType: { type: 'string' },
          description: { type: 'string' },
          boundTable: { type: 'string' },
          boundField: { type: 'string' }
        }
      },
      OntologyRelationship: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          target: { type: 'string' },
          type: { type: 'string' },
          description: { type: 'string' }
        }
      },
      GenerateRequest: {
        type: 'object',
        required: ['businessCase'],
        properties: {
          businessCase: { type: 'string' },
          industry: { type: 'string' },
          targetEntities: { type: 'integer', minimum: 1, maximum: 50 }
        }
      },
      AgentChatRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          threadId: { type: 'string' },
          message: { type: 'string' }
        }
      },
      AgentChatResponse: {
        type: 'object',
        properties: {
          threadId: { type: 'string' },
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'tool'] },
                content: { type: 'string' }
              }
            }
          }
        }
      },
      DatasourceConfig: {
        type: 'object',
        properties: {
          workspaceId: { type: 'string' },
          lakehouseId: { type: 'string' },
          defaultDatabase: { type: 'string' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Liveness probe',
        security: [],
        responses: {
          200: {
            description: 'Service is running.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    service: { type: 'string' },
                    environment: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/auth/method': {
      post: {
        tags: ['Auth'],
        summary: 'Resolve sign-in method (OTP vs Entra) for an email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthMethodRequest' } } }
        },
        responses: {
          200: {
            description: 'Method resolution.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthMethodResponse' } } }
          },
          404: { description: 'Email not allow-listed.' }
        }
      }
    },
    '/api/auth/otp/request': {
      post: {
        tags: ['Auth'],
        summary: 'Send a one-time passcode via email',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OtpRequest' } } }
        },
        responses: { 204: { description: 'OTP dispatched.' } }
      }
    },
    '/api/auth/otp/verify': {
      post: {
        tags: ['Auth'],
        summary: 'Verify OTP and return a session JWT',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OtpVerifyRequest' } } }
        },
        responses: {
          200: {
            description: 'OTP verified.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSession' } } }
          },
          401: { description: 'Invalid or expired OTP.' }
        }
      }
    },
    '/api/auth/entra/login': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a Microsoft Entra id_token for an app JWT',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/EntraLoginRequest' } } }
        },
        responses: {
          200: {
            description: 'Token exchanged.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthSession' } } }
          },
          401: { description: 'Invalid id_token.' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Return the current session user',
        responses: {
          200: {
            description: 'Current user.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
          },
          401: { description: 'Unauthenticated.' }
        }
      }
    },
    '/api/auth/audit': {
      get: {
        tags: ['Auth'],
        summary: 'List recent successful and failed login attempts',
        responses: {
          200: {
            description: 'Recent login audit records.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/LoginAuditRecord' }
                }
              }
            }
          },
          401: { description: 'Unauthenticated.' },
          403: { description: 'Forbidden.' }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List app users (app-owner only)',
        responses: {
          200: {
            description: 'User list.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreateRequest' } } }
        },
        responses: {
          201: { description: 'User created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } }
        }
      }
    },
    '/api/users/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } }
      ],
      put: {
        tags: ['Users'],
        summary: 'Update an existing user',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserUpdateRequest' } } }
        },
        responses: { 200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } }
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove a user',
        responses: { 204: { description: 'Deleted.' } }
      }
    },
    '/api/ontologies': {
      get: {
        tags: ['Ontologies'],
        summary: 'List ontologies the caller can see',
        responses: {
          200: {
            description: 'Ontology list.',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Ontology' } } } }
          }
        }
      },
      post: {
        tags: ['Ontologies'],
        summary: 'Create a new ontology',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } },
        responses: { 201: { description: 'Created.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } } }
      }
    },
    '/api/ontologies/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      get: {
        tags: ['Ontologies'],
        summary: 'Get an ontology by id',
        responses: {
          200: { description: 'Ontology.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } },
          404: { description: 'Not found.' }
        }
      },
      put: {
        tags: ['Ontologies'],
        summary: 'Replace an ontology',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } },
        responses: { 200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } } }
      },
      delete: {
        tags: ['Ontologies'],
        summary: 'Delete an ontology',
        responses: { 204: { description: 'Deleted.' } }
      }
    },
    '/api/ontologies/{id}/submit-for-binding': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Ontologies'],
        summary: 'Move from draft to pending-binding (IT review)',
        responses: { 200: { description: 'Transitioned.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } } }
      }
    },
    '/api/ontologies/{id}/submit-for-deployment': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Ontologies'],
        summary: 'Move from pending-binding to pending-deployment (admin review)',
        responses: { 200: { description: 'Transitioned.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } } }
      }
    },
    '/api/ontologies/{id}/deploy': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
      post: {
        tags: ['Ontologies'],
        summary: 'Deploy a pending ontology to Microsoft Fabric',
        responses: {
          202: {
            description: 'Deployment dispatched.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ontologyId: { type: 'string' },
                    workflowRunUrl: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/datasources': {
      get: {
        tags: ['Datasources'],
        summary: 'List configured datasources',
        responses: { 200: { description: 'Datasources.' } }
      }
    },
    '/api/datasources/config': {
      get: {
        tags: ['Datasources'],
        summary: 'Read Fabric/OneLake configuration',
        responses: {
          200: { description: 'Configuration.', content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasourceConfig' } } } }
        }
      },
      put: {
        tags: ['Datasources'],
        summary: 'Update Fabric/OneLake configuration',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasourceConfig' } } } },
        responses: { 200: { description: 'Updated.', content: { 'application/json': { schema: { $ref: '#/components/schemas/DatasourceConfig' } } } } }
      }
    },
    '/api/generate': {
      post: {
        tags: ['Generate'],
        summary: 'AI-draft an ontology from a business case',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/GenerateRequest' } } } },
        responses: {
          200: { description: 'Drafted ontology.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ontology' } } } }
        }
      }
    },
    '/api/agents/ontology-generator/chat': {
      post: {
        tags: ['Agents'],
        summary: 'Chat with the Foundry ontology-generator agent (business users)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AgentChatRequest' } } } },
        responses: {
          200: { description: 'Agent reply.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AgentChatResponse' } } } }
        }
      }
    },
    '/api/agents/ontology-data-binder/chat': {
      post: {
        tags: ['Agents'],
        summary: 'Chat with the Foundry ontology-data-binder agent (IT users)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AgentChatRequest' } } } },
        responses: {
          200: { description: 'Agent reply.', content: { 'application/json': { schema: { $ref: '#/components/schemas/AgentChatResponse' } } } }
        }
      }
    }
  }
} as const;

export const openApiInfo = {
  title: openApiSpec.info.title,
  version: openApiSpec.info.version,
  serviceMode: environment.nodeEnv
};
