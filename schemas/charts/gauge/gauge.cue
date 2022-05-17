package gauge

import (
	"github.com/perses/perses/schemas/common"
	"github.com/perses/perses/schemas/common/prometheus"
)

#panel: {
	kind: "GaugeChart"
	display: {
		name: string
	}
	options: {
		query:       prometheus.#query
		calculation: common.#calculation
		unit?:       common.#unit
		thresholds?: common.#thresholds
	}
}

#panel
