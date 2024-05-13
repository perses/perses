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

import * as React from 'react';
import cx from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import _isEqual from 'lodash/isEqual';

// import { History as RouterHistory, Location } from 'history';

import memoizeOne from 'memoize-one';
import { Location, History } from 'history';
import { actions } from './duck';
import ListView from './ListView';
import SpanBarRow from './SpanBarRow';
import DetailState from './SpanDetail/DetailState';
import SpanDetailRow from './SpanDetailRow';
import {
  createViewedBoundsFunc,
  findServerChildSpan,
  isErrorSpan,
  isKindClient,
  isKindProducer,
  spanContainsErredSpan,
  ViewedBoundsFunctionType,
} from './utils';
import { Accessors } from '../ScrollManager';
import { extractUiFindFromState, TExtractUiFindFromStateReturn } from '../../common/UiFindInput';
import getLinks from '../../../model/link-patterns';
import colorGenerator from '../../../utils/color-generator';
import { TNil, ReduxState } from '../../../types';
import { Log, Span, Trace, KeyValuePair, criticalPathSection } from '../../../types/trace';
import TTraceTimeline from '../../../types/TTraceTimeline';

import './VirtualizedTraceView.css';
import updateUiFind from '../../../utils/update-ui-find';
import { PEER_SERVICE } from '../../../constants/tag-keys';
import withRouteProps from '../../../utils/withRouteProps';

type RowState = {
  isDetail: boolean;
  span: Span;
  spanIndex: number;
};

type TVirtualizedTraceViewOwnProps = {
  currentViewRangeTime: [number, number];
  findMatchesIDs: Set<string> | TNil;
  scrollToFirstVisibleSpan: () => void;
  registerAccessors: (accesors: Accessors) => void;
  trace: Trace;
  criticalPath: criticalPathSection[];
};

type TDispatchProps = {
  childrenToggle: (spanID: string) => void;
  clearShouldScrollToFirstUiFindMatch: () => void;
  detailLogItemToggle: (spanID: string, log: Log) => void;
  detailLogsToggle: (spanID: string) => void;
  detailWarningsToggle: (spanID: string) => void;
  detailReferencesToggle: (spanID: string) => void;
  detailProcessToggle: (spanID: string) => void;
  detailTagsToggle: (spanID: string) => void;
  detailToggle: (spanID: string) => void;
  setSpanNameColumnWidth: (width: number) => void;
  setTrace: (trace: Trace | TNil, uiFind: string | TNil) => void;
  focusUiFindMatches: (trace: Trace, uiFind: string | TNil, allowHide?: boolean) => void;
};

type RouteProps = {
  location: Location;
  history: History;
};

type VirtualizedTraceViewProps = TVirtualizedTraceViewOwnProps &
  TDispatchProps &
  TExtractUiFindFromStateReturn &
  TTraceTimeline &
  RouteProps;

// export for tests
export const DEFAULT_HEIGHTS = {
  bar: 28,
  detail: 161,
  detailWithLogs: 197,
};

const NUM_TICKS = 5;

function generateRowStates(
  spans: Span[] | TNil,
  childrenHiddenIDs: Set<string>,
  detailStates: Map<string, DetailState | TNil>
): RowState[] {
  if (!spans) {
    return [];
  }
  let collapseDepth = null;
  const rowStates = [];
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i];
    const { spanID, depth } = span;
    let hidden = false;
    if (collapseDepth != null) {
      if (depth >= collapseDepth) {
        hidden = true;
      } else {
        collapseDepth = null;
      }
    }
    if (hidden) {
      continue;
    }
    if (childrenHiddenIDs.has(spanID)) {
      collapseDepth = depth + 1;
    }
    rowStates.push({
      span,
      isDetail: false,
      spanIndex: i,
    });
    if (detailStates.has(spanID)) {
      rowStates.push({
        span,
        isDetail: true,
        spanIndex: i,
      });
    }
  }
  return rowStates;
}

function generateRowStatesFromTrace(
  trace: Trace | TNil,
  childrenHiddenIDs: Set<string>,
  detailStates: Map<string, DetailState | TNil>
): RowState[] {
  return trace ? generateRowStates(trace.spans, childrenHiddenIDs, detailStates) : [];
}

function getCssClasses(currentViewRange: [number, number]) {
  const [zoomStart, zoomEnd] = currentViewRange;
  return cx({
    'clipping-left': zoomStart > 0,
    'clipping-right': zoomEnd < 1,
  });
}

