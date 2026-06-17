import { env } from '../config/env.js';

const API_PREFIX_HEADER_NAME = 'x-api-prefix';
const API_PREFIX_VALUE = `/${env.apiVersion}`;

export function createOpenApiDocument() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Template Project API',
      version: '1.0.0',
      description:
        'Swagger documentation for the template-project API bootstrap and versioned health surface.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'System',
        description: 'Runtime and service metadata endpoints',
      },
      {
        name: 'Registration',
        description: 'User registration workflows',
      },
      {
        name: 'Authentication',
        description: 'Login and session lifecycle workflows',
      },
      {
        name: 'Users',
        description: 'User creation and retrieval workflows',
      },
      {
        name: 'Checkout',
        description: 'Checkout and order submission workflows',
      },
    ],
    paths: {
      '/': {
        get: {
          tags: ['System'],
          summary: 'Get API bootstrap metadata',
          responses: {
            '200': {
              description: 'API bootstrap metadata returned successfully',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'template-project API is running' },
                      version: { type: 'string', example: env.apiVersion },
                      docs: { type: 'string', example: '/docs' },
                    },
                    required: ['message', 'version', 'docs'],
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/health`]: {
        get: {
          tags: ['System'],
          summary: 'Get service health status',
          responses: {
            '200': {
              description: 'Service is healthy',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      service: { type: 'string', example: 'template-project-api' },
                      timestamp: { type: 'string', format: 'date-time' },
                    },
                    required: ['status', 'service', 'timestamp'],
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/registration`]: {
        post: {
          tags: ['Registration'],
          summary: 'Register a new user account',
          description: 'Creates a new account after validating email format, uniqueness, and password length.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RegistrationRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Registration accepted and verification email queued.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RegistrationResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Input validation failed. Possible causes: invalid email format, weak password, non-object body, or malformed JSON.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/ValidationErrorResponse' },
                      { $ref: '#/components/schemas/InvalidRequestResponse' },
                      { $ref: '#/components/schemas/InvalidJsonResponse' },
                    ],
                  },
                },
              },
            },
            '409': {
              description: 'The submitted email is already registered.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/DuplicateEmailResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests. Rate limit exceeded.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitedResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Unexpected server error.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InternalErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/login`]: {
        post: {
          tags: ['Authentication'],
          summary: 'Log in with registered credentials',
          description: 'Authenticates a registered user and returns an active session token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LoginRequest',
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authentication succeeded and active session token is returned.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/LoginResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Request body is not a valid JSON object.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/InvalidRequestResponse' },
                      { $ref: '#/components/schemas/InvalidJsonResponse' },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Authentication failed due to unknown email or invalid password.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InvalidCredentialsResponse',
                  },
                },
              },
            },
            '423': {
              description: 'Authentication is blocked for a locked account.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/AccountLockedResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests. Rate limit exceeded.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitedResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Unexpected server error.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InternalErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/users`]: {
        post: {
          tags: ['Users'],
          summary: 'Create a user record',
          description: 'Creates a user record for an authorized actor.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateUserRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created successfully.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateUserResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Create-user request payload is invalid or malformed.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/InvalidRequestResponse' },
                      { $ref: '#/components/schemas/InvalidJsonResponse' },
                    ],
                  },
                },
              },
            },
            '401': {
              description: 'Authorization header is missing or invalid.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UnauthorizedResponse',
                  },
                },
              },
            },
            '409': {
              description: 'User email already exists.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CreateUserDuplicateEmailResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests. Rate limit exceeded.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitedResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Unexpected server error.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InternalErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/users/{id}`]: {
        get: {
          tags: ['Users'],
          summary: 'Get a user by identifier',
          description: 'Returns user details for an authorized request with existing identifier.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'User identifier',
            },
          ],
          responses: {
            '200': {
              description: 'User details returned successfully.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserDetailsResponse',
                  },
                },
              },
            },
            '401': {
              description: 'Authorization header is missing or invalid.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UnauthorizedResponse',
                  },
                },
              },
            },
            '404': {
              description: 'User identifier does not exist.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NotFoundResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests. Rate limit exceeded.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitedResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Unexpected server error.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InternalErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      [`/${env.apiVersion}/checkout`]: {
        post: {
          tags: ['Checkout'],
          summary: 'Submit checkout request',
          description: 'Validates cart, shipping, and payment authorization before creating an order.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CheckoutRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Checkout completed and order confirmation returned.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CheckoutSuccessResponse',
                  },
                },
              },
            },
            '400': {
              description: 'Checkout request failed cart, shipping, body object, or JSON validation.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      { $ref: '#/components/schemas/EmptyCartResponse' },
                      { $ref: '#/components/schemas/InvalidShippingAddressResponse' },
                      { $ref: '#/components/schemas/InvalidRequestResponse' },
                      { $ref: '#/components/schemas/InvalidJsonResponse' },
                    ],
                  },
                },
              },
            },
            '402': {
              description: 'Payment was not authorized and order was not created.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaymentNotAuthorizedResponse',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests. Rate limit exceeded.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitedResponse',
                  },
                },
              },
            },
            '500': {
              description: 'Unexpected server error.',
              headers: {
                [API_PREFIX_HEADER_NAME]: {
                  $ref: '#/components/headers/ApiPrefixHeader',
                },
              },
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/InternalErrorResponse',
                  },
                },
              },
            },
          },
        },
      },
      '/metrics': {
        get: {
          tags: ['System'],
          summary: 'Get Prometheus-style service metrics',
          description: 'Returns runtime counters in Prometheus text exposition format. Only available when METRICS_ENABLED=true.',
          responses: {
            '200': {
              description: 'Metrics returned in Prometheus text format.',
              content: {
                'text/plain': {
                  schema: { type: 'string', example: 'http_requests_total 42' },
                },
              },
            },
            '404': {
              description: 'Metrics endpoint is disabled (METRICS_ENABLED is not set).',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NotFoundResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      headers: {
        ApiPrefixHeader: {
          description: 'Constant response header indicating the active API prefix.',
          schema: {
            type: 'string',
            example: API_PREFIX_VALUE,
          },
        },
      },
      responses: {
        NotImplementedResponse: {
          description: 'Endpoint is documented but not implemented yet.',
          headers: {
            [API_PREFIX_HEADER_NAME]: {
              $ref: '#/components/headers/ApiPrefixHeader',
            },
          },
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotImplementedResponse',
              },
            },
          },
        },
      },
      schemas: {
        NotImplementedResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'not_implemented' },
            message: {
              type: 'string',
              example: 'Endpoint POST /registration is not implemented yet.',
            },
          },
          required: ['error', 'message'],
        },
        RegistrationRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 10 },
          },
          required: ['email', 'password'],
        },
        RegistrationResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'usr_1' },
            email: { type: 'string', format: 'email' },
            verificationEmailQueued: { type: 'boolean', example: true },
          },
          required: ['userId', 'email', 'verificationEmailQueued'],
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['invalid_email', 'invalid_password'] },
            message: { type: 'string' },
          },
          required: ['error', 'message'],
        },
        DuplicateEmailResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['duplicate_email'] },
            message: { type: 'string', example: 'Email already registered.' },
          },
          required: ['error', 'message'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
          required: ['email', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            sessionToken: {
              type: 'string',
              example:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfMSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAzNjAwfQ.signature',
            },
            tokenType: { type: 'string', example: 'Bearer' },
            active: { type: 'boolean', example: true },
          },
          required: ['sessionToken', 'tokenType', 'active'],
        },
        InvalidCredentialsResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['invalid_credentials'] },
            message: { type: 'string', example: 'Invalid credentials.' },
          },
          required: ['error', 'message'],
        },
        AccountLockedResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['account_locked'] },
            message: { type: 'string', example: 'Account is locked.' },
          },
          required: ['error', 'message'],
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
          required: ['email', 'firstName', 'lastName'],
        },
        CreateUserResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'usr_4' },
          },
          required: ['userId'],
        },
        UserDetailsResponse: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'usr_4' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string', example: 'Jane' },
            lastName: { type: 'string', example: 'Doe' },
          },
          required: ['userId', 'email', 'firstName', 'lastName'],
        },
        UnauthorizedResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['unauthorized'] },
            message: { type: 'string', example: 'Authorization required.' },
          },
          required: ['error', 'message'],
        },
        InvalidRequestResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['invalid_request'] },
            message: {
              type: 'string',
              example: 'Email, firstName, and lastName are required.',
            },
          },
          required: ['error', 'message'],
        },
        CreateUserDuplicateEmailResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['duplicate_email'] },
            message: { type: 'string', example: 'Email already exists.' },
          },
          required: ['error', 'message'],
        },
        NotFoundResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['not_found'] },
            message: { type: 'string', example: 'User not found.' },
          },
          required: ['error', 'message'],
        },
        CheckoutRequest: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sku: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                },
                required: ['sku', 'quantity'],
              },
            },
            shippingAddress: {
              type: 'object',
              properties: {
                line1: { type: 'string' },
                city: { type: 'string' },
                postalCode: { type: 'string' },
                country: { type: 'string' },
              },
              required: ['line1', 'city', 'postalCode', 'country'],
            },
            paymentToken: { type: 'string' },
          },
          required: ['items', 'shippingAddress', 'paymentToken'],
        },
        CheckoutSuccessResponse: {
          type: 'object',
          properties: {
            orderReference: { type: 'string', example: 'ord_1' },
            paymentAuthorized: { type: 'boolean', example: true },
            confirmation: { type: 'string', example: 'Checkout completed successfully.' },
          },
          required: ['orderReference', 'paymentAuthorized', 'confirmation'],
        },
        EmptyCartResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['empty_cart'] },
            message: { type: 'string', example: 'Checkout requires at least one cart item.' },
          },
          required: ['error', 'message'],
        },
        InvalidShippingAddressResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['invalid_shipping_address'] },
            message: { type: 'string', example: 'Shipping address fields are mandatory.' },
          },
          required: ['error', 'message'],
        },
        PaymentNotAuthorizedResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['payment_not_authorized'] },
            message: {
              type: 'string',
              example: 'Payment authorization is required before order creation.',
            },
          },
          required: ['error', 'message'],
        },
        RateLimitedResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['rate_limited'] },
            message: { type: 'string', example: 'Too many requests. Try again later.' },
          },
          required: ['error', 'message'],
        },
        InternalErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['internal_error'] },
            message: { type: 'string', example: 'Unexpected server error.' },
          },
          required: ['error', 'message'],
        },
        InvalidJsonResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', enum: ['invalid_json'] },
            message: { type: 'string', example: 'Request body must be valid JSON.' },
          },
          required: ['error', 'message'],
        },
      },
    },
  };
}
