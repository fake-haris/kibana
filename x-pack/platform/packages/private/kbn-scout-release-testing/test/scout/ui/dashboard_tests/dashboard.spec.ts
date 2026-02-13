/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect } from '@kbn/scout/ui';
import { test, tags } from '@kbn/scout';

const defaultSettings = {
  defaultIndex: 'kibana_sample_data_logs',
  'dateFormat:tz': 'UTC',
};

test.describe('Dashboard app', { tag: tags.stateful.classic }, () => {
  test.beforeAll(async ({ kbnClient, apiServices }) => {
    await apiServices.sampleData.install('logs');
    await kbnClient.uiSettings.update(defaultSettings);
  });

  test.beforeEach(async ({ browserAuth, pageObjects }) => {
    await browserAuth.loginAsAdmin();
    await pageObjects.dashboard.goto();
  });

  test.afterAll(async ({ kbnClient, apiServices }) => {
    await apiServices.sampleData.remove('logs');
    await kbnClient.savedObjects.cleanStandardList();
  });

  test('should create dashboard with ES|QL and Lens panels', async ({ page, pageObjects }) => {
    const dashboardName = 'Test Dashboard with Multiple Panels';

    // Open new dashboard
    await pageObjects.dashboard.openNewDashboard();

    // Add ES|QL panel and save it
    await pageObjects.dashboard.addNewPanel('ES|QL');
    await pageObjects.dashboard.applyAndCloseESQLPanel();
    await expect(page.testSubj.locator('lnsVisualizationContainer')).toBeVisible();
    // Add Lens paneln and save it
    await pageObjects.dashboard.addNewPanel('Lens');
    await pageObjects.dashboard.addRecordersAndSave();
    // Verify both Lens and ESQL panels are present
    await expect(page.testSubj.locator('xyVisChart')).toBeVisible();
    await expect(page.testSubj.locator('lnsVisualizationContainer')).toBeVisible();
    await expect.poll(async () => await page.testSubj.locator('dashboardPanel').count()).toBe(2);
    // Add a Custom visualization panel and save it
    await pageObjects.dashboard.addNewPanel('Custom visualization');
    await pageObjects.dashboard.clickVisualizeSaveAndReturn();
    // Verify the Custom visualization panel is present and the previous two panels are still present
    await expect.poll(async () => await page.testSubj.locator('dashboardPanel').count()).toBe(3);
    // Save the dashboard
    await pageObjects.dashboard.saveDashboard(dashboardName);
    // Verify dashboard was saved
    const heading = page.testSubj.locator('breadcrumb last');
    await expect(heading).toHaveText('Editing ' + dashboardName);
  });
});
