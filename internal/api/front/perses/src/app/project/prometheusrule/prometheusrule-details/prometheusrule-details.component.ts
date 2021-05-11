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

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { concatMap } from 'rxjs/operators';
import { PrometheusRuleService } from '../prometheusrule.service';
import { PrometheusRuleModel } from '../prometheusrule.model';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-prometheusrule-details',
  templateUrl: './prometheusrule-details.component.html',
  styleUrls: ['./prometheusrule-details.component.scss']
})
export class PrometheusruleDetailsComponent implements OnInit {

  isLoading = true;
  resource: PrometheusRuleModel | undefined = undefined;

  constructor(private readonly route: ActivatedRoute,
              private readonly service: PrometheusRuleService) {
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getCurrent().pipe(
      concatMap(this.getCurrentRule.bind(this))
    ).subscribe(resource => {
      this.isLoading = false;
      this.resource = resource;
    });
  }

  private getCurrentRule(name: string | undefined): Observable<PrometheusRuleModel | undefined> {
    // TODO(Célian): Take the current project name instead of 'perses' hardcoded
    return name ? this.service.get(name, 'perses') : of(undefined);
  }

}
