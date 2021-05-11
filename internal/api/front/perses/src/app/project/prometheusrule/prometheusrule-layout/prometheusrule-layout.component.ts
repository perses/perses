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

@Component({
  selector: 'app-prometheusrule-layout',
  templateUrl: './prometheusrule-layout.component.html',
  styleUrls: ['./prometheusrule-layout.component.scss']
})
export class PrometheusruleLayoutComponent implements OnInit {
  viewDetails = false;

  /**
   * Starting position of the gutter (between its min and max position)
   * 0 being the minimum possible position (left panel disappear)
   * 100 being the maximum possible position (right panel disappear)
   */
  gutterStartLocation = 55;
  gutterMinLocation = 45;
  gutterMaxLocation = 60;

  constructor(private readonly route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams
      .subscribe(params => {
          this.viewDetails = params.name && params.name !== '';
        }
      );
  }
}
