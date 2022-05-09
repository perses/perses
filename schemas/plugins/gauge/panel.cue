package gauge

import (
	"github.com/perses/perses/schemas/plugins/common"
)

#panel: {
	kind: "GaugeChart"
	display: {
		name: string
	}
	options: {
		query:       #query
		calculation: common.#calculation
		unit?:       common.#unit
		thresholds?: common.#thresholds
	}
}

#query: {

}

#panel
