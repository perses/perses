if #panel.type != _|_ if #panel.type == "timeseries" || #panel.type == "graph" {
	kind: "TimeSeriesChart"
	spec: {
		// legend
		 // NB: no support of former "show" attribute from Grafana, people should migrate to latest Grafana datamodel before migrating to Perses
		#showLegend: *#panel.options.legend.showLegend | true
		if #panel.options.legend != _|_ if #showLegend {
			legend: {
				if #panel.type == "timeseries" {
					position: [
						if #panel.options.legend.placement != _|_ if #panel.options.legend.placement == "right" {"right"},
						{"bottom"}
					][0]
					mode: [
						if #panel.options.legend.displayMode == "list" { "list" },
						if #panel.options.legend.displayMode == "table" { "table" },
					][0]
					values: [ for calc in #panel.options.legend.calcs 
						if (#mapping.calc[calc] != _|_) { #mapping.calc[calc] }
					]
				}
				if #panel.type == "graph" {
					position: [ // switch
						if #panel.legend.rightSide != _|_ if #panel.legend.rightSide { "right" },
						{ "bottom" }
					][0]
					mode: [
						if #panel.legend.alignAsTable != _|_ if #panel.legend.alignAsTable { "table" },
						{ "list" }
					][0]
					values: [ for oldCalc, newCalc in #mapping.calc  
						// Check if the mapping field is set on the legend and 
						// is true.
						if #panel.legend[oldCalc] != _|_ if #panel.legend[oldCalc] == true { newCalc }
					]
				}
			}
		}
		// yAxis
		#unitPath: *"\(#panel.fieldConfig.defaults.unit)" | null
		if #unitPath != null if #mapping.unit[#unitPath] != _|_ {
			yAxis: {
				format: {
					unit: #mapping.unit[#unitPath]
				}
			}
		}
		#min: *#panel.fieldConfig.defaults.min | null
		if #min != null {
			yAxis: {
				min: #min
			}
		}
		#max: *#panel.fieldConfig.defaults.max | null
		if #max != null {
			yAxis: {
				max: #max
			}
		}
		// thresholds
		// -> migrate thresholds only if they are visible
		if #panel.fieldConfig.defaults.thresholds != _|_ if #panel.fieldConfig.defaults.custom.thresholdsStyle != _|_ if #panel.fieldConfig.defaults.custom.thresholdsStyle.mode != "off" {
			thresholds: {
				// defaultColor: TODO how to fill this one?
				steps: [ for _, step in #panel.fieldConfig.defaults.thresholds.steps if step.value != _|_ { // TODO how to manage the overrides part?
					value: [ // switch
						if step.value == null { 0 },
						{ step.value }
					][0]
					color: step.color
				}]
			}
		}
		// visual
		visual: {
			if #panel.fieldConfig.defaults.custom.lineWidth != _|_ {
				lineWidth: [ // switch
					if #panel.fieldConfig.defaults.custom.lineWidth > 3 { 3 }, // line width can't go beyond 3 in Perses
					{ #panel.fieldConfig.defaults.custom.lineWidth }
				][0]
			}
			if #panel.fieldConfig.defaults.custom.fillOpacity != _|_ {
				areaOpacity: #panel.fieldConfig.defaults.custom.fillOpacity / 100 // 
			}
			// NB: pointRadius skipped because the optimal size is automatically computed by Perses
			if #panel.fieldConfig.defaults.custom.spanNulls != _|_ if (#panel.fieldConfig.defaults.custom.spanNulls & bool) != _|_ { // ignore in case of "threshold" mode because we don't support it
				connectNulls: #panel.fieldConfig.defaults.custom.spanNulls
			}
			if #panel.fieldConfig.defaults.custom.drawStyle != _|_ {
				display: [ // switch
					if #panel.fieldConfig.defaults.custom.drawStyle == "line" { "line" },
					if #panel.fieldConfig.defaults.custom.drawStyle == "bars" { "bar" },
					"line"
				][0]
			}
			if #panel.fieldConfig.defaults.custom.stacking != _|_ if #panel.fieldConfig.defaults.custom.stacking.mode != _|_ if #panel.fieldConfig.defaults.custom.stacking.mode != "none" {
				stack: "all"
			}
		}
	}
},
