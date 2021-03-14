import { Component, OnInit } from '@angular/core';
import {PrometheusRuleService} from "../prometheusrule.service";

@Component({
  selector: 'app-prometheusrule-list',
  templateUrl: './prometheusrule-list.component.html',
  styleUrls: ['./prometheusrule-list.component.scss']
})
export class PrometheusRuleListComponent implements OnInit {

  constructor(private service: PrometheusRuleService) { }

  ngOnInit(): void {
  }

}
