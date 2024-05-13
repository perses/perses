// Copyright (c) 2017 Uber Technologies, Inc.
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

/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import { Dropdown } from 'antd';
import { IoOpenOutline, IoList, IoCopyOutline } from 'react-icons/io5';
import { JsonView, allExpanded, collapseAllNested, defaultStyles } from 'react-json-view-lite';

import CopyIcon from '../../../common/CopyIcon';

import { TNil } from '../../../../types';
import { KeyValuePair, Link } from '../../../../types/trace';

import './KeyValuesTable.css';

const jsonObjectOrArrayStartRegex = /^(\[|\{)/;

function tryParseJson(value: string) {
  // if the value is a string representing actual json object or array, then use json-markup
  // otherwise just return as is
  try {
    return jsonObjectOrArrayStartRegex.test(value) ? JSON.parse(value) : value;
  } catch (_) {
    return value;
  }
}

function shouldDisplayAsStringList(key: string) {
  return key.startsWith('http.request.header.') || key.startsWith('http.response.header.');
}

const stringListMarkup = (value: any[]) => (
  <div className="json-markup">
    {value.map((item, i) => (
      <>
        {i > 0 && ', '}
        <span className="json-markup-string">{item}</span>
      </>
    ))}
  </div>
);

const scalarMarkup = (value: string | Number | Boolean) => {
  let className;
  switch (typeof value) {
    case 'boolean': {
      className = 'json-markup-bool';
      break;
    }
    case 'number': {
      className = 'json-markup-number';
      break;
    }
    default: {
      className = 'json-markup-string';
    }
  }
  return (
    <div className="json-markup">
      <span className={className}>{value.toString()}</span>
    </div>
  );
};

function formatValue(key: string, value: any) {
  let content;
  let parsed = value;

  if (typeof value === 'string') {
    parsed = tryParseJson(value);
  }

  if (Array.isArray(parsed) && shouldDisplayAsStringList(key)) {
    content = stringListMarkup(parsed);
  } else if (typeof parsed === 'object') {
    const shouldJsonTreeExpand = Object.keys(parsed).length <= 10;

    content = (
      <JsonView
        data={parsed}
        shouldExpandNode={shouldJsonTreeExpand ? allExpanded : collapseAllNested}
        style={{
          ...defaultStyles,
          container: 'json-markup',
          label: 'json-markup-key',
          stringValue: 'json-markup-string',
          collapseIcon: 'json-markup-icon-collapse',
          collapsedContent: 'json-markup-collapse-content',
          expandIcon: 'json-markup-icon-expand',
          numberValue: 'json-markup-number',
          booleanValue: 'json-markup-bool',
          nullValue: 'json-markup-null',
          undefinedValue: 'json-markup-undefined',
          basicChildStyle: 'json-markup-child',
          punctuation: 'json-markup-puncuation',
          otherValue: 'json-markup-other',
        }}
      />
    );
  } else {
    content = scalarMarkup(parsed);
  }

  return <div className="ub-inline-block">{content}</div>;
}

export const LinkValue = (props: { href: string; title?: string; children: React.ReactNode }) => (
  <a href={props.href} title={props.title} target="_blank" rel="noopener noreferrer">
    {props.children} <IoOpenOutline className="KeyValueTable--linkIcon" />
  </a>
);

LinkValue.defaultProps = {
  title: '',
};

const linkValueList = (links: Link[]) => {
  const dropdownItems = links.map(({ text, url }, index) => ({
    label: <LinkValue href={url}>{text}</LinkValue>,
    key: `${url}-${index}`,
  }));
  return dropdownItems;
};

type KeyValuesTableProps = {
  data: KeyValuePair[];
  linksGetter: ((pairs: KeyValuePair[], index: number) => Link[]) | TNil;
};

// KeyValuesTable is displayed as a menu at span level.
// Example: https://github.com/jaegertracing/jaeger-ui/assets/94157520/b518cad9-cb37-4775-a3d6-b667a1235f89
export default function KeyValuesTable(props: KeyValuesTableProps) {
  const { data, linksGetter } = props;

  return (
    <div className="KeyValueTable u-simple-scrollbars">
      <table className="u-width-100">
        <tbody className="KeyValueTable--body">
          {data.map((row, i) => {
            const jsonTable = formatValue(row.key, row.value);
            const links = linksGetter ? linksGetter(data, i) : null;
            let valueMarkup;
            if (links?.length === 1) {
              valueMarkup = (
                <div>
                  <LinkValue href={links[0].url} title={links[0].text}>
                    {jsonTable}
                  </LinkValue>
                </div>
              );
            } else if (links && links.length > 1) {
              valueMarkup = (
                <div>
                  <Dropdown
                    menu={{ items: linkValueList(links) }}
                    placement="bottomRight"
                    trigger={['click']}
                  >
                    <a>
                      {jsonTable} <IoList className="KeyValueTable--linkIcon" />
                    </a>
                  </Dropdown>
                </div>
              );
            } else {
              valueMarkup = jsonTable;
            }
            return (
              // `i` is necessary in the key because row.key can repeat
              // eslint-disable-next-line react/no-array-index-key
              <tr className="KeyValueTable--row" key={`${row.key}-${i}`}>
                <td className="KeyValueTable--keyColumn">{row.key}</td>
                <td>{valueMarkup}</td>
                <td className="KeyValueTable--copyColumn">
                  <CopyIcon
                    className="KeyValueTable--copyIcon"
                    copyText={row.value}
                    tooltipTitle="Copy value"
                    buttonText="Copy"
                  />
                  <CopyIcon
                    className="KeyValueTable--copyIcon"
                    icon={<IoCopyOutline />}
                    copyText={JSON.stringify(row, null, 2)}
                    tooltipTitle="Copy JSON"
                    buttonText="JSON"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
