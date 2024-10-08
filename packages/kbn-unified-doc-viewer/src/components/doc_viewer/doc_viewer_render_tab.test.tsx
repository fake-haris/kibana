/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import React from 'react';
import { mount } from 'enzyme';
import { DocViewRenderTab } from './doc_viewer_render_tab';
import type { DocViewRenderProps } from '../../types';

test('Mounting and unmounting DocViewerRenderTab', () => {
  const unmountFn = jest.fn();
  const renderFn = jest.fn(() => unmountFn);
  const renderProps = {
    hit: {},
  };

  const wrapper = mount(
    <DocViewRenderTab render={renderFn} renderProps={renderProps as DocViewRenderProps} />
  );

  expect(renderFn).toMatchSnapshot();

  wrapper.unmount();

  expect(unmountFn).toBeCalled();
});
