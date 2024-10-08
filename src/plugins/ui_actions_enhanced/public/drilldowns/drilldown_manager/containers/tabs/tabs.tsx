/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import * as React from 'react';
import { EuiSpacer, EuiTabbedContent, EuiTabbedContentProps } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { useDrilldownManager } from '../context';
import { FormDrilldownWizard } from '../form_drilldown_wizard';
import { DrilldownList } from '../drilldown_list';
import { TemplatePicker } from '../template_picker';

export const txtCreateNew = i18n.translate(
  'uiActionsEnhanced.drilldowns.containers.DrilldownManager.createNew',
  {
    defaultMessage: 'Create new',
  }
);

export const txtManage = i18n.translate(
  'uiActionsEnhanced.drilldowns.containers.DrilldownManager.manage',
  {
    defaultMessage: 'Manage',
  }
);

const tabs: EuiTabbedContentProps['tabs'] = [
  {
    id: 'create',
    name: txtCreateNew,
    content: (
      <>
        <EuiSpacer />
        <FormDrilldownWizard />
        <EuiSpacer size={'l'} />
        <TemplatePicker />
      </>
    ),
  },
  {
    id: 'manage',
    name: txtManage,
    content: (
      <>
        <EuiSpacer />
        <DrilldownList />
      </>
    ),
  },
];

export const Tabs: React.FC = ({}) => {
  const drilldowns = useDrilldownManager();
  const route = drilldowns.useRoute();

  return (
    <EuiTabbedContent
      tabs={tabs}
      selectedTab={tabs.find(({ id }) => id === route[0])}
      onTabClick={({ id }) => drilldowns.setRoute([id])}
    />
  );
};
