/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ScoutPage } from '..';

export class UnifiedFieldList {
  constructor(private readonly page: ScoutPage) {}

  async clickFieldListItemAdd(field: string) {
    await this.waitUntilSidebarHasLoaded();

    // Check if field is already selected
    if (await this.isFieldSelected(field)) {
      return;
    }

    // Expand Meta section for special fields
    if (['_score', '_id', '_index'].includes(field)) {
      await this.toggleSidebarSection('meta');
    }

    await this.page.testSubj.hover(`field-${field}`);
    await this.page.testSubj.click(`fieldToggle-${field}`);

    // Wait for field to be selected
    await this.page.waitForTimeout(500);
  }

  async clickFieldListItemRemove(field: string) {
    await this.waitUntilSidebarHasLoaded();

    if (!(await this.isFieldSelected(field))) {
      return;
    }

    await this.page.testSubj.hover(`field-${field}`);
    await this.page.testSubj.click(`fieldToggle-${field}`);
  }

  async isFieldSelected(field: string): Promise<boolean> {
    if (!(await this.page.testSubj.isVisible('fieldListGroupedSelectedFields'))) {
      return false;
    }

    const selectedList = this.page.testSubj.locator('fieldListGroupedSelectedFields');
    const fieldLocator = selectedList.locator(`[data-test-subj="field-${field}"]`);
    return await fieldLocator.isVisible();
  }

  async getAllFieldNames(): Promise<string[]> {
    const sidebar = this.page.testSubj.locator('fieldListGroupedFieldGroups');
    await sidebar.waitFor({ state: 'visible' });
    const fieldButtons = sidebar.locator('.kbnFieldButton__name');
    return await fieldButtons.allInnerTexts();
  }

  async waitUntilSidebarHasLoaded() {
    await this.page.testSubj.waitForSelector('fieldListGroupedFieldGroups', {
      state: 'visible',
      timeout: 10000,
    });
  }

  private async toggleSidebarSection(sectionName: string) {
    const testSubj = `fieldListGrouped${sectionName[0].toUpperCase()}${sectionName.substring(
      1
    )}Fields`;
    const arrow = this.page.locator(`[data-test-subj="${testSubj}"] .euiAccordion__arrow`);
    await arrow.click();
  }
}
