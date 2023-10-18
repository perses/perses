if #panel.type != _|_ if #panel.type == "gauge" {
	kind: "GaugeChart"
	spec: {
		#calcName: "\(#panel.options.reduceOptions.calcs[0])" // only consider [0] here as Perses's GaugeChart doesn't support multi queries
		calculation: [ // switch
			if #mapping.calc[#calcName] != _|_ { #mapping.calc[#calcName] },
			{ #defaultCalc }
		][0]

		#unitPath: *"\(#panel.fieldConfig.defaults.unit)" | null
		if #unitPath != null if #mapping.unit[#unitPath] != _|_ {
			format: {
				unit: #mapping.unit[#unitPath]
			}
		}

		if #panel.fieldConfig.defaults.thresholds != _|_ {
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
		if #panel.fieldConfig.defaults.max != _|_ {
			max: #panel.fieldConfig.defaults.max
		}
	}
},
