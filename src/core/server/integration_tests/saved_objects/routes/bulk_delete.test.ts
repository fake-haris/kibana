/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import supertest from 'supertest';
import { savedObjectsClientMock } from '../../../mocks';
import type { ICoreUsageStatsClient } from '@kbn/core-usage-data-base-server-internal';
import {
  coreUsageStatsClientMock,
  coreUsageDataServiceMock,
} from '@kbn/core-usage-data-server-mocks';
import {
  createHiddenTypeVariants,
  setupServer,
  SetupServerReturn,
} from '@kbn/core-test-helpers-test-utils';
import {
  registerBulkDeleteRoute,
  type InternalSavedObjectsRequestHandlerContext,
} from '@kbn/core-saved-objects-server-internal';
import { loggerMock } from '@kbn/logging-mocks';
import { deprecationMock, setupConfig } from './routes_test_utils';

const testTypes = [
  { name: 'index-pattern', hide: false },
  { name: 'hidden-from-http', hide: false, hideFromHttpApis: true },
];

describe('POST /api/saved_objects/_bulk_delete', () => {
  let server: SetupServerReturn['server'];
  let createRouter: SetupServerReturn['createRouter'];
  let handlerContext: SetupServerReturn['handlerContext'];
  let savedObjectsClient: ReturnType<typeof savedObjectsClientMock.create>;
  let coreUsageStatsClient: jest.Mocked<ICoreUsageStatsClient>;
  let loggerWarnSpy: jest.SpyInstance;
  let registrationSpy: jest.SpyInstance;

  beforeEach(async () => {
    ({ server, createRouter, handlerContext } = await setupServer());
    savedObjectsClient = handlerContext.savedObjects.client;

    savedObjectsClient.bulkDelete.mockResolvedValue({
      statuses: [],
    });

    handlerContext.savedObjects.typeRegistry.getType.mockImplementation((typename: string) => {
      return testTypes
        .map((typeDesc) => createHiddenTypeVariants(typeDesc))
        .find((fullTest) => fullTest.name === typename);
    });

    const router = createRouter<InternalSavedObjectsRequestHandlerContext>('/api/saved_objects/');
    coreUsageStatsClient = coreUsageStatsClientMock.create();
    coreUsageStatsClient.incrementSavedObjectsBulkDelete.mockRejectedValue(new Error('Oh no!')); // intentionally throw this error, which is swallowed, so we can assert that the operation does not fail
    const coreUsageData = coreUsageDataServiceMock.createSetupContract(coreUsageStatsClient);

    const logger = loggerMock.create();
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation();
    registrationSpy = jest.spyOn(router, 'post');

    const config = setupConfig();
    const access = 'public';

    registerBulkDeleteRoute(router, {
      config,
      coreUsageData,
      logger,
      access,
      deprecationInfo: deprecationMock,
    });

    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('formats successful response and records usage stats', async () => {
    const clientResponse = {
      statuses: [
        {
          id: 'abc123',
          type: 'index-pattern',
          success: true,
        },
      ],
    };
    savedObjectsClient.bulkDelete.mockImplementation(() => Promise.resolve(clientResponse));

    const result = await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send([
        {
          id: 'abc123',
          type: 'index-pattern',
        },
      ])
      .expect(200);

    expect(result.body).toEqual(clientResponse);
    expect(coreUsageStatsClient.incrementSavedObjectsBulkDelete).toHaveBeenCalledWith({
      request: expect.anything(),
      types: ['index-pattern'],
    });
  });

  it('calls upon savedObjectClient.bulkDelete with query options', async () => {
    const docs = [
      {
        id: 'abc123',
        type: 'index-pattern',
      },
    ];

    await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send(docs)
      .query({ force: true })
      .expect(200);

    expect(savedObjectsClient.bulkDelete).toHaveBeenCalledTimes(1);
    expect(savedObjectsClient.bulkDelete).toHaveBeenCalledWith(docs, { force: true });
  });

  it('returns with status 400 when a type is hidden from the HTTP APIs', async () => {
    const result = await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send([
        {
          id: 'hiddenID',
          type: 'hidden-from-http',
        },
      ])
      .expect(400);
    expect(result.body.message).toContain('Unsupported saved object type(s):');
  });

  it('returns with status 400 with `force` when a type is hidden from the HTTP APIs', async () => {
    const result = await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send([
        {
          id: 'hiddenID',
          type: 'hidden-from-http',
        },
      ])
      .query({ force: true })
      .expect(400);
    expect(result.body.message).toContain('Unsupported saved object type(s):');
  });

  it('logs a warning message when called', async () => {
    await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send([
        {
          id: 'hiddenID',
          type: 'hidden-from-http',
        },
      ])
      .expect(400);
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
  });

  it('passes deprecation configuration to the router arguments', async () => {
    await supertest(server.listener)
      .post('/api/saved_objects/_bulk_delete')
      .set('x-elastic-internal-origin', 'kibana')
      .send([
        {
          id: 'hiddenID',
          type: 'hidden-from-http',
        },
      ])
      .expect(400);

    expect(registrationSpy.mock.calls[0][0]).toMatchObject({
      options: { deprecated: deprecationMock },
    });
  });
});