function mergeChildrenCriticalPath(
  trace: Trace,
  spanID: string,
  criticalPath: criticalPathSection[]
): criticalPathSection[] {
  if (!criticalPath) {
    return [];
  }
  // Define an array to store the IDs of the span and its descendants (if the span is collapsed)
  const allRequiredSpanIds = [spanID];

  // If the span is collapsed, recursively find all of its descendants.
  const findAllDescendants = (currentChildSpanIds: string[]) => {
    currentChildSpanIds.forEach(eachId => {
      const currentChildSpan = trace.spans.find(a => a.spanID === eachId)!;
      if (currentChildSpan.hasChildren) {
        allRequiredSpanIds.push(...currentChildSpan.childSpanIds);
        findAllDescendants(currentChildSpan.childSpanIds);
      }
    });
  };
  findAllDescendants(allRequiredSpanIds);

  const criticalPathSections: criticalPathSection[] = [];
  criticalPath.forEach(each => {
    if (allRequiredSpanIds.includes(each.spanId)) {
      if (criticalPathSections.length !== 0 && each.section_end === criticalPathSections[0].section_start) {
        // Merge Critical Paths if they are consecutive
        criticalPathSections[0].section_start = each.section_start;
      } else {
        criticalPathSections.unshift({ ...each });
      }
    }
  });

  return criticalPathSections;
}

const memoizedGenerateRowStates = memoizeOne(generateRowStatesFromTrace);
const memoizedViewBoundsFunc = memoizeOne(createViewedBoundsFunc, _isEqual);
const memoizedGetCssClasses = memoizeOne(getCssClasses, _isEqual);

// export from tests
export class VirtualizedTraceViewImpl extends React.Component<VirtualizedTraceViewProps> {
  listView: ListView | TNil;
  constructor(props: VirtualizedTraceViewProps) {
    super(props);
    const { setTrace, trace, uiFind } = props;
    setTrace(trace, uiFind);
  }

  shouldComponentUpdate(nextProps: VirtualizedTraceViewProps) {
    // If any prop updates, VirtualizedTraceViewImpl should update.
    const nextPropKeys = Object.keys(nextProps) as (keyof VirtualizedTraceViewProps)[];
    for (let i = 0; i < nextPropKeys.length; i += 1) {
      if (nextProps[nextPropKeys[i]] !== this.props[nextPropKeys[i]]) {
        // Unless the only change was props.shouldScrollToFirstUiFindMatch changing to false.
        if (nextPropKeys[i] === 'shouldScrollToFirstUiFindMatch') {
          if (nextProps[nextPropKeys[i]]) return true;
        } else {
          return true;
        }
      }
    }
    return false;
  }

  componentDidUpdate(prevProps: Readonly<VirtualizedTraceViewProps>) {
    const { registerAccessors, trace } = prevProps;
    const {
      shouldScrollToFirstUiFindMatch,
      clearShouldScrollToFirstUiFindMatch,
      scrollToFirstVisibleSpan,
      registerAccessors: nextRegisterAccessors,
      setTrace,
      trace: nextTrace,
      uiFind,
    } = this.props;

    if (trace !== nextTrace) {
      setTrace(nextTrace, uiFind);
    }

    if (this.listView && registerAccessors !== nextRegisterAccessors) {
      nextRegisterAccessors(this.getAccessors());
    }

    if (shouldScrollToFirstUiFindMatch) {
      scrollToFirstVisibleSpan();
      clearShouldScrollToFirstUiFindMatch();
    }
  }

  getRowStates(): RowState[] {
    const { childrenHiddenIDs, detailStates, trace } = this.props;
    return memoizedGenerateRowStates(trace, childrenHiddenIDs, detailStates);
  }

  getClippingCssClasses(): string {
    const { currentViewRangeTime } = this.props;
    return memoizedGetCssClasses(currentViewRangeTime);
  }

  getViewedBounds(): ViewedBoundsFunctionType {
    const { currentViewRangeTime, trace } = this.props;
    const [zoomStart, zoomEnd] = currentViewRangeTime;

    return memoizedViewBoundsFunc({
      min: trace.startTime,
      max: trace.endTime,
      viewStart: zoomStart,
      viewEnd: zoomEnd,
    });
  }

  focusSpan = (uiFind: string) => {
    const { trace, focusUiFindMatches, location, history } = this.props;
    if (trace) {
      updateUiFind({
        location,
        history,
        uiFind,
      });
      focusUiFindMatches(trace, uiFind, false);
    }
  };

