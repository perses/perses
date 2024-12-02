if (*#panel.type | null) == "piechart" {
	kind: "PieChart"
	spec: {
		
		calculation: *#mapping.calc[#panel.options.reduceOptions.calcs[0]] | #defaultCalc // only consider [0] here as Perses's PieChart doesn't support individual calcs

		#unit: *#mapping.unit[#panel.fieldConfig.defaults.unit] | null
		if #unit != null {
			format: unit: #unit
		}

		#decimal: *#panel.fieldConfig.defaults.decimal | null
		if #decimal != null {
			format: decimalPlaces: #decimal
		}

		#showLegend: *#panel.options.legend.showLegend | true
		if #panel.options.legend != _|_ if #showLegend {
			legend: {				
				position: *(#panel.options.legend.placement & "right") | "bottom"
				mode: *(#panel.options.legend.displayMode & "table")  | "list"
			}
		}
		radius: 50
	}
}
