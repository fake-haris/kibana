/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect, apiTest, tags } from '@kbn/scout';
import beatsClusterFixture from './fixtures/cluster.json';

apiTest.describe('Beats overview', { tag: tags.ESS_ONLY }, () => {
  const archive = 'x-pack/platform/test/fixtures/es_archives/monitoring/beats';
  const timeRange = {
    min: '2017-12-19T18:11:32.000Z',
    max: '2017-12-19T18:14:38.000Z',
  };

  apiTest.beforeAll(async ({ esArchiver }) => {
    await esArchiver.loadIfNeeded(archive);
  });

  apiTest('should summarize beats cluster with metrics', async ({ apiClient }) => {
    const response = await apiClient.post(
      '/api/monitoring/v1/clusters/FlV4ckTxQ0a78hmBkzzc9A/beats',
      {
        headers: { 'kbn-xsrf': 'xxx' },
        body: { timeRange },
      }
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toStrictEqual(beatsClusterFixture);
  });
});