  getAccessors() {
    const lv = this.listView;
    if (!lv) {
      throw new Error('ListView unavailable');
    }
    return {
      getViewRange: this.getViewRange,
      getSearchedSpanIDs: this.getSearchedSpanIDs,
      getCollapsedChildren: this.getCollapsedChildren,
      getViewHeight: lv.getViewHeight,
      getBottomRowIndexVisible: lv.getBottomVisibleIndex,
      getTopRowIndexVisible: lv.getTopVisibleIndex,
      getRowPosition: lv.getRowPosition,
      mapRowIndexToSpanIndex: this.mapRowIndexToSpanIndex,
      mapSpanIndexToRowIndex: this.mapSpanIndexToRowIndex,
    };
  }

  getViewRange = () => this.props.currentViewRangeTime;

  getSearchedSpanIDs = () => this.props.findMatchesIDs;

  getCollapsedChildren = () => this.props.childrenHiddenIDs;

  mapRowIndexToSpanIndex = (index: number) => this.getRowStates()[index].spanIndex;

  mapSpanIndexToRowIndex = (index: number) => {
    const max = this.getRowStates().length;
    for (let i = 0; i < max; i++) {
      const { spanIndex } = this.getRowStates()[i];
      if (spanIndex === index) {
        return i;
      }
    }
    throw new Error(`unable to find row for span index: ${index}`);
  };

  setListView = (listView: ListView | TNil) => {
    const isChanged = this.listView !== listView;
    this.listView = listView;
    if (listView && isChanged) {
      this.props.registerAccessors(this.getAccessors());
    }
  };

  // use long form syntax to avert flow error
  // https://github.com/facebook/flow/issues/3076#issuecomment-290944051
  getKeyFromIndex = (index: number) => {
    const { isDetail, span } = this.getRowStates()[index];
    return `${span.spanID}--${isDetail ? 'detail' : 'bar'}`;
  };

  getIndexFromKey = (key: string) => {
    const parts = key.split('--');
    const _spanID = parts[0];
    const _isDetail = parts[1] === 'detail';
    const max = this.getRowStates().length;
    for (let i = 0; i < max; i++) {
      const { span, isDetail } = this.getRowStates()[i];
      if (span.spanID === _spanID && isDetail === _isDetail) {
        return i;
      }
    }
    return -1;
  };

  getRowHeight = (index: number) => {
    const { span, isDetail } = this.getRowStates()[index];
    if (!isDetail) {
      return DEFAULT_HEIGHTS.bar;
    }
    if (Array.isArray(span.logs) && span.logs.length) {
      return DEFAULT_HEIGHTS.detailWithLogs;
    }
    return DEFAULT_HEIGHTS.detail;
  };

  linksGetter = (span: Span, items: KeyValuePair[], itemIndex: number) => {
    const { trace } = this.props;
    return getLinks(span, items, itemIndex, trace);
  };

  renderRow = (key: string, style: React.CSSProperties, index: number, attrs: object) => {
    const { isDetail, span, spanIndex } = this.getRowStates()[index];
    return isDetail
      ? this.renderSpanDetailRow(span, key, style, attrs)
      : this.renderSpanBarRow(span, spanIndex, key, style, attrs);
  };

