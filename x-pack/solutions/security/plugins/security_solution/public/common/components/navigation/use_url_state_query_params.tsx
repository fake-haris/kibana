/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useCallback, useMemo } from 'react';
import type { SecurityPageName } from '../../../app/types';
import { useGlobalQueryString } from '../../utils/global_query_string';
import { useGetLinkInfo } from '../../links/links_hooks';

export const useUrlStateQueryParams = (pageName: SecurityPageName) => {
  const getUrlStateQueryParams = useGetUrlStateQueryParams();
  const urlStateQueryParams = useMemo(
    () => getUrlStateQueryParams(pageName),
    [getUrlStateQueryParams, pageName]
  );
  return urlStateQueryParams;
};

export const useGetUrlStateQueryParams = () => {
  const globalQueryString = useGlobalQueryString();
  const getLinkInfo = useGetLinkInfo();

  const getUrlStateQueryParams = useCallback(
    (pageName: SecurityPageName) => {
      const { skipUrlState = false } = getLinkInfo(pageName) ?? {};
      return !skipUrlState && globalQueryString ? `?${globalQueryString}` : '';
    },
    [getLinkInfo, globalQueryString]
  );
  return getUrlStateQueryParams;
};
