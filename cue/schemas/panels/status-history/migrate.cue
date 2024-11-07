 if #panel.type != _|_ if #panel.type == "status-history" {
	kind: "StatusHistoryChart"
	spec: {
		// simple legend
		#showLegend: *#panel.options.legend | true
		if #panel.options.legend != _|_ if #showLegend {
			legend: {}
		}
	}
}
