/* eslint-disable import/no-extraneous-dependencies */
// Copyright (c) 2018 Uber Technologies, Inc.
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

import React, { Component } from 'react';
import { Row, Col, Table, Button, Select, Form } from 'antd';
import dayjs from 'dayjs';
import { ColumnProps } from 'antd/es/table';
import './index.css';
import { TNil } from '../../../types';
import { Trace, Span } from '../../../types/trace';
import { timeConversion } from '../../../utils/date';
import prefixUrl from '../../../utils/prefix-url';
import { getTargetEmptyOrBlank } from '../../../utils/config/get-target';
import SearchableSelect from '../../common/SearchableSelect';

const Option = Select.Option;

function getNestedProperty(path: string, span: any): string {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, span);
}

type Props = {
  trace: Trace;
  uiFindVertexKeys: Set<string> | TNil;
  uiFind: string | null | undefined;
};

type State = {
  searchText: string;
  searchedColumn: string;
  data: Span[];
  serviceNamesList: string[];
  operationNamesList: string[];
  serviceNameOperationsMap: Map<string, string[]>;
  filtered: Record<string, string[]>;
  selectedServiceName: string[];
  selectedOperationName: string[];
  filteredData: Span[];
};

export default class TraceSpanView extends Component<Props, State> {
  constructor(props: Props, state: State) {
    super(props, state);
    const serviceNamesList = new Set<string>();
    const operationNamesList = new Set<string>();
    const serviceNameOperationsMap = new Map<string, string[]>();

    this.props.trace.spans.forEach(span => {
      serviceNamesList.add(span.process.serviceName);
      operationNamesList.add(span.operationName);
      const operationNames = serviceNameOperationsMap.get(span.process.serviceName) || [];
      operationNames.push(span.operationName);
      serviceNameOperationsMap.set(span.process.serviceName, operationNames);
    });

    this.state = {
      searchText: '',
      searchedColumn: '',
      data: this.props.trace.spans,
      serviceNamesList: [...serviceNamesList],
      operationNamesList: [...operationNamesList],
      serviceNameOperationsMap,
      filteredData: this.props.trace.spans,
      filtered: {},
      selectedServiceName: [],
      selectedOperationName: [],
    };
    this.handleResetFilter = this.handleResetFilter.bind(this);
    this.uniqueOperationNameOptions = this.uniqueOperationNameOptions.bind(this);
  }

  handleResetFilter() {
    this.setState(previousState => ({
      selectedServiceName: [],
      selectedOperationName: [],
      filteredData: previousState.data,
    }));
  }

  uniqueOperationNameOptions() {
    let operationNamesList: string[] = [];
    const serviceNameOperationsMap = this.state.serviceNameOperationsMap;
    if (this.state.filtered['process.serviceName']) {
      this.state.filtered['process.serviceName'].forEach((currentValue: string) => {
        operationNamesList = operationNamesList.concat(serviceNameOperationsMap.get(currentValue) || []);
      });
    } else {
      operationNamesList = this.state.operationNamesList;
    }
    return [...new Set(operationNamesList)];
  }

  onFilteredChangeCustom(selectedValues: string[], accessor: keyof Span) {
    const filtered = this.state.filtered;
    filtered[accessor] = selectedValues;
    const data = this.state.data.filter(span => {
      let isSpanIncluded;
      Object.keys(filtered).every(filterColumn => {
        if (filtered[filterColumn].length) {
          const spanValue = getNestedProperty(filterColumn, span);
          isSpanIncluded = filtered[filterColumn].includes(spanValue);
        } else {
          isSpanIncluded = true;
        }
        return isSpanIncluded;
      });

      return isSpanIncluded;
    });

    this.setState(previousState => ({
      ...previousState,
      filtered,
      filteredData: data,
    }));
  }

  render() {
    const columns: ColumnProps<Span>[] = [
      {
        title: 'Service Name',
        dataIndex: ['process', 'serviceName'],
        width: '25%',
        sorter: (a, b) => a.process.serviceName.localeCompare(b.process.serviceName),
      },
      {
        title: 'Operation',
        dataIndex: 'operationName',
        width: '25%',
        sorter: (a, b) => a.operationName.localeCompare(b.operationName),
      },
      {
        title: 'ID',
        dataIndex: 'spanID',
        sorter: (a, b) => a.spanID.localeCompare(b.spanID),
        render: (text: string, record: Span) => {
          return (
            <a
              href={prefixUrl(`/trace/${record.traceID}?uiFind=${text}`)}
              target={getTargetEmptyOrBlank()}
              rel="noopener noreferrer"
            >
              {text}
            </a>
          );
        },
      },
      {
        title: 'Duration',
        dataIndex: 'duration',
        sorter: (a, b) => a.duration - b.duration,
        render: (cell: string) => {
          return timeConversion(parseInt(cell, 10));
        },
      },
      {
        title: 'Start Time',
        dataIndex: 'startTime',
        sorter: (a, b) => a.startTime - b.startTime,
        render: (cell: number) => {
          return dayjs(cell / 1000).format('DD MMM YYYY hh:mm A');
        },
      },
    ];
    return (
      <div>
        <h3 className="title--TraceSpanView"> Trace Tabular View</h3>
        <Row style={{ marginTop: '8px' }}>
          <Col span={7}>
            <Form.Item
              label="Service Name"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              className="serviceNameDD"
            >
              <SearchableSelect
                allowClear
                mode="multiple"
                style={{ width: '100%' }}
                maxTagCount={4}
                value={this.state.selectedServiceName}
                maxTagPlaceholder={`+ ${this.state.selectedServiceName.length - 4} Selected`}
                placeholder="Please Select Service "
                onChange={entry => {
                  this.setState(previousState => ({
                    ...previousState,
                    selectedServiceName: entry as [],
                  }));
                  this.onFilteredChangeCustom(entry as [], 'process.serviceName' as keyof Span);
                }}
                data-testid="select-service"
              >
                {this.state.serviceNamesList.map(name => {
                  return (
                    <Option value={name} key={name}>
                      {name}{' '}
                    </Option>
                  );
                })}
              </SearchableSelect>
            </Form.Item>
          </Col>
          <Col span={9}>
            <Form.Item
              label="Operation Name"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              className="operationNameDD"
            >
              <SearchableSelect
                allowClear
                mode="multiple"
                style={{ width: '100%' }}
                maxTagCount={4}
                value={this.state.selectedOperationName}
                maxTagPlaceholder={`+ ${this.state.selectedOperationName.length - 4} Selected`}
                placeholder="Please Select Operation"
                onChange={entry => {
                  this.setState(previousState => ({
                    ...previousState,
                    selectedOperationName: entry as [],
                  }));
                  this.onFilteredChangeCustom(entry as [], 'operationName');
                }}
                data-testid="select-operation"
              >
                {this.uniqueOperationNameOptions().map((name: string) => {
                  return (
                    <Option value={name} key={name}>
                      {name}{' '}
                    </Option>
                  );
                })}
              </SearchableSelect>
            </Form.Item>
          </Col>
          <Col span={2} push={6}>
            <Form.Item className="reset-filter">
              <Button type="primary" htmlType="button" onClick={this.handleResetFilter}>
                Reset Filters
              </Button>
            </Form.Item>
          </Col>
        </Row>

        <Table
          className="span-table span-view-table"
          columns={columns}
          dataSource={this.state.filteredData}
          pagination={{
            total: this.state.filteredData.length,
            pageSizeOptions: ['10', '20', '50', '100'],
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          rowKey="spanID"
        />
      </div>
    );
  }
}
