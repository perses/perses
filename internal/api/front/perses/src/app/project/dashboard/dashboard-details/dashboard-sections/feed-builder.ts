// Copyright 2021 Amadeus s.a.s
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

import { PanelFeedResponse } from '../../model/dashboard-feed.model';
import { DashboardSection } from '../../model/dashboard.model';


export interface FeedBuilder {
  build(): any;
}

export function newFeedBuilder(sectionName: string, feedPanel: PanelFeedResponse,
                               sections: Record<string, DashboardSection>): FeedBuilder | undefined {
  switch (sections[sectionName].panels[feedPanel.name].kind) {
    case 'GaugeChart':
      return new GaugeChartFeedBuilder(sectionName, feedPanel);
    default:
      return undefined;
  }
}


class GaugeChartFeedBuilder {
  private readonly sectionName: string;
  private readonly feedPanel: PanelFeedResponse;

  constructor(sectionName: string, feedPanel: PanelFeedResponse) {
    this.sectionName = sectionName;
    this.feedPanel = feedPanel;
  }

  build(): number {
    // In this case we are feeding a gaugeChart, then we are only interesting by the first result if there is one.
    // It's because there is only one expression in the GaugeChart data model,
    // so feedPanel.feeds should be an array with at most one element.
    if (this.feedPanel.feeds.length !== 1) {
      return 0;
    }
    const feedResult = this.feedPanel.feeds[0];
    if (feedResult.err) {
      // at some point, we should find a nice way to handle this error. If possible with the ToastService
      return 0;
    }
    if (feedResult.type !== 'vector') {
      // For a GaugeChart, we are expecting a vector, since it's an instant query that is performed on the backend side.
      // In case it's something different, we should stop the execution. It's the safer for the moment.
      return 0;
    }
    if (feedResult.result.length !== 1) {
      return 0;
    }
    // let's truncate the number so it can be easily displayed.
    return Number(feedResult.result[0].value[1].split('.')[0]);
  }
}
