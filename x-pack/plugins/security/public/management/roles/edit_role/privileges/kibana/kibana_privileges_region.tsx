/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { Component } from 'react';

import type { Capabilities } from '@kbn/core/public';
import type { KibanaPrivileges } from '@kbn/security-role-management-model';
import type { Space, SpacesApiUi } from '@kbn/spaces-plugin/public';

import { SimplePrivilegeSection } from './simple_privilege_section';
import { SpaceAwarePrivilegeSection } from './space_aware_privilege_section';
import { TransformErrorSection } from './transform_error_section';
import type { Role } from '../../../../../../common';
import { CollapsiblePanel } from '../../collapsible_panel';
import type { RoleValidator } from '../../validate_role';

interface Props {
  role: Role;
  spacesEnabled: boolean;
  canCustomizeSubFeaturePrivileges: boolean;
  spaces?: Space[];
  uiCapabilities: Capabilities;
  editable: boolean;
  kibanaPrivileges: KibanaPrivileges;
  onChange: (role: Role) => void;
  validator: RoleValidator;
  spacesApiUi?: SpacesApiUi;
}

export class KibanaPrivilegesRegion extends Component<Props, {}> {
  public render() {
    return (
      <CollapsiblePanel iconType={'logoKibana'} title={'Kibana'}>
        {this.getForm()}
      </CollapsiblePanel>
    );
  }

  public getForm = () => {
    const {
      kibanaPrivileges,
      role,
      spacesEnabled,
      canCustomizeSubFeaturePrivileges,
      spaces = [],
      uiCapabilities,
      onChange,
      editable,
      validator,
      spacesApiUi,
    } = this.props;

    if (role._transform_error && role._transform_error.includes('kibana')) {
      return <TransformErrorSection />;
    }

    if (spacesApiUi && spacesEnabled) {
      return (
        <SpaceAwarePrivilegeSection
          kibanaPrivileges={kibanaPrivileges}
          role={role}
          spaces={spaces}
          uiCapabilities={uiCapabilities}
          onChange={onChange}
          editable={editable}
          canCustomizeSubFeaturePrivileges={canCustomizeSubFeaturePrivileges}
          validator={validator}
          spacesApiUi={spacesApiUi}
        />
      );
    }

    return (
      <SimplePrivilegeSection
        kibanaPrivileges={kibanaPrivileges}
        role={role}
        onChange={onChange}
        editable={editable}
        canCustomizeSubFeaturePrivileges={canCustomizeSubFeaturePrivileges}
      />
    );
  };
}
