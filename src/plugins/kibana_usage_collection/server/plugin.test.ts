/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import {
  coreMock,
  savedObjectsRepositoryMock,
  uiSettingsServiceMock,
} from '@kbn/core/server/mocks';
import {
  CollectorOptions,
  createUsageCollectionSetupMock,
} from '@kbn/usage-collection-plugin/server/mocks';
import { cloudDetailsMock, registerEbtCountersMock } from './plugin.test.mocks';
import { plugin } from '.';
import type { KibanaUsageCollectionPlugin } from './plugin';

describe('kibana_usage_collection', () => {
  let pluginInstance: KibanaUsageCollectionPlugin;

  const usageCollectors: CollectorOptions[] = [];

  const usageCollection = createUsageCollectionSetupMock();
  usageCollection.makeUsageCollector.mockImplementation((opts) => {
    usageCollectors.push(opts);
    return createUsageCollectionSetupMock().makeUsageCollector(opts);
  });
  usageCollection.makeStatsCollector.mockImplementation((opts) => {
    usageCollectors.push(opts);
    return createUsageCollectionSetupMock().makeStatsCollector(opts);
  });

  beforeAll(async () => {
    pluginInstance = await plugin(coreMock.createPluginInitializerContext({}));
  });

  beforeEach(() => {
    cloudDetailsMock.mockClear();
  });

  test('Runs the setup method without issues', async () => {
    const coreSetup = coreMock.createSetup();

    expect(pluginInstance.setup(coreSetup, { usageCollection })).toBe(undefined);

    expect(coreSetup.coreUsageData.registerUsageCounter).toHaveBeenCalled();

    expect(registerEbtCountersMock).toHaveBeenCalledTimes(1);
    expect(registerEbtCountersMock).toHaveBeenCalledWith(coreSetup.analytics, usageCollection);

    await expect(
      Promise.all(
        usageCollectors.map(async (usageCollector) => {
          const isReady = await usageCollector.isReady();
          const type = usageCollector.type;
          return { type, isReady };
        })
      )
    ).resolves.toMatchInlineSnapshot(`
      Array [
        Object {
          "isReady": true,
          "type": "ui_counters",
        },
        Object {
          "isReady": true,
          "type": "usage_counters",
        },
        Object {
          "isReady": false,
          "type": "kibana_stats",
        },
        Object {
          "isReady": true,
          "type": "kibana",
        },
        Object {
          "isReady": true,
          "type": "saved_objects_counts",
        },
        Object {
          "isReady": false,
          "type": "stack_management",
        },
        Object {
          "isReady": false,
          "type": "ui_metric",
        },
        Object {
          "isReady": false,
          "type": "application_usage",
        },
        Object {
          "isReady": false,
          "type": "cloud_provider",
        },
        Object {
          "isReady": true,
          "type": "csp",
        },
        Object {
          "isReady": false,
          "type": "core",
        },
        Object {
          "isReady": false,
          "type": "kibana_config_usage",
        },
        Object {
          "isReady": true,
          "type": "localization",
        },
        Object {
          "isReady": false,
          "type": "event_loop_delays",
        },
      ]
    `);
  });

  test('Runs the start method without issues', () => {
    const coreStart = coreMock.createStart();
    coreStart.savedObjects.createInternalRepository.mockImplementation(() =>
      savedObjectsRepositoryMock.create()
    );
    coreStart.uiSettings.asScopedToClient.mockImplementation(() =>
      uiSettingsServiceMock.createClient()
    );
    cloudDetailsMock.mockReturnValueOnce({
      name: 'my-cloud',
      vm_type: 'big',
      region: 'my-home',
      zone: 'my-home-office',
    });

    expect(pluginInstance.start(coreStart)).toBe(undefined);
    usageCollectors.forEach(({ isReady }) => {
      expect(isReady()).toBe(true); // All should return true at this point
    });
  });

  test('Runs the stop method without issues', () => {
    expect(pluginInstance.stop()).toBe(undefined);
  });
});
