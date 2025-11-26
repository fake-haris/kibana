/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect, apiTest, tags } from '@kbn/scout';
import beatDetailFixture from './fixtures/detail.json';

apiTest.describe('Beats instance detail', { tag: tags.ESS_ONLY }, () => {
  let adminApiCredentials: { apiKeyHeader: Record<string, string> };
  const archive =
    'x-pack/platform/test/fixtures/es_archives/monitoring/beats_with_restarted_instance';
  const timeRange = {
    min: '2018-02-09T20:49:00Z',
    max: '2018-02-09T21:50:00Z',
  };

  apiTest.beforeAll(async ({ esArchiver, requestAuth }) => {
    adminApiCredentials = await requestAuth.getApiKey('admin');
    await esArchiver.loadIfNeeded(archive);
  });

  apiTest('should summarize beat with metrics', async ({ apiClient }) => {
    const response = await apiClient.post(
      '/api/monitoring/v1/clusters/fHJwISmKTFO8bj57oFBLUQ/beats/beat/60599a4f-8139-4251-b0b9-15866df34221',
      {
        headers: { 'kbn-xsrf': 'xxx', ...adminApiCredentials.apiKeyHeader },
        body: { timeRange },
      }
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(beatDetailFixture);
  });
});
