if #panel.type != _|_ if #panel.type == "timeseries" || #panel.type == "graph" {
	kind: "TimeSeriesChart"
	spec: {
		// legend
		// NB: no support of former "show" attribute from Grafana, people should migrate to latest Grafana datamodel before migrating to Perses
		#showLegend: *#panel.options.legend.showLegend | true
		if #panel.options.legend != _|_ if #showLegend {
			legend: {
				if #panel.type == "timeseries" {
					position: *(#panel.options.legend.placement & "right") | "bottom"
					mode: *(#panel.options.legend.displayMode & "table")  | "list"
					values: [for calc in #panel.options.legend.calcs
						if (#mapping.calc[calc] != _|_) {#mapping.calc[calc]},
					]
				}
				if #panel.type == "graph" {
					#rightSide: *#panel.legend.rightSide | false
					position: [// switch
						if #rightSide {"right"},
						"bottom",
					][0]
					#alignAsTable: *#panel.legend.alignAsTable | false
					mode: [
						if #alignAsTable {"table"},
						"list",
					][0]
					values: [for oldCalc, newCalc in #mapping.calc
						if #panel.legend[oldCalc] != _|_
						if #panel.legend[oldCalc] == true {
							newCalc
						},
					]
				}
			}
		}

		// yAxis
		#unit: *#mapping.unit[#panel.fieldConfig.defaults.unit] | null
		if #unit != null {
			yAxis: format: unit: #unit
		}

		#decimal: *#panel.fieldConfig.defaults.decimal | null
		if #decimal != null {
			yAxis: format: decimalPlaces: #decimal
		}

		#min: *#panel.fieldConfig.defaults.min | null
		if #min != null {
			yAxis: min: #min
		}

		#max: *#panel.fieldConfig.defaults.max | null
		if #max != null {
			yAxis: max: #max
		}

		// thresholds
		// -> migrate thresholds only if they are visible
		#steps: *#panel.fieldConfig.defaults.thresholds.steps | null
		#mode: *#panel.fieldConfig.defaults.custom.thresholdsStyle.mode | "off"
		if #steps != null if #mode != "off" {
			thresholds: {
				// defaultColor: TODO how to fill this one?
				steps: [for _, step in #steps if step.value != _|_ {
					value: [// switch
						if step.value == null {0},
						step.value,
					][0]
					color: step.color // TODO how to manage the overrides part?
				}]
			}
		}

		// visual
		#lineWidth: *#panel.fieldConfig.defaults.custom.lineWidth | null
		if #lineWidth != null {
			visual: lineWidth: [// switch
				if #lineWidth > 3 {3},       // line width can't go beyond 3 in Perses
				if #lineWidth < 0.25 {0.25}, // line width can't go below 0.25 in Perses
				#lineWidth,
			][0]
		}

		#fillOpacity: *#panel.fieldConfig.defaults.custom.fillOpacity | null
		if #fillOpacity != null {
			visual: areaOpacity: #fillOpacity / 100
		}

		// NB: pointRadius skipped because the optimal size is automatically computed by Perses
		#spanNulls: *(#panel.fieldConfig.defaults.custom.spanNulls & bool) | null // skip in case of "threshold" mode because we don't support it
		if #spanNulls != null {
			visual: connectNulls: #spanNulls
		}

		#drawStyle: *#panel.fieldConfig.defaults.custom.drawStyle | null
		if #drawStyle != null {
			visual: display: [// switch
				if #drawStyle == "bars" {"bar"},
				"line",
			][0]
		}

		#stacking: *#panel.fieldConfig.defaults.custom.stacking.mode | "none"
		if #stacking != "none" {
			visual: stack: "all"
		}
	}
},
