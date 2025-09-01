/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { RoleApiCredentials } from '@kbn/scout';
import { apiTest, expect } from '@kbn/scout';
import { disableStreams, enableStreams, linkRule, unlinkRule } from '../../../helpers/requests';
import type { StreamsSupertestRepositoryClient } from '../../../helpers/repository_client';
import { createStreamsRepositoryAdminClient } from '../../../helpers/repository_client';

apiTest.describe('Streams Asset Rule Links', { tag: ['@ess', '@svlOblt'] }, () => {
  let adminApiCredentials: RoleApiCredentials;
  let apiClient: StreamsSupertestRepositoryClient;

  const SPACE_ID = 'default';
  const archive = 'x-pack/platform/test/api_integration/fixtures/kbn_archives/streams/rules.json';

  const FIRST_RULE_ASSET_LINKING = '09cef989-3ded-4a1e-b2b0-53d491d13397';
  const SECOND_RULE_ASSET_LINKING = '312638da-43d1-4d6e-8fb8-9cae201cdd3a';

  apiTest.beforeAll(async ({ requestAuth, esArchiver }) => {
    adminApiCredentials = await requestAuth.getApiKey('admin');
    apiClient = await createStreamsRepositoryAdminClient(adminApiCredentials);
    await enableStreams(apiClient);
    await esArchiver.importExport.load(archive, { space: SPACE_ID });
  });

  apiTest.afterAll(async ({ esArchiver }) => {
    await disableStreams(apiClient);
    await esArchiver.importExport.unload(archive, { space: SPACE_ID });
  });

  apiTest.describe('after linking a rule', () => {
    apiTest.beforeAll(async () => {
      await linkRule(apiClient, 'logs', FIRST_RULE_ASSET_LINKING);
    });

    apiTest.afterAll(async () => {
      await unlinkRule(apiClient, 'logs', FIRST_RULE_ASSET_LINKING);
    });

    apiTest('lists the rule in the stream response', async () => {
      const response = await apiClient.fetch('GET /api/streams/{name} 2023-10-31', {
        params: { path: { name: 'logs' } },
      });

      expect(response.status).toBe(200);
      expect(response.body.rules?.length).toBe(1);
    });

    apiTest('lists the rule in the rules get response', async () => {
      const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
        params: { path: { name: 'logs' } },
      });

      expect(response.status).toBe(200);
      expect(response.body.rules.length).toBe(1);
    });

    apiTest.describe('add second rule', () => {
      apiTest.beforeAll(async () => {
        await linkRule(apiClient, 'logs', SECOND_RULE_ASSET_LINKING);
      });

      apiTest.afterAll(async () => {
        await unlinkRule(apiClient, 'logs', SECOND_RULE_ASSET_LINKING);
      });

      apiTest('lists the second rule in the stream response', async () => {
        const response = await apiClient.fetch('GET /api/streams/{name} 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules?.length).toBe(2);
      });

      apiTest('lists the second rule in the rules get response', async () => {
        const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules.length).toBe(2);
      });

      apiTest('unlinking one rule keeps the other', async () => {
        await unlinkRule(apiClient, 'logs', FIRST_RULE_ASSET_LINKING);

        const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules.length).toBe(1);
      });
    });

    apiTest.describe('after disabling', () => {
      apiTest.beforeAll(async () => {
        // disabling and re-enabling streams wipes the asset links
        await disableStreams(apiClient);
        await enableStreams(apiClient);
      });

      apiTest('dropped all rules', async () => {
        const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules.length).toBe(0);
      });

      apiTest('recovers on write and lists the linked rule', async () => {
        await linkRule(apiClient, 'logs', FIRST_RULE_ASSET_LINKING);

        const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules.length).toBe(1);
      });
    });

    apiTest.describe('after deleting the rule', () => {
      apiTest.beforeAll(async ({ esArchiver }) => {
        await esArchiver.importExport.unload(archive, { space: SPACE_ID });
      });

      apiTest.afterAll(async ({ esArchiver }) => {
        // Reload the rule archive for other tests
        await esArchiver.load(archive, { space: SPACE_ID });
      });

      apiTest('no longer lists the rule as a linked asset', async () => {
        const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
          params: { path: { name: 'logs' } },
        });

        expect(response.status).toBe(200);
        expect(response.body.rules.length).toBe(0);
      });
    });
  });

  apiTest.describe('on unmanaged Classic stream', () => {
    apiTest.beforeAll(async ({ esArchiver }) => {
      await esArchiver.indices.createDataStream({
        name: 'logs-testlogs-default',
      });
    });

    apiTest.afterAll(async ({ esArchiver }) => {
      await esArchiver.indices.deleteDataStream({
        name: 'logs-testlogs-default',
      });
    });

    apiTest('does not list any rules but returns 200', async () => {
      const response = await apiClient.fetch('GET /api/streams/{name}/rules 2023-10-31', {
        params: { path: { name: 'logs-testlogs-default' } },
      });

      expect(response.status).toBe(200);
      expect(response.body.rules.length).toBe(0);
    });
  });
});
