if #panel.type != _|_ if #panel.type == "stat" {
	kind: "StatChart"
	spec: {
		#calcName: *"\(#panel.options.reduceOptions.calcs[0])" | null // only consider [0] here as Perses's StatChart doesn't support individual calcs
		calculation: [// switch
			if #mapping.calc[#calcName] != _|_ {#mapping.calc[#calcName]},
			#defaultCalc,
		][0]

		#unitPath: *"\(#panel.fieldConfig.defaults.unit)" | null
		if #unitPath != null if #mapping.unit[#unitPath] != _|_ {
			format: {
				unit: #mapping.unit[#unitPath]
			}
		}
		#decimal: *(#panel.fieldConfig.defaults.decimal) | null
		if #decimal != null {
			format: {
				decimalPlaces: #decimal
			}
		}

		if #panel.fieldConfig.defaults.thresholds != _|_ if #panel.fieldConfig.defaults.thresholds.steps != _|_

		// nothing to map to the `sparkline` field yet
		{
			thresholds: {
				// defaultColor: TODO how to fill this one?
				steps: [for _, step in #panel.fieldConfig.defaults.thresholds.steps if step.value != _|_ {
					value: [// switch
						if step.value == null {0},
						{step.value},
					][0]
					color: step.color // TODO how to manage the overrides part? 
				}]
			}
		}
	}
},
