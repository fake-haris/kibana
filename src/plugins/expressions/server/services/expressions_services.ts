/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { CoreSetup } from '@kbn/core/server';
import { ExpressionsService as CommonExpressionsService } from '../../common';
import { getUiSettingFn } from '../expression_functions';

export class ExpressionsService extends CommonExpressionsService {
  setup({ getStartServices }: Pick<CoreSetup, 'getStartServices'>) {
    this.registerFunction(getUiSettingFn({ getStartServices }));

    return super.setup();
  }
}
