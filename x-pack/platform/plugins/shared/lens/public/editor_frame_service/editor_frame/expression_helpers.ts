/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { Ast, fromExpression } from '@kbn/interpreter';
import type { DateRange } from '../../../common/types';
import { DatasourceStates } from '../../state_management';
import type { Visualization, DatasourceMap, DatasourceLayers, IndexPatternMap } from '../../types';

export function getDatasourceExpressionsByLayers(
  datasourceMap: DatasourceMap,
  datasourceStates: DatasourceStates,
  indexPatterns: IndexPatternMap,
  dateRange: DateRange,
  nowInstant: Date,
  searchSessionId?: string,
  forceDSL?: boolean
): undefined | Record<string, Ast> {
  const datasourceExpressions: Array<[string, Ast | string]> = [];

  Object.entries(datasourceMap).forEach(([datasourceId, datasource]) => {
    const state = datasourceStates[datasourceId]?.state;
    if (!state) {
      return;
    }

    const layers = datasource.getLayers(state);

    layers.forEach((layerId) => {
      const result = datasource.toExpression(
        state,
        layerId,
        indexPatterns,
        dateRange,
        nowInstant,
        searchSessionId,
        forceDSL
      );
      if (result) {
        datasourceExpressions.push([layerId, result]);
      }
    });
  });

  if (datasourceExpressions.length === 0) {
    return undefined;
  }

  return datasourceExpressions.reduce(
    (exprs, [layerId, expr]) => ({
      ...exprs,
      [layerId]: typeof expr === 'string' ? fromExpression(expr) : expr,
    }),
    {}
  );
}

export function buildExpression({
  visualization,
  visualizationState,
  datasourceMap,
  datasourceStates,
  datasourceLayers,
  title,
  description,
  indexPatterns,
  dateRange,
  nowInstant,
  searchSessionId,
  forceDSL,
}: {
  title?: string;
  description?: string;
  visualization: Visualization | null;
  visualizationState: unknown;
  datasourceMap: DatasourceMap;
  datasourceStates: DatasourceStates;
  datasourceLayers: DatasourceLayers;
  indexPatterns: IndexPatternMap;
  searchSessionId?: string;
  dateRange: DateRange;
  nowInstant: Date;
  forceDSL?: boolean;
}): Ast | null {
  // if an unregistered visualization is passed in the SO
  // then this will be set as "undefined". Relax the check to catch both
  if (visualization == null) {
    return null;
  }

  const datasourceExpressionsByLayers = getDatasourceExpressionsByLayers(
    datasourceMap,
    datasourceStates,
    indexPatterns,
    dateRange,
    nowInstant,
    searchSessionId,
    forceDSL
  );

  const visualizationExpression = visualization.toExpression(
    visualizationState,
    datasourceLayers,
    {
      title,
      description,
    },
    datasourceExpressionsByLayers
  );

  if (!datasourceExpressionsByLayers || visualizationExpression === null) {
    return null;
  }

  return typeof visualizationExpression === 'string'
    ? fromExpression(visualizationExpression)
    : visualizationExpression;
}
