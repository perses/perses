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

import TraceTimelineViewer from '../../components/TracePage/TraceTimelineViewer';
import { ETraceViewType, IViewRange, TUpdateViewRangeTimeFunction, ViewRangeTimeUpdate } from '../../components/TracePage/types';
import ScrollManager from '../../components/TracePage/ScrollManager';
import { scrollBy, scrollTo } from '../../components/TracePage/scroll-page';
import { actions as timelineActions } from '../../components/TracePage/TraceTimelineViewer/duck';
import TracePageHeader from '../../components/TracePage/TracePageHeader';
import memoizedTraceCriticalPath from '../../components/TracePage/CriticalPath';
import { useState } from 'react';
import { extractUiFindFromState } from '../../components/common/UiFindInput';
import { exampleTrace } from './exampleTrace';
import 'u-basscss/css/flexbox.css';
import 'u-basscss/css/layout.css';
import 'u-basscss/css/margin.css';
import 'u-basscss/css/padding.css';
import 'u-basscss/css/position.css';
import 'u-basscss/css/typography.css';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';

export function TracingGanttChartComponent(props: {}) {
  const dispatch = useAppDispatch();
  const uiFind = useAppSelector((state: any) => extractUiFindFromState(state).uiFind);

  // Controls whether the mini Gantt chart is shown or not
  const [slimView, setSlimView] = useState(false);

  let spanFindMatches: Set<string> | null | undefined;
  //const trace = transformTraceData(traceGenerator.trace({}))!;
  const trace = exampleTrace as any;

  const criticalPath = memoizedTraceCriticalPath(trace);

  const viewRange:IViewRange = {
    time: {
      current: [0, 1],
    },
  };

  const scrollManager = new ScrollManager(trace, {
    scrollBy,
    scrollTo,
  });

  const toggleSlimView = () => {
    setSlimView(!slimView);
  };

  const updateViewRangeTime: TUpdateViewRangeTimeFunction = (start: number, end: number, trackSrc?: string) => {
  };

  const updateNextViewRangeTime = (update: ViewRangeTimeUpdate) => {
  };

  const focusUiFindMatches = () => {
    if (trace) {
      dispatch(timelineActions.focusUiFindMatches(trace, uiFind));
    }
  };

  const nextResult = () => {
    scrollManager.scrollToNextVisibleSpan();
  };

  const prevResult = () => {
    scrollManager.scrollToPrevVisibleSpan();
  };

  const isEmbedded = false;
  const headerProps = {
    focusUiFindMatches,
    slimView,
    textFilter: uiFind,
    viewType: ETraceViewType.TraceTimelineViewer,
    viewRange,
    canCollapse: true,
    clearSearch: () => {},
    hideMap: false,
    hideSummary: false,
    linkToStandalone: "",
    nextResult,
    onArchiveClicked: () => {},
    onSlimViewClicked: toggleSlimView,
    onTraceViewChange: () => {},
    prevResult,
    resultCount: 1,
    disableJsonView: true,
    showArchiveButton: false,
    showShortcutsHelp: !isEmbedded,
    showStandaloneLink: isEmbedded,
    showViewOptions: !isEmbedded,
    toSearch: "",
    trace,
    updateNextViewRangeTime,
    updateViewRangeTime,
  };

  return (
    <>
      <div className="Tracepage--headerSection">
        <TracePageHeader {...headerProps} />
      </div>
      <TraceTimelineViewer
          registerAccessors={scrollManager.setAccessors}
          scrollToFirstVisibleSpan={scrollManager.scrollToFirstVisibleSpan}
          findMatchesIDs={spanFindMatches}
          trace={trace}
          criticalPath={criticalPath}
          updateNextViewRangeTime={updateNextViewRangeTime}
          updateViewRangeTime={updateViewRangeTime}
          viewRange={viewRange}
        />
    </>
  );
}
