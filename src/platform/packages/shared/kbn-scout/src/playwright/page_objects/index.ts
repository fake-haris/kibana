/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { ScoutPage } from '..';
import type { ScoutLogger } from '../../common';
import type { ScoutTestConfig } from '../../types';
import { CollapsibleNav } from './collapsible_nav';
import { DashboardApp } from './dashboard_app';
import { DatePicker } from './date_picker';
import { DiscoverApp } from './discover_app';
import { FilterBar } from './fiter_bar';
import { Inspector } from './inspector';
import { MapsPage } from './maps_page';
import { QueryBar } from './query_bar';
import { RenderablePage } from './renderable_page';
import { TimePicker } from './time_picker';
import { Toasts } from './toasts';
import { UnifiedFieldList } from './unified_field_list';
import { createLazyPageObject } from './utils';

export interface PageObjectsFixtures {
  page: ScoutPage;
  config: ScoutTestConfig;
  log: ScoutLogger;
}

export interface PageObjects {
  datePicker: DatePicker;
  discover: DiscoverApp;
  dashboard: DashboardApp;
  filterBar: FilterBar;
  inspector: Inspector;
  maps: MapsPage;
  queryBar: QueryBar;
  renderable: RenderablePage;
  timePicker: TimePicker;
  collapsibleNav: CollapsibleNav;
  toasts: Toasts;
  unifiedFieldList: UnifiedFieldList;
}

/**
 * Creates a set of core page objects, each lazily instantiated on first access.
 *
 * @param page - `ScoutPage` instance used for initializing page objects.
 * @returns An object containing lazy-loaded core page objects.
 */
export function createCorePageObjects(fixtures: PageObjectsFixtures): PageObjects {
  return {
    datePicker: createLazyPageObject(DatePicker, fixtures.page),
    dashboard: createLazyPageObject(DashboardApp, fixtures.page),
    discover: createLazyPageObject(DiscoverApp, fixtures.page),
    filterBar: createLazyPageObject(FilterBar, fixtures.page),
    inspector: createLazyPageObject(Inspector, fixtures.page),
    maps: createLazyPageObject(MapsPage, fixtures.page),
    queryBar: createLazyPageObject(QueryBar, fixtures.page),
    renderable: createLazyPageObject(RenderablePage, fixtures.page),
    timePicker: createLazyPageObject(TimePicker, fixtures.page),
    collapsibleNav: createLazyPageObject(CollapsibleNav, fixtures.page, fixtures.config),
    toasts: createLazyPageObject(Toasts, fixtures.page),
    unifiedFieldList: createLazyPageObject(UnifiedFieldList, fixtures.page),
    // Add new page objects here
  };
}
