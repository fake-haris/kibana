/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { expect, test } from '@kbn/scout';

const defaultSettings = {
  defaultIndex: 'd3d7af60-4c81-11e8-b3d7-01146121b73d',
  'dateFormat:tz': 'UTC',
};

test.describe.only('Dashboard app', { tag: ['@ess'] }, () => {
  test.beforeAll(async ({ kbnClient, esArchiver }) => {
    await kbnClient.importExport.load(
      'src/platform/test/functional/fixtures/kbn_archiver/dashboard/current/kibana'
    );
    await esArchiver.loadIfNeeded(
      'src/platform/test/functional/fixtures/es_archiver/kibana_sample_data_flights'
    );
    await kbnClient.uiSettings.update(defaultSettings);
  });

  test.beforeEach(async ({ browserAuth, pageObjects }) => {
    await browserAuth.loginAsAdmin();
    await pageObjects.dashboard.goto();
  });

  test.afterAll(async ({ kbnClient }) => {
    await kbnClient.savedObjects.clean({ types: ['dashboard', 'index-pattern'] });
  });

  test('should create dashboard with ES|QL and Lens panels', async ({ page, pageObjects }) => {
    const dashboardName = 'Test Dashboard with Multiple Panels';

    // Open new dashboard
    await pageObjects.dashboard.openNewDashboard();

    // Add ES|QL panel
    pageObjects.dashboard.addPanelFromLibrary('ES|QL');
    // Apply the ES|QL panel
    pageObjects.dashboard.applyAndCloseESQLPanel();
    // Verify ES|QL panel is present
    await expect(page.testSubj.locator('lens-embeddable')).toBeVisible();

    // Add Lens panel
    await pageObjects.dashboard.addPanelFromLibrary('Lens');
    // Apply the Lens panel
    await pageObjects.dashboard.addRecordersAndSave();

    // Verify both Lens and ESQL panels are present
    await expect(page.testSubj.locator('echChart')).toBeVisible();
    await expect(page.testSubj.locator('lens-embeddable')).toBeVisible();

    // Save the dashboard
    await pageObjects.dashboard.saveDashboard(dashboardName);

    // Verify dashboard was saved and contains both panels
    const heading = page.testSubj.locator('breadcrumb last');
    await expect(heading).toHaveText('Editing' + dashboardName);
  });
});
