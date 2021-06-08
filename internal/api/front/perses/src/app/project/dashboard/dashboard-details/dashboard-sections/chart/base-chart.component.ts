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

import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';
import * as echarts from 'echarts/core';
import { ECBasicOption } from 'echarts/types/dist/shared';

@Component({
  template: ''
})
export abstract class BaseChartComponent<T extends ECBasicOption> implements OnInit, OnDestroy, AfterViewInit {
  protected localChart?: echarts.ECharts;
  private resizeSub?: ResizeObserver;
  private animationFrameID: number | null = null;

  protected constructor(private el: ElementRef,
                        private ngZone: NgZone) {
  }

  abstract getEchartsExtensions(): any[]

  abstract getOption(): T

  ngOnInit(): void {
    echarts.use(this.getEchartsExtensions)
    this.resizeSub = new ResizeObserver(() => {
      this.animationFrameID = window.requestAnimationFrame(() => this.resize());
    });
    this.resizeSub.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.resizeSub && this.animationFrameID) {
      this.resizeSub.unobserve(this.el.nativeElement);
      window.cancelAnimationFrame(this.animationFrameID);
    }
  }

  ngAfterViewInit(): void {
    const dom = this.el.nativeElement;

    if (window && window.getComputedStyle) {
      const prop = window.getComputedStyle(dom, null).getPropertyValue('height');
      if ((!prop || prop === '0px') && (!dom.style.height || dom.style.height === '0px')) {
        dom.style.height = '400px';
      }
    }
    this.localChart = echarts.init(dom);
    this.localChart.setOption(this.getOption());
  }

  private resize() {
    this.ngZone.runOutsideAngular(() => {
      this.localChart?.resize();
    })
  }
}
