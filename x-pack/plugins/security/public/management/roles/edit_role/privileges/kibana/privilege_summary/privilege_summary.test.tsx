/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act } from '@testing-library/react';
import React from 'react';

import { coreMock } from '@kbn/core/public/mocks';
import {
  createKibanaPrivileges,
  kibanaFeatures,
} from '@kbn/security-role-management-model/src/__fixtures__';
import { spacesManagerMock } from '@kbn/spaces-plugin/public/spaces_manager/mocks';
import { getUiApi } from '@kbn/spaces-plugin/public/ui_api';
import { findTestSubject, mountWithIntl } from '@kbn/test-jest-helpers';

import { PrivilegeSummary } from './privilege_summary';
import { PrivilegeSummaryTable } from './privilege_summary_table';
import type { RoleKibanaPrivilege } from '../../../../../../../common';

const createRole = (roleKibanaPrivileges: RoleKibanaPrivilege[]) => ({
  name: 'some-role',
  elasticsearch: {
    cluster: [],
    indices: [],
    run_as: [],
  },
  kibana: roleKibanaPrivileges,
});

const spaces = [
  {
    id: 'default',
    name: 'Default Space',
    disabledFeatures: [],
  },
];
const spacesManager = spacesManagerMock.create();
const { getStartServices } = coreMock.createSetup();
const spacesApiUi = getUiApi({ spacesManager, getStartServices });

describe('PrivilegeSummary', () => {
  it('initially renders a button', () => {
    const kibanaPrivileges = createKibanaPrivileges(kibanaFeatures);

    const role = createRole([
      {
        base: ['all'],
        feature: {},
        spaces: ['default'],
      },
    ]);

    const wrapper = mountWithIntl(
      <PrivilegeSummary
        spaces={spaces}
        kibanaPrivileges={kibanaPrivileges}
        role={role}
        canCustomizeSubFeaturePrivileges={true}
        spacesApiUi={spacesApiUi}
      />
    );

    expect(findTestSubject(wrapper, 'viewPrivilegeSummaryButton')).toHaveLength(1);
    expect(wrapper.find(PrivilegeSummaryTable)).toHaveLength(0);
  });

  it('clicking the button renders the privilege summary table', async () => {
    const kibanaPrivileges = createKibanaPrivileges(kibanaFeatures);

    const role = createRole([
      {
        base: ['all'],
        feature: {},
        spaces: ['default'],
      },
    ]);

    const wrapper = mountWithIntl(
      <PrivilegeSummary
        spaces={spaces}
        kibanaPrivileges={kibanaPrivileges}
        role={role}
        canCustomizeSubFeaturePrivileges={true}
        spacesApiUi={spacesApiUi}
      />
    );

    await act(async () => {
      findTestSubject(wrapper, 'viewPrivilegeSummaryButton').simulate('click');
    });
    wrapper.update();
    expect(wrapper.find(PrivilegeSummaryTable)).toHaveLength(1);
  });
});