  renderSpanBarRow(span: Span, spanIndex: number, key: string, style: React.CSSProperties, attrs: object) {
    const { spanID } = span;
    const { serviceName } = span.process;
    const {
      childrenHiddenIDs,
      childrenToggle,
      detailStates,
      detailToggle,
      findMatchesIDs,
      spanNameColumnWidth,
      trace,
      criticalPath,
    } = this.props;
    // to avert flow error
    if (!trace) {
      return null;
    }
    const color = colorGenerator.getColorByKey(serviceName);
    const isCollapsed = childrenHiddenIDs.has(spanID);
    const isDetailExpanded = detailStates.has(spanID);
    const isMatchingFilter = findMatchesIDs ? findMatchesIDs.has(spanID) : false;
    const showErrorIcon = isErrorSpan(span) || (isCollapsed && spanContainsErredSpan(trace.spans, spanIndex));
    const criticalPathSections = isCollapsed
      ? mergeChildrenCriticalPath(trace, spanID, criticalPath)
      : criticalPath.filter(each => each.spanId === spanID);
    // Check for direct child "server" span if the span is a "client" span.
    let rpc = null;
    if (isCollapsed) {
      const rpcSpan = findServerChildSpan(trace.spans.slice(spanIndex));
      if (rpcSpan) {
        const rpcViewBounds = this.getViewedBounds()(rpcSpan.startTime, rpcSpan.startTime + rpcSpan.duration);
        rpc = {
          color: colorGenerator.getColorByKey(rpcSpan.process.serviceName),
          operationName: rpcSpan.operationName,
          serviceName: rpcSpan.process.serviceName,
          viewEnd: rpcViewBounds.end,
          viewStart: rpcViewBounds.start,
        };
      }
    }
    const peerServiceKV = span.tags.find(kv => kv.key === PEER_SERVICE);
    // Leaf, kind == client and has peer.service tag, is likely a client span that does a request
    // to an uninstrumented/external service
    let noInstrumentedServer = null;
    if (!span.hasChildren && peerServiceKV && (isKindClient(span) || isKindProducer(span))) {
      noInstrumentedServer = {
        serviceName: peerServiceKV.value,
        color: colorGenerator.getColorByKey(peerServiceKV.value),
      };
    }

    return (
      <div className="VirtualizedTraceView--row" key={key} style={style} {...attrs}>
        <SpanBarRow
          className={this.getClippingCssClasses()}
          color={color}
          criticalPath={criticalPathSections}
          columnDivision={spanNameColumnWidth}
          isChildrenExpanded={!isCollapsed}
          isDetailExpanded={isDetailExpanded}
          isMatchingFilter={isMatchingFilter}
          numTicks={NUM_TICKS}
          onDetailToggled={detailToggle}
          onChildrenToggled={childrenToggle}
          rpc={rpc}
          noInstrumentedServer={noInstrumentedServer}
          showErrorIcon={showErrorIcon}
          getViewedBounds={this.getViewedBounds()}
          traceStartTime={trace.startTime}
          span={span}
          focusSpan={this.focusSpan}
        />
      </div>
    );
  }

  renderSpanDetailRow(span: Span, key: string, style: React.CSSProperties, attrs: object) {
    const { spanID } = span;
    const { serviceName } = span.process;
    const {
      detailLogItemToggle,
      detailLogsToggle,
      detailProcessToggle,
      detailReferencesToggle,
      detailWarningsToggle,
      detailStates,
      detailTagsToggle,
      detailToggle,
      spanNameColumnWidth,
      trace,
    } = this.props;
    const detailState = detailStates.get(spanID);
    if (!trace || !detailState) {
      return null;
    }
    const color = colorGenerator.getColorByKey(serviceName);
    return (
      <div className="VirtualizedTraceView--row" key={key} style={{ ...style, zIndex: 1 }} {...attrs}>
        <SpanDetailRow
          color={color}
          columnDivision={spanNameColumnWidth}
          onDetailToggled={detailToggle}
          detailState={detailState}
          linksGetter={this.linksGetter}
          logItemToggle={detailLogItemToggle}
          logsToggle={detailLogsToggle}
          processToggle={detailProcessToggle}
          referencesToggle={detailReferencesToggle}
          warningsToggle={detailWarningsToggle}
          span={span}
          tagsToggle={detailTagsToggle}
          traceStartTime={trace.startTime}
          focusSpan={this.focusSpan}
        />
      </div>
    );
  }

  render() {
    return (
      <div className="VirtualizedTraceView--spans">
        <ListView
          ref={this.setListView}
          dataLength={this.getRowStates().length}
          itemHeightGetter={this.getRowHeight}
          itemRenderer={this.renderRow}
          viewBuffer={300}
          viewBufferMin={100}
          itemsWrapperClassName="VirtualizedTraceView--rowsWrapper"
          getKeyFromIndex={this.getKeyFromIndex}
          getIndexFromKey={this.getIndexFromKey}
          windowScroller
        />
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state: ReduxState): TTraceTimeline & TExtractUiFindFromStateReturn {
  return {
    ...extractUiFindFromState(state),
    ...state.traceTimeline,
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch: Dispatch<ReduxState>): TDispatchProps {
  return bindActionCreators(actions, dispatch) as any as TDispatchProps;
}

export default connect<
  TTraceTimeline & TExtractUiFindFromStateReturn,
  TDispatchProps,
  TVirtualizedTraceViewOwnProps,
  ReduxState
>(
  mapStateToProps,
  mapDispatchToProps
)(withRouteProps(VirtualizedTraceViewImpl));
