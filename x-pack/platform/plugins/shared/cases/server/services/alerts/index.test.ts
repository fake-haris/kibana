/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { elasticsearchServiceMock, loggingSystemMock } from '@kbn/core/server/mocks';
import { alertsClientMock } from '@kbn/rule-registry-plugin/server/alert_data_client/alerts_client.mock';
import { CaseStatuses } from '../../../common/types/domain';
import { AlertService } from '.';

describe('updateAlertsStatus', () => {
  const esClient = elasticsearchServiceMock.createElasticsearchClient();
  const logger = loggingSystemMock.create().get('case');
  const alertsClient = alertsClientMock.create();
  let alertService: AlertService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2022-02-21T17:35:00Z'));

    alertService = new AlertService(esClient, logger, alertsClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('happy path', () => {
    it('updates the status of the alert correctly', async () => {
      const args = [{ id: 'alert-id-1', index: '.siem-signals', status: CaseStatuses.closed }];

      await alertService.updateAlertsStatus(args);

      expect(esClient.updateByQuery.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": ".siem-signals",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "alert-id-1",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'closed';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'closed'
                    }",
            },
          },
        ]
      `);
    });

    it('buckets the alerts by index', async () => {
      const args = [
        { id: 'id1', index: '1', status: CaseStatuses.closed },
        { id: 'id2', index: '1', status: CaseStatuses.closed },
      ];

      await alertService.updateAlertsStatus(args);

      expect(esClient.updateByQuery).toBeCalledTimes(1);
      expect(esClient.updateByQuery.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "1",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id1",
                  "id2",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'closed';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'closed'
                    }",
            },
          },
        ]
      `);
    });

    it('translates in-progress to acknowledged', async () => {
      const args = [{ id: 'id1', index: '1', status: CaseStatuses['in-progress'] }];

      await alertService.updateAlertsStatus(args);

      expect(esClient.updateByQuery).toBeCalledTimes(1);
      expect(esClient.updateByQuery.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "1",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id1",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'acknowledged';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'acknowledged'
                    }",
            },
          },
        ]
      `);
    });

    it('makes two calls when the statuses are different', async () => {
      const args = [
        { id: 'id1', index: '1', status: CaseStatuses.closed },
        { id: 'id2', index: '1', status: CaseStatuses.open },
      ];

      await alertService.updateAlertsStatus(args);

      expect(esClient.updateByQuery).toBeCalledTimes(2);
      // id1 should be closed
      expect(esClient.updateByQuery.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "1",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id1",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'closed';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'closed'
                    }",
            },
          },
        ]
      `);

      // id2 should be open
      expect(esClient.updateByQuery.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "1",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id2",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'open';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'open'
                    }",
            },
          },
        ]
      `);
    });

    it('makes two calls when the indices are different', async () => {
      const args = [
        { id: 'id1', index: '1', status: CaseStatuses.closed },
        { id: 'id2', index: '2', status: CaseStatuses.open },
      ];

      await alertService.updateAlertsStatus(args);

      expect(esClient.updateByQuery).toBeCalledTimes(2);
      // id1 should be closed in index 1
      expect(esClient.updateByQuery.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "1",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id1",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'closed';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'closed'
                    }",
            },
          },
        ]
      `);

      // id2 should be open in index 2
      expect(esClient.updateByQuery.mock.calls[1]).toMatchInlineSnapshot(`
        Array [
          Object {
            "conflicts": "abort",
            "ignore_unavailable": true,
            "index": "2",
            "query": Object {
              "ids": Object {
                "values": Array [
                  "id2",
                ],
              },
            },
            "script": Object {
              "lang": "painless",
              "source": "if (ctx._source['kibana.alert.workflow_status'] != null) {
                      ctx._source['kibana.alert.workflow_status'] = 'open';
                      ctx._source['kibana.alert.workflow_status_updated_at'] = '2022-02-21T17:35:00.000Z';
                    }
                    if (ctx._source.signal != null && ctx._source.signal.status != null) {
                      ctx._source.signal.status = 'open'
                    }",
            },
          },
        ]
      `);
    });

    it('ignores empty indices', async () => {
      await alertService.updateAlertsStatus([
        { id: 'alert-id-1', index: '', status: CaseStatuses.open },
      ]);

      expect(esClient.updateByQuery).not.toHaveBeenCalled();
    });
  });

  describe('getAlerts', () => {
    const docs = [
      {
        _index: '.internal.alerts-security.alerts-default-000001',
        _id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
        _version: 2,
        _seq_no: 255,
        _primary_term: 1,
        found: true,
        _source: {
          destination: { mac: 'ff:ff:ff:ff:ff:ff' },
          source: { bytes: 444, mac: '11:1f:1e:13:15:14', packets: 6 },
          ecs: { version: '8.0.0' },
        },
      },
    ];

    esClient.mget.mockResolvedValue({ docs });

    it('returns the alerts correctly', async () => {
      const res = await alertService.getAlerts([
        {
          index: '.internal.alerts-security.alerts-default-000001',
          id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
        },
      ]);

      expect(esClient.mget).toHaveBeenCalledWith({
        docs: [
          {
            _id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
            _index: '.internal.alerts-security.alerts-default-000001',
          },
        ],
      });

      expect(res).toEqual({ docs });
    });

    it('returns undefined if the id is empty', async () => {
      const res = await alertService.getAlerts([
        {
          index: '.internal.alerts-security.alerts-default-000001',
          id: '',
        },
      ]);

      expect(res).toBe(undefined);
    });

    it('returns undefined if the index is empty', async () => {
      const res = await alertService.getAlerts([
        {
          index: '',
          id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
        },
      ]);

      expect(res).toBe(undefined);
    });
  });

  describe('bulkUpdateCases', () => {
    const alerts = [
      {
        id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
        index: '.internal.alerts-security.alerts-default-000001',
      },
    ];
    const caseIds = ['test-case'];

    it('update case info', async () => {
      await alertService.bulkUpdateCases({ alerts, caseIds });

      expect(alertsClient.bulkUpdateCases).toBeCalledWith({ alerts, caseIds });
    });

    it('filters out alerts with empty id', async () => {
      await alertService.bulkUpdateCases({
        alerts: [{ id: '', index: 'test-index' }, ...alerts],
        caseIds,
      });

      expect(alertsClient.bulkUpdateCases).toBeCalledWith({ alerts, caseIds });
    });

    it('filters out alerts with empty index', async () => {
      await alertService.bulkUpdateCases({
        alerts: [{ id: 'test-id', index: '' }, ...alerts],
        caseIds,
      });

      expect(alertsClient.bulkUpdateCases).toBeCalledWith({ alerts, caseIds });
    });

    it('does not call the alerts client with no alerts', async () => {
      await alertService.bulkUpdateCases({
        alerts: [{ id: '', index: 'test-index' }],
        caseIds,
      });

      expect(alertsClient.bulkUpdateCases).not.toHaveBeenCalled();
    });
  });

  describe('removeCaseIdFromAlerts', () => {
    const alerts = [
      {
        id: 'c3869d546717e8c581add9cbf7d24578f34cd3e72cbc8d8b8e9a9330a899f70f',
        index: '.internal.alerts-security.alerts-default-000001',
      },
    ];
    const caseId = 'test-case';

    it('update case info', async () => {
      await alertService.removeCaseIdFromAlerts({ alerts, caseId });

      expect(alertsClient.removeCaseIdFromAlerts).toBeCalledWith({ alerts, caseId });
    });

    it('filters out alerts with empty id', async () => {
      await alertService.removeCaseIdFromAlerts({
        alerts: [{ id: '', index: 'test-index' }, ...alerts],
        caseId,
      });

      expect(alertsClient.removeCaseIdFromAlerts).toBeCalledWith({ alerts, caseId });
    });

    it('filters out alerts with empty index', async () => {
      await alertService.removeCaseIdFromAlerts({
        alerts: [{ id: 'test-id', index: '' }, ...alerts],
        caseId,
      });

      expect(alertsClient.removeCaseIdFromAlerts).toBeCalledWith({ alerts, caseId });
    });

    it('does not call the alerts client with no alerts', async () => {
      await alertService.removeCaseIdFromAlerts({
        alerts: [{ id: '', index: 'test-index' }],
        caseId,
      });

      expect(alertsClient.removeCaseIdFromAlerts).not.toHaveBeenCalled();
    });

    it('should not throw an error and log it', async () => {
      alertsClient.removeCaseIdFromAlerts.mockRejectedValueOnce('An error');

      await expect(
        alertService.removeCaseIdFromAlerts({ alerts, caseId })
      ).resolves.not.toThrowError();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed removing case test-case from alerts: An error'
      );
    });
  });

  describe('removeCaseIdsFromAllAlerts', () => {
    const caseIds = ['test-case-1', 'test-case-2'];

    it('remove all case ids from alerts', async () => {
      await alertService.removeCaseIdsFromAllAlerts({ caseIds });

      expect(alertsClient.removeCaseIdsFromAllAlerts).toBeCalledWith({ caseIds });
    });

    it('does not call the alerts client with no case ids', async () => {
      await alertService.removeCaseIdsFromAllAlerts({
        caseIds: [],
      });

      expect(alertsClient.removeCaseIdsFromAllAlerts).not.toHaveBeenCalled();
    });

    it('should not throw an error and log it', async () => {
      alertsClient.removeCaseIdsFromAllAlerts.mockRejectedValueOnce('An error');

      await expect(
        alertService.removeCaseIdsFromAllAlerts({ caseIds })
      ).resolves.not.toThrowError();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed removing cases test-case-1,test-case-2 for all alerts: An error'
      );
    });
  });
});
