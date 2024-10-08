/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { getNormalizedDataStreams } from '../../../../../../common/services';

import { installIndexTemplatesAndPipelines } from '../../install_index_template_pipeline';

import type { InstallContext } from '../_state_machine_package_install';
import { withPackageSpan } from '../../utils';
import { deletePrerequisiteAssets, splitESAssets, cleanupComponentTemplate } from '../../remove';
import { INSTALL_STATES } from '../../../../../../common/types';

export async function stepInstallIndexTemplatePipelines(context: InstallContext) {
  const { esClient, savedObjectsClient, packageInstallContext, logger, installedPkg } = context;
  const { packageInfo } = packageInstallContext;
  const esReferences = context.esReferences ?? [];

  if (packageInfo.type === 'integration') {
    logger.debug(
      `Package install - Installing index templates and pipelines, packageInfo.type: ${packageInfo.type}`
    );
    const { installedTemplates, esReferences: templateEsReferences } = await withPackageSpan(
      'Install index templates and pipelines with packageInfo integration',
      () =>
        installIndexTemplatesAndPipelines({
          installedPkg: installedPkg ? installedPkg.attributes : undefined,
          packageInstallContext,
          esClient,
          savedObjectsClient,
          logger,
          esReferences,
        })
    );
    return {
      esReferences: templateEsReferences,
      indexTemplates: installedTemplates,
    };
  }

  if (packageInfo.type === 'input' && installedPkg) {
    // input packages create their data streams during package policy creation
    // we must use installed_es to infer which streams exist first then
    // we can install the new index templates
    logger.debug(`Package install - packageInfo.type: ${packageInfo.type}`);
    const dataStreamNames = installedPkg.attributes.installed_es
      .filter((ref) => ref.type === 'index_template')
      // index templates are named {type}-{dataset}, remove everything before first hyphen
      .map((ref) => ref.id.replace(/^[^-]+-/, ''));

    const dataStreams = dataStreamNames.flatMap((dataStreamName) =>
      getNormalizedDataStreams(packageInfo, dataStreamName)
    );

    if (dataStreams.length) {
      const { installedTemplates, esReferences: templateEsReferences } = await withPackageSpan(
        'Install index templates and pipelines with packageInfo input',
        () =>
          installIndexTemplatesAndPipelines({
            installedPkg: installedPkg ? installedPkg.attributes : undefined,
            packageInstallContext,
            esClient,
            savedObjectsClient,
            logger,
            esReferences,
            onlyForDataStreams: dataStreams,
          })
      );
      return { esReferences: templateEsReferences, indexTemplates: installedTemplates };
    }
  }
}

export async function cleanupIndexTemplatePipelinesStep(context: InstallContext) {
  const { logger, esClient, installedPkg, retryFromLastState, force, initialState } = context;

  // In case of retry clean up previous installed assets
  if (
    !force &&
    retryFromLastState &&
    initialState === INSTALL_STATES.INSTALL_INDEX_TEMPLATE_PIPELINES &&
    installedPkg?.attributes?.installed_es &&
    installedPkg.attributes.installed_es.length > 0
  ) {
    const { installed_es: installedEs } = installedPkg.attributes;
    const { indexTemplatesAndPipelines, indexAssets, transformAssets } = splitESAssets(installedEs);

    logger.debug('Retry transition - clean up prerequisite ES assets first');
    await withPackageSpan('Retry transition - clean up prerequisite ES assets first', async () => {
      await deletePrerequisiteAssets(
        {
          indexAssets,
          transformAssets,
          indexTemplatesAndPipelines,
        },
        esClient
      );
    });
    logger.debug('Retry transition - clean up component template');
    await withPackageSpan('Retry transition - clean up component template', async () => {
      await cleanupComponentTemplate(installedEs, esClient);
    });
  }
}
