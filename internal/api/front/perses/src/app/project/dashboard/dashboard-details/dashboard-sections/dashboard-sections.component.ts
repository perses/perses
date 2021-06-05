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

import { Component, Input, OnInit } from '@angular/core';
import { DashboardService } from '../../service/dashboard.service';
import { DashboardFeedService } from '../../service/dashboard-feed.service';
import { SectionFeedRequest, SectionFeedResponse } from '../../model/dashboard-feed.model';
import { DashboardSection, filterSections } from '../../model/dashboard.model';
import { ToastService } from '../../../../shared/service/toast.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EventFeedService } from '../../service/event-feed.service';
import { newFeedBuilder } from './feed-builder';

@UntilDestroy()
@Component({
  selector: 'app-dashboard-sections',
  templateUrl: './dashboard-sections.component.html',
  styleUrls: ['./dashboard-sections.component.scss']
})
export class DashboardSectionsComponent implements OnInit {
  @Input()
  datasource = '';
  @Input()
  duration = '';
  @Input()
  sections: Record<string, DashboardSection> = {};
  @Input()
  selectedVariable: Record<string, string> = {};

  isSectionLoading: Record<string, boolean> = {};
  chartDataMap = new Map<string, any>();

  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = true;
  showXAxisLabel = true;
  xAxisLabel = 'Time';
  showYAxisLabel = true;
  yAxisLabel = 'Value';

  constructor(private readonly service: DashboardService,
              private readonly feedService: DashboardFeedService,
              private readonly eventFeedService: EventFeedService,
              private readonly toastService: ToastService) {
  }

  ngOnInit(): void {
    this.eventFeedService.getVariableChange().pipe(untilDestroyed(this)).subscribe(
      shouldLoad => {
        if (shouldLoad) {
          this.feedDashboard();
        }
      },
    );
  }

  feedSection(sectionName: string, section: DashboardSection): void {
    this.feedDashboard({[sectionName]: section});
  }

  getChartData(sectionName: string, panelName: string): any {
    return this.chartDataMap.get(`${sectionName}_${panelName}`);
  }

  private feedDashboard(sections = this.sections): void {
    const filteredSections = filterSections(sections, (k, v) => v.open);
    if (Object.keys(filteredSections).length === 0) {
      // that would mean that all sections are closed, so no need to call the backend.
      return;
    }
    this.setIsSectionLoading(filteredSections, true);
    const feedRequest: SectionFeedRequest = {
      datasource: this.datasource,
      duration: this.duration,
      variables: this.selectedVariable,
      sections: filteredSections,
    };
    this.feedService.feedSections(feedRequest).subscribe(
      responses => {
        this.convertDashboardFeeds(responses);
        this.setIsSectionLoading(filteredSections, false);
      },
      error => {
        this.toastService.error(error);
        this.setIsSectionLoading(filteredSections, false);
      },
    );
  }

  private convertDashboardFeeds(sectionFeedResponses: SectionFeedResponse[]): void {
    for (const section of sectionFeedResponses) {
      for (const panel of section.panels) {
        const feedBuilder = newFeedBuilder(section.name, panel, this.sections);
        if (feedBuilder) {
          this.chartDataMap.set(`${section.name}_${panel.name}`, feedBuilder.build());
        }
      }
    }
  }

  private setIsSectionLoading(sections: Record<string, DashboardSection>, value: boolean): void {
    for (const k of Object.keys(sections)) {
      this.isSectionLoading[k] = value;
    }
  }
}
