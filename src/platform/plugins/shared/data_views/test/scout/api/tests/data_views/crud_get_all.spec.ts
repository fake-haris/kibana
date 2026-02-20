/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { apiTest, tags, type RoleApiCredentials } from '@kbn/scout';
import { expect } from '@kbn/scout/api';
import { COMMON_HEADERS, SERVICE_PATH, SERVICE_KEY } from '../../fixtures/constants';

apiTest.describe(
  `GET ${SERVICE_PATH} - get all (data view api)`,
  { tag: tags.deploymentAgnostic },
  () => {
    let adminApiCredentials: RoleApiCredentials;

    apiTest.beforeAll(async ({ requestAuth }) => {
      adminApiCredentials = await requestAuth.getApiKey('admin');
    });

    apiTest(`returns list of ${SERVICE_KEY}s`, async ({ apiClient }) => {
      const response = await apiClient.get(SERVICE_PATH, {
        headers: {
          ...COMMON_HEADERS,
          ...adminApiCredentials.apiKeyHeader,
        },
        responseType: 'json',
      });

      expect(response.statusCode).toBe(200);
      expect(response.body[SERVICE_KEY]).toBeDefined();
      expect(Array.isArray(response.body[SERVICE_KEY])).toBe(true);
    });
  }
);
