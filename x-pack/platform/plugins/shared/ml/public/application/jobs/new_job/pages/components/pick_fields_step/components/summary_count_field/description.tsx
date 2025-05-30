/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FC, PropsWithChildren } from 'react';
import React, { memo } from 'react';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';
import { EuiDescribedFormGroup, EuiFormRow, EuiLink } from '@elastic/eui';
import type { Validation } from '../../../../../common/job_validator';
import { useMlKibana } from '../../../../../../../contexts/kibana';

interface Props {
  validation: Validation;
  titleId: string;
}

export const Description: FC<PropsWithChildren<Props>> = memo(
  ({ children, validation, titleId }) => {
    const title = i18n.translate('xpack.ml.newJob.wizard.pickFieldsStep.summaryCountField.title', {
      defaultMessage: 'Summary count field',
    });
    const {
      services: { docLinks },
    } = useMlKibana();
    const docsUrl = docLinks.links.ml.aggregations;
    return (
      <EuiDescribedFormGroup
        title={<h3 id={titleId}>{title}</h3>}
        description={
          <FormattedMessage
            id="xpack.ml.newJob.wizard.pickFieldsStep.summaryCountField.description"
            defaultMessage="If the input data is {aggregated}, specify the field that contains the document count."
            values={{
              aggregated: (
                <EuiLink href={docsUrl} target="_blank">
                  <FormattedMessage
                    id="xpack.ml.newJob.wizard.pickFieldsStep.summaryCountField.aggregatedText"
                    defaultMessage="aggregated"
                  />
                </EuiLink>
              ),
            }}
          />
        }
      >
        <EuiFormRow error={validation.message} isInvalid={validation.valid === false}>
          <>{children}</>
        </EuiFormRow>
      </EuiDescribedFormGroup>
    );
  }
);
