/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ScoutPage } from '..';

export class QueryBar {
  constructor(private readonly page: ScoutPage) {}

  async getQueryString(): Promise<string> {
    return (await this.page.testSubj.getAttribute('queryInput', 'value')) || '';
  }

  async setQuery(query: string): Promise<void> {
    await this.page.testSubj.click('queryInput');
    const input = this.page.testSubj.locator('queryInput');
    await input.clear();
    await input.fill(query);

    // Verify the query was set correctly
    const currentQuery = await this.getQueryString();
    if (currentQuery !== query) {
      throw new Error(`Failed to set query input to ${query}, instead query is ${currentQuery}`);
    }
  }

  async clearQuery(): Promise<void> {
    await this.setQuery('');
    await this.page.keyboard.press('Tab'); // move outside of input
    await this.page.keyboard.press('Tab'); // move to next element
  }

  async submitQuery(): Promise<void> {
    await this.page.testSubj.click('queryInput');
    await this.page.keyboard.press('Enter');
    await this.page.waitForLoadingIndicatorHidden();
  }

  async clickQuerySubmitButton(): Promise<void> {
    await this.page.testSubj.click('querySubmitButton');
  }
}
