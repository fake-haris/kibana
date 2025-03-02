/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { ConditionEntryField } from '@kbn/securitysolution-utils';
import type {
  TrustedAppConditionEntry,
  LinuxConditionEntry,
} from '../../../../../common/endpoint/types';

export const isSignerFieldExcluded = (
  condition: TrustedAppConditionEntry
): condition is LinuxConditionEntry => {
  return (
    condition.field !== ConditionEntryField.SIGNER &&
    condition.field !== ConditionEntryField.SIGNER_MAC
  );
};
