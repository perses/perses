 if #panel.type != _|_ if #panel.type == "status-history" {
	kind: "StatusHistoryChart"
	spec: {
		#showLegend: *#panel.options.legend.showLegend | true
		if #panel.options.legend != _|_ if #showLegend {
			legend: {
				if #panel.type == "status-history" {
					position: [
						if #panel.options.legend.placement != _|_ if #panel.options.legend.placement == "right" {"right"},
						{"bottom"}
					][0]
					mode: [
						if #panel.options.legend.displayMode == "list" { "list" },
						if #panel.options.legend.displayMode == "table" { "table" },
					][0]
				}
			}
		}

	}
}
