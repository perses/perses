if #panel.type != _|_ if #panel.type == "stat" {
	kind: "StatChart"
	spec: {
		#calcPath: "\(#panel.options.reduceOptions.calcs[0])" // only consider [0] here as Perses's StatChart doesn't support multi queries
		calculation: [ // switch
			if #mapping.calc[#calcPath] != _|_ { #mapping.calc[#calcPath] },
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
		
		// nothing to map to the `sparkline` field yet
	}
},
