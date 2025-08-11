package migrate

#grafanaType: "stat"
#panel:       _

kind: "MyPanel"
spec: {
	title: #panel.title
	query: {
		datasource: "prometheus"
		expression: #panel.targets[0].expr
	}
	if #panel.fieldConfig != _|_ {
		if #panel.fieldConfig.defaults != _|_ {
			if #panel.fieldConfig.defaults.color != _|_ {
				display: {
					color: #panel.fieldConfig.defaults.color.mode
				}
			}
			if #panel.fieldConfig.defaults.thresholds != _|_ {
				if #panel.fieldConfig.defaults.thresholds.steps != _|_ {
					thresholds: [for step in #panel.fieldConfig.defaults.thresholds.steps {
						color: step.color
						value: step.value
					}]
				}
			}
		}
	}
}
