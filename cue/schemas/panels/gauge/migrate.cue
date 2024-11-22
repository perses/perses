if (*#panel.type | null) == "gauge" {
	kind: "GaugeChart"
	spec: {
		calculation: *#mapping.calc[#panel.options.reduceOptions.calcs[0]] | #defaultCalc // only consider [0] here as Perses's GaugeChart doesn't support individual calcs

		#unit: *#mapping.unit[#panel.fieldConfig.defaults.unit] | null
		if #unit != null {
			format: unit: #unit
		}

		#decimal: *#panel.fieldConfig.defaults.decimal | null
		if #decimal != null {
			format: decimalPlaces: #decimal
		}

		#steps: *#panel.fieldConfig.defaults.thresholds.steps | null
		if #steps != null {
			thresholds: {
				// defaultColor: TODO how to fill this one?
				steps: [for _, step in #steps if step.value != _|_ {
					value: [// switch
						if step.value == null {0},
						step.value,
					][0]
					color: step.color
				}]
			}
		}

		if #panel.fieldConfig.defaults.max != _|_ {
			max: #panel.fieldConfig.defaults.max
		}
	}
},
