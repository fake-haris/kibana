/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { FtrProviderContext } from '../../../ftr_provider_context';

export default function ({ getService, loadTestFile }: FtrProviderContext) {
  const remoteEsArchiver = getService('remoteEsArchiver' as 'esArchiver');
  const esArchiver = getService('esArchiver');

  describe('management', function () {
    before(async () => {
      await remoteEsArchiver.loadIfNeeded(
        'src/platform/test/functional/fixtures/es_archiver/logstash_functional'
      );
      await esArchiver.loadIfNeeded('src/platform/test/functional/fixtures/es_archiver/makelogs');
    });

    after(async () => {
      await remoteEsArchiver.unload(
        'src/platform/test/functional/fixtures/es_archiver/logstash_functional'
      );
      await esArchiver.unload('src/platform/test/functional/fixtures/es_archiver/makelogs');
    });

    loadTestFile(require.resolve('./_data_views_ccs'));
  });
}
