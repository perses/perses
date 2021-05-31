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
import { DashboardSection } from '../../model/dashboard.model';
import { NgxChartLineChartModel, NgxChartPoint } from '../../model/ngxcharts.model';
import { ToastService } from '../../../../shared/service/toast.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EventFeedService } from '../../service/event-feed.service';

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
    sections: DashboardSection[] = [];
    @Input()
    selectedVariable: Record<string, string> = {};

    isLoading = false;
    chartDataMap = new Map<string, NgxChartLineChartModel[]>();

    showXAxis = true;
    showYAxis = true;
    gradient = false;
    showLegend = true;
    showXAxisLabel = true;
    xAxisLabel = 'Time';
    showYAxisLabel = true;
    yAxisLabel = 'Value';
    timeline = true;
    colorScheme = {
        domain: ['#9370DB', '#87CEFA', '#FA8072', '#FF7F50', '#90EE90', '#9370DB']
    };

    constructor(private readonly service: DashboardService,
                private readonly feedService: DashboardFeedService,
                private readonly eventFeedService: EventFeedService,
                private readonly toastService: ToastService) {
    }

    ngOnInit(): void {
        this.eventFeedService.variableChange.subscribe(
            shouldLoad => {
                if (shouldLoad) {
                    this.feedDashboard();
                }
            },
        );
    }

    feedSection(section: DashboardSection): void {
        this.feedDashboard([section]);
    }

    private feedDashboard(sections = this.sections): void {
        const filteredSections = sections.filter((section => section.open));
        if (filteredSections.length === 0) {
            // that would mean that all sections are closed, so no need to call the backend.
            return;
        }
        this.isLoading = true;
        const feedRequest: SectionFeedRequest = {
            datasource: this.datasource,
            duration: this.duration,
            variables: this.selectedVariable,
            sections: sections.filter((section => section.open)),
        };
        this.feedService.feedSections(feedRequest).subscribe(
            responses => {
                this.convertDashboardFeeds(responses);
                this.isLoading = false;
            },
            error => {
                this.toastService.error(error);
                this.isLoading = false;
            },
        );
    }

    private convertDashboardFeeds(dashboardFeeds: SectionFeedResponse[]): void {
        for (const section of dashboardFeeds) {
            for (const panel of section.panels) {
                const ngxPanelData: NgxChartLineChartModel[] = [];
                for (const query of panel.results) {
                    let i = 0;
                    if (query.err) {
                        this.toastService.errorMessage(query.err);
                        continue;
                    }
                    for (const serie of query.result) {
                        const ngxSerieData: NgxChartLineChartModel = {
                            name: serie.metric.__name__ + ' - ' + i,
                            series: []
                        };
                        for (const [timestamp, value] of serie.values) {
                            const datapoint: NgxChartPoint = {name: String(timestamp), value: Number(value)};
                            ngxSerieData.series.push(datapoint);
                        }
                        ngxPanelData[i] = ngxSerieData;
                        i++;
                        this.chartDataMap.set(section.name + '_' + panel.name, ngxPanelData);
                    }
                }
            }
        }
    }

    public getChartData(sectionName: string, panelName: string): NgxChartLineChartModel[] | undefined {
        return this.chartDataMap.get(`${sectionName}_${panelName}`);
    }
}
