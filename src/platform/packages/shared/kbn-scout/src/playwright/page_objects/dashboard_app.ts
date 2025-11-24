/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ScoutPage } from '..';
import expect from '..';

type CommonlyUsedTimeRange =
  | 'Today'
  | 'Last_15 minutes'
  | 'Last_1 hour'
  | 'Last_24 hours'
  | 'Last_30 days'
  | 'Last_90 days'
  | 'Last_1 year';

export class DashboardApp {
  constructor(private readonly page: ScoutPage) {}

  async goto() {
    await this.page.gotoApp('dashboards');
  }

  async waitForListingTableToLoad() {
    return this.page.testSubj.waitForSelector('table-is-ready', { state: 'visible' });
  }

  async openNewDashboard() {
    await this.page.testSubj.click('newItemButton');
    await this.page.testSubj.waitForSelector('emptyDashboardWidget', { state: 'visible' });
  }

  async saveDashboard(name: string) {
    await this.page.testSubj.click('dashboardInteractiveSaveMenuItem');
    await this.page.testSubj.fill('savedObjectTitle', name);
    await this.page.testSubj.click('confirmSaveSavedObjectButton');
    await this.page.testSubj.waitForSelector('confirmSaveSavedObjectButton', { state: 'hidden' });
  }

  async saveChangesToExistingDashboard() {
    await this.page.testSubj.click('dashboardQuickSaveMenuItem');
    await expect(this.page.testSubj.locator('dashboardQuickSaveMenuItem')).toBeDisabled();
  }

  async addPanelFromLibrary(...names: string[]) {
    await this.page.testSubj.click('dashboardAddTopNavButton');
    await this.page.testSubj.click('dashboardAddFromLibraryButton');
    for (let i = 0; i < names.length; i++) {
      // clear search input after the first panel is added
      if (i > 0) {
        await this.page.testSubj.clearInput('savedObjectFinderSearchInput');
      }
      await this.page.testSubj.typeWithDelay('savedObjectFinderSearchInput', names[i]);
      await this.page.testSubj.click(`savedObjectTitle${names[i].replace(/ /g, '-')}`);
      // wait for the panel to be added
      await this.page.testSubj.waitForSelector(
        `embeddablePanelHeading-${names[i].replace(/[- ]/g, '')}`,
        {
          state: 'visible',
        }
      );
    }
    // close the flyout
    await this.page.testSubj.click('euiFlyoutCloseButton');
    await this.page.testSubj.waitForSelector('euiFlyoutCloseButton', { state: 'hidden' });
  }

  async customizePanel(options: {
    name: string;
    customTimeRageCommonlyUsed?: {
      value: CommonlyUsedTimeRange;
    };
  }) {
    await this.page.testSubj.hover(`embeddablePanelHeading-${options.name.replace(/ /g, '')}`);
    await this.page.testSubj.click('embeddablePanelAction-ACTION_CUSTOMIZE_PANEL');
    if (options.customTimeRageCommonlyUsed) {
      await this.page.testSubj.click('customizePanelShowCustomTimeRange');
      await this.page.testSubj.click(
        'customizePanelTimeRangeDatePicker > superDatePickerToggleQuickMenuButton'
      );
      await this.page.testSubj.click(
        `superDatePickerCommonlyUsed_${options.customTimeRageCommonlyUsed.value}`
      );
    }

    await this.page.testSubj.click('saveCustomizePanelButton');
    await this.page.testSubj.waitForSelector('saveCustomizePanelButton', { state: 'hidden' });
  }

  async removePanel(name: string | 'embeddableError') {
    const panelHeaderTestSubj =
      name === 'embeddableError' ? name : `embeddablePanelHeading-${name.replace(/ /g, '')}`;
    await this.page.testSubj.locator(panelHeaderTestSubj).scrollIntoViewIfNeeded();
    await this.page.testSubj.locator(panelHeaderTestSubj).hover();
    await this.page.testSubj.click('embeddablePanelToggleMenuIcon');
    await this.page.testSubj.click('embeddablePanelAction-deletePanel');
    await this.page.testSubj.waitForSelector(panelHeaderTestSubj, {
      state: 'hidden',
    });
  }

  async waitForPanelsToLoad(
    expectedCount: number,
    options: { timeout: number; selector: string } = {
      timeout: 20000,
      selector: '[data-test-subj="embeddablePanel"][data-render-complete="true"]',
    }
  ) {
    const startTime = Date.now();

    while (Date.now() - startTime < options.timeout) {
      const count = await this.page.locator(options.selector).count();
      if (count === expectedCount) return;
      // Short polling interval
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await this.page.waitForTimeout(100);
    }

    throw new Error(`Timeout waiting for ${expectedCount} elements matching ${options.selector}`);
  }

  async addNewPanel(panelType: 'ES|QL' | 'Lens' | 'Custom visualization') {
    await this.page.testSubj.click('dashboardAddTopNavButton');
    await this.page.testSubj.click('dashboardOpenAddPanelFlyoutButton');
    await this.page.testSubj.click(`create-action-${panelType}`);
    await this.page.testSubj.waitForSelector('dashboardPanelSelectionFlyout', { state: 'hidden' });
  }

  async addRecordersAndSave() {
    await this.page.testSubj
      .locator('lnsFieldListPanelField-___records___')
      .dragTo(this.page.testSubj.locator('workspace-drag-drop-prompt'));
    await this.page.testSubj.waitForSelector('echScreenReaderSummary', { state: 'visible' });
    await this.page.testSubj.click('lnsApp_saveAndReturnButton');
    await this.page.testSubj.waitForSelector('echChart', { state: 'visible' });
  }

  async applyAndCloseESQLPanel() {
    await this.page.testSubj.click('applyFlyoutButton');
    await this.page.testSubj.waitForSelector('lens-embeddable', { state: 'visible' });
  }
}
