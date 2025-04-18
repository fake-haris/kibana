/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getCurrentUserAnonymizationFieldsRequest, requestMock } from '../../__mocks__/request';
import { ELASTIC_AI_ASSISTANT_ANONYMIZATION_FIELDS_URL_FIND } from '@kbn/elastic-assistant-common';
import { serverMock } from '../../__mocks__/server';
import { requestContextMock } from '../../__mocks__/request_context';
import { getFindAnonymizationFieldsResultWithSingleHit } from '../../__mocks__/response';
import { findAnonymizationFieldsRoute } from './find_route';
import { loggingSystemMock } from '@kbn/core-logging-server-mocks';
import type { AuthenticatedUser } from '@kbn/core-security-common';

describe('Find user anonymization fields route', () => {
  let server: ReturnType<typeof serverMock.create>;
  let { clients, context } = requestContextMock.createTools();
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;

  beforeEach(async () => {
    server = serverMock.create();
    ({ clients, context } = requestContextMock.createTools());
    const mockUser1 = {
      username: 'my_username',
      authentication_realm: {
        type: 'my_realm_type',
        name: 'my_realm_name',
      },
    } as AuthenticatedUser;

    clients.elasticAssistant.getAIAssistantAnonymizationFieldsDataClient.findDocuments.mockResolvedValue(
      Promise.resolve(getFindAnonymizationFieldsResultWithSingleHit())
    );
    context.elasticAssistant.getCurrentUser.mockResolvedValue({
      username: 'my_username',
      authentication_realm: {
        type: 'my_realm_type',
        name: 'my_realm_name',
      },
    } as AuthenticatedUser);
    logger = loggingSystemMock.createLogger();
    context.elasticAssistant.getCurrentUser.mockResolvedValue(mockUser1);
    findAnonymizationFieldsRoute(server.router, logger);
  });

  describe('status codes', () => {
    test('returns 200', async () => {
      const response = await server.inject(
        getCurrentUserAnonymizationFieldsRequest(),
        requestContextMock.convertContext(context)
      );
      expect(response.status).toEqual(200);
    });

    test('catches error if search throws error', async () => {
      clients.elasticAssistant.getAIAssistantAnonymizationFieldsDataClient.findDocuments.mockRejectedValueOnce(
        new Error('Test error')
      );
      const response = await server.inject(
        getCurrentUserAnonymizationFieldsRequest(),
        requestContextMock.convertContext(context)
      );
      expect(response.status).toEqual(500);
      expect(response.body).toEqual({
        message: 'Test error',
        status_code: 500,
      });
    });
  });

  describe('request validation', () => {
    test('allows optional query params', async () => {
      const request = requestMock.create({
        method: 'get',
        path: ELASTIC_AI_ASSISTANT_ANONYMIZATION_FIELDS_URL_FIND,
        query: {
          page: 2,
          per_page: 20,
          sort_field: 'created_at',
          fields: ['field1', 'field2'],
        },
      });
      const result = server.validate(request);

      expect(result.ok).toHaveBeenCalled();
    });

    test('disallows invalid sort fields', async () => {
      const request = requestMock.create({
        method: 'get',
        path: ELASTIC_AI_ASSISTANT_ANONYMIZATION_FIELDS_URL_FIND,
        query: {
          page: 2,
          per_page: 20,
          sort_field: 'name',
          fields: ['field1', 'field2'],
        },
      });
      const result = server.validate(request);

      expect(result.badRequest).toHaveBeenCalledWith(
        `sort_field: Invalid enum value. Expected 'created_at' | 'anonymized' | 'allowed' | 'field' | 'updated_at', received 'name'`
      );
    });

    test('ignores unknown query params', async () => {
      const request = requestMock.create({
        method: 'get',
        path: ELASTIC_AI_ASSISTANT_ANONYMIZATION_FIELDS_URL_FIND,
        query: {
          invalid_value: 'test 1',
        },
      });
      const result = server.validate(request);

      expect(result.ok).toHaveBeenCalled();
    });
  });
});
