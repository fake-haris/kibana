/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { kibanaPackageJson as pkg } from '@kbn/repo-info';

import { getVersionInfo } from '../version_info';

jest.mock('../get_build_number');

describe('isRelease = true', () => {
  it('returns unchanged package.version, build sha, and build number', async () => {
    const versionInfo = await getVersionInfo({
      isRelease: true,
      pkg,
    });

    expect(versionInfo).toHaveProperty('buildVersion', pkg.version);
    expect(versionInfo).toHaveProperty('buildSha', expect.stringMatching(/^[0-9a-f]{40}$/));
    expect(versionInfo).toHaveProperty('buildNumber');
    expect(versionInfo.buildNumber).toBeGreaterThan(1000);
  });
});

describe('isRelease = false', () => {
  it('returns snapshot version, build sha, and build number', async () => {
    const versionInfo = await getVersionInfo({
      isRelease: false,
      pkg,
    });

    expect(versionInfo).toHaveProperty('buildVersion', expect.stringContaining(pkg.version));
    expect(versionInfo).toHaveProperty('buildVersion', expect.stringMatching(/-SNAPSHOT$/));
    expect(versionInfo).toHaveProperty('buildSha', expect.stringMatching(/^[0-9a-f]{40}$/));
    expect(versionInfo).toHaveProperty('buildNumber');
    expect(versionInfo.buildNumber).toBeGreaterThan(1000);
  });
});

describe('versionQualifier', () => {
  it('appends a version qualifier', async () => {
    const versionInfo = await getVersionInfo({
      isRelease: true,
      versionQualifier: 'beta55',
      pkg,
    });

    expect(versionInfo).toHaveProperty('buildVersion', pkg.version + '-beta55');
  });
});
