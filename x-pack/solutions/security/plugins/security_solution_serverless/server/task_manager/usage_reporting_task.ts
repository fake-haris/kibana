/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Response } from 'node-fetch';
import type { CoreSetup, Logger } from '@kbn/core/server';
import type { ConcreteTaskInstance } from '@kbn/task-manager-plugin/server';
import type { CloudSetup } from '@kbn/cloud-plugin/server';

import { getDeleteTaskRunResult } from '@kbn/task-manager-plugin/server/task';

import type {
  MeteringCallback,
  SecurityUsageReportingTaskStartContract,
  SecurityUsageReportingTaskSetupContract,
  UsageRecord,
  BackfillConfig,
} from '../types';
import type { ServerlessSecurityConfig } from '../config';
import type { UsageReportingService } from '../common/services/usage_reporting_service';

import { stateSchemaByVersion, emptyState } from './task_state';

const SCOPE = ['serverlessSecurity'];

export const VERSION = '1.0.0';

export class SecurityUsageReportingTask {
  private wasStarted: boolean = false;
  private abortController = new AbortController();
  private readonly cloudSetup: CloudSetup;
  private readonly taskType: string;
  private readonly version: string;
  private readonly logger: Logger;
  private readonly config: ServerlessSecurityConfig;
  private readonly usageReportingService: UsageReportingService;
  private readonly backfillConfig: BackfillConfig = {
    enabled: false,
  };

  constructor(setupContract: SecurityUsageReportingTaskSetupContract) {
    const {
      core,
      logFactory,
      config,
      taskManager,
      cloudSetup,
      taskType,
      taskTitle,
      version,
      meteringCallback,
      usageReportingService,
      backfillConfig,
    } = setupContract;

    this.cloudSetup = cloudSetup;
    this.taskType = taskType;
    this.version = version;
    this.logger = logFactory.get(this.taskId);
    this.config = config;
    this.usageReportingService = usageReportingService;
    if (backfillConfig) {
      if (backfillConfig.enabled && !backfillConfig.maxRecords) {
        throw new Error('maxRecords is required when backfill is enabled');
      }

      this.backfillConfig = backfillConfig;
    }

    try {
      taskManager.registerTaskDefinitions({
        [taskType]: {
          title: taskTitle,
          timeout: this.config.usageReportingTaskTimeout,
          stateSchemaByVersion,
          createTaskRunner: ({ taskInstance }: { taskInstance: ConcreteTaskInstance }) => {
            return {
              run: async () => {
                return this.runTask(taskInstance, core, meteringCallback);
              },
              cancel: async () => {},
            };
          },
        },
      });
      this.logger.info(`Scheduled task successfully ${taskTitle}`);
    } catch (err) {
      this.logger.error(`Failed to setup task ${taskType}, ${err} `);
    }
  }

  public start = async ({ taskManager, interval }: SecurityUsageReportingTaskStartContract) => {
    if (!taskManager) {
      this.logger.error(`missing required task manager service during start of ${this.taskType}`);
      return;
    }

    this.wasStarted = true;

    try {
      await taskManager.ensureScheduled({
        id: this.taskId,
        taskType: this.taskType,
        scope: SCOPE,
        schedule: {
          interval,
        },
        state: emptyState,
        params: { version: this.version },
      });
    } catch (e) {
      this.logger.error(`Error scheduling task ${this.taskType}, received ${e.message}`);
    }
  };

  private runTask = async (
    taskInstance: ConcreteTaskInstance,
    core: CoreSetup,
    meteringCallback: MeteringCallback
  ) => {
    this.logger.info('Usage reporting task is running.');

    // if task was not `.start()`'d yet, then exit
    if (!this.wasStarted) {
      this.logger.debug('[runTask()] Aborted. Task not started yet');
      return { state: taskInstance.state };
    }
    // Check that this task is current
    if (taskInstance.id !== this.taskId) {
      // old task, die
      this.logger.info(
        `Outdated task version: Got [${taskInstance.id}] from task instance. Current version is [${this.taskId}]`
      );
      return getDeleteTaskRunResult();
    }

    const [{ elasticsearch }] = await core.getStartServices();
    const esClient = elasticsearch.client.asInternalUser;

    const epochDate = new Date();
    epochDate.setFullYear(1969);
    const lastSuccessfulReport: Date =
      (taskInstance.state.lastSuccessfulReport &&
        new Date(taskInstance.state.lastSuccessfulReport)) ||
      epochDate;

    let usageRecords: UsageRecord[] = [];
    let latestRecordTimestamp: Date | undefined;
    let shouldRunAgain = false;
    // save usage record query time, so we can use it to know where
    // the next query range should start
    const meteringCallbackTime = new Date();
    try {
      const meteringCallbackResponse = await meteringCallback({
        esClient,
        cloudSetup: this.cloudSetup,
        logger: this.logger,
        taskId: this.taskId,
        lastSuccessfulReport,
        abortController: this.abortController,
        config: this.config,
      });
      usageRecords = meteringCallbackResponse.records ?? [];
      latestRecordTimestamp = meteringCallbackResponse.latestTimestamp;
      shouldRunAgain = meteringCallbackResponse.shouldRunAgain ?? false;
    } catch (err) {
      this.logger.error(
        `failed to retrieve usage records starting from ${lastSuccessfulReport.toISOString()}: ${err}`
      );
      return { state: taskInstance.state, runAt: new Date() };
    }

    this.logger.debug(() => `received usage records: ${JSON.stringify(usageRecords)}`);

    let usageReportResponse: Response | undefined;
    let backfillRecords: UsageRecord[] = taskInstance.state.backfillRecords || [];

    if (backfillRecords.length > 0) {
      usageRecords = [...backfillRecords, ...usageRecords];
    }

    if (usageRecords.length !== 0) {
      try {
        this.logger.debug(`Sending ${usageRecords.length} usage records to the API`);

        usageReportResponse = await this.usageReportingService.reportUsage(usageRecords);

        if (!usageReportResponse.ok) {
          const errorResponse = await usageReportResponse.json();
          this.logger.error(`API error ${usageReportResponse.status}, ${errorResponse}`);
          return { state: taskInstance.state, runAt: new Date() };
        }

        if (backfillRecords.length > 0) {
          this.logger.debug(
            `${backfillRecords.length} backfill usage records were sent successfully`
          );
        }
        backfillRecords = [];

        this.logger.debug(
          `(${
            usageRecords.length
          }) usage records starting from ${lastSuccessfulReport.toISOString()} were sent successfully: ${
            usageReportResponse.status
          }, ${usageReportResponse.statusText}`
        );
      } catch (err) {
        this.logger.error(
          `Failed to send (${
            usageRecords.length
          }) usage records starting from ${lastSuccessfulReport.toISOString()}: ${err} `
        );
        if (this.backfillConfig.enabled) {
          backfillRecords = [...backfillRecords, ...usageRecords];

          if (
            this.backfillConfig.maxRecords &&
            backfillRecords.length > this.backfillConfig.maxRecords
          ) {
            backfillRecords = backfillRecords.slice(
              backfillRecords.length - this.backfillConfig.maxRecords
            );
          }
        }
      }
    }

    const state = {
      lastSuccessfulReport:
        !usageRecords.length || usageReportResponse?.status === 201
          ? (latestRecordTimestamp || meteringCallbackTime).toISOString()
          : lastSuccessfulReport.toISOString(),
      backfillRecords,
    };

    return shouldRunAgain ? { state, runAt: new Date() } : { state };
  };

  private get taskId() {
    return `${this.taskType}:${this.version}`;
  }
}
