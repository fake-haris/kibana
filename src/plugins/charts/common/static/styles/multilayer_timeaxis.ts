/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Position, type RecursivePartial, type AxisStyle } from '@elastic/charts';

export const MULTILAYER_TIME_AXIS_STYLE: RecursivePartial<AxisStyle> = {
  tickLabel: {
    visible: true,
    padding: 0,
    rotation: 0,
    alignment: {
      vertical: Position.Bottom,
      horizontal: Position.Left,
    },
  },
  tickLine: {
    visible: true,
    size: 0,
    padding: 4,
  },
};
