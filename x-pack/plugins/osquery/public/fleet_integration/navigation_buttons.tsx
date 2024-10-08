/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiFlexGroup, EuiFlexItem, EuiCard, EuiIcon } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useCallback, useMemo } from 'react';

import { PLUGIN_ID } from '../../common';
import { useKibana, isModifiedEvent, isLeftClickEvent } from '../common/lib/kibana';

interface NavigationButtonsProps {
  isDisabled?: boolean;
  agentPolicyIds?: string[];
}

const NavigationButtonsComponent: React.FC<NavigationButtonsProps> = ({
  isDisabled = false,
  agentPolicyIds,
}) => {
  const {
    application: { getUrlForApp, navigateToApp },
  } = useKibana().services;

  const agentPolicyIdsQueryParam = useMemo(
    () => agentPolicyIds?.map((id) => `agentPolicyId=${id}`).join('&'),
    [agentPolicyIds]
  );
  const liveQueryHref = useMemo(
    () =>
      getUrlForApp(PLUGIN_ID, {
        path: agentPolicyIds?.length
          ? `/live_queries/new?${agentPolicyIdsQueryParam}`
          : '/live_queries/new',
      }),
    [agentPolicyIdsQueryParam, agentPolicyIds?.length, getUrlForApp]
  );

  const liveQueryClick = useCallback(
    (event: any) => {
      if (!isModifiedEvent(event) && isLeftClickEvent(event)) {
        event.preventDefault();
        navigateToApp(PLUGIN_ID, {
          path: agentPolicyIds?.length
            ? `/live_queries/new?${agentPolicyIdsQueryParam}`
            : '/live_queries/new',
        });
      }
    },
    [agentPolicyIdsQueryParam, agentPolicyIds?.length, navigateToApp]
  );

  const packsHref = getUrlForApp(PLUGIN_ID, {
    path: `/packs`,
  });

  const packsClick = useCallback(
    (event: any) => {
      if (!isModifiedEvent(event) && isLeftClickEvent(event)) {
        event.preventDefault();
        navigateToApp(PLUGIN_ID, {
          path: `/packs`,
        });
      }
    },
    [navigateToApp]
  );

  return (
    <EuiFlexGroup gutterSize="l">
      <EuiFlexItem>
        <EuiCard
          icon={<EuiIcon size="xl" type="console" />}
          title={i18n.translate('xpack.osquery.fleetIntegration.runLiveQueriesButtonText', {
            defaultMessage: 'Run live queries',
          })}
          href={liveQueryHref}
          onClick={liveQueryClick}
          description={''}
          isDisabled={isDisabled}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiCard
          icon={<EuiIcon size="xl" type="clock" />}
          title={i18n.translate('xpack.osquery.fleetIntegration.packsButtonText', {
            defaultMessage: 'Packs',
          })}
          description={''}
          isDisabled={isDisabled}
          href={packsHref}
          onClick={packsClick}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

NavigationButtonsComponent.displayName = 'NavigationButtonsComponent';

export const NavigationButtons = React.memo(NavigationButtonsComponent);
