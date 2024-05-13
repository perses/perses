// Copyright (c) 2019 The Jaeger Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { Dropdown, Tooltip } from 'antd';
import { TooltipPlacement } from 'antd/es/tooltip';
import NewWindowIcon from '../../common/NewWindowIcon';
import { SpanReference } from '../../../types/trace';

import './ReferencesButton.css';
import ReferenceLink from '../url/ReferenceLink';

type TReferencesButtonProps = {
  references: SpanReference[];
  children: React.ReactNode;
  tooltipText: string;
  focusSpan: (spanID: string) => void;
};

// ReferencesButton is displayed as a menu at the span level.
// Example: https://github.com/jaegertracing/jaeger-ui/assets/94157520/2b29921a-2225-4a01-9018-1a1952f186ef
export default class ReferencesButton extends React.PureComponent<TReferencesButtonProps> {
  referencesList = (references: SpanReference[]) => {
    const dropdownItems = references.map(ref => {
      const { span, spanID } = ref;
      return {
        key: `${spanID}`,
        label: (
          <ReferenceLink
            reference={ref}
            focusSpan={this.props.focusSpan}
            className="ReferencesButton--TraceRefLink"
          >
            {span
              ? `${span.process.serviceName}:${span.operationName} - ${ref.spanID}`
              : `(another trace) - ${ref.spanID}`}
            {!span && <NewWindowIcon />}
          </ReferenceLink>
        ),
      };
    });
    return dropdownItems;
  };

  render() {
    const { references, children, tooltipText, focusSpan } = this.props;

    const tooltipProps = {
      arrowPointAtCenter: true,
      mouseLeaveDelay: 0.5,
      placement: 'bottom' as TooltipPlacement,
      title: tooltipText,
      overlayClassName: 'ReferencesButton--tooltip',
    };

    if (references.length > 1) {
      return (
        <Tooltip {...tooltipProps}>
          <Dropdown
            menu={{ items: this.referencesList(references) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <a className="ReferencesButton-MultiParent">{children}</a>
          </Dropdown>
        </Tooltip>
      );
    }
    const ref = references[0];
    return (
      <Tooltip {...tooltipProps}>
        <ReferenceLink reference={ref} focusSpan={focusSpan} className="ReferencesButton-MultiParent">
          {children}
        </ReferenceLink>
      </Tooltip>
    );
  }
}
