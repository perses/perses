package gauge

import "common"

#panel: {
  kind: "GaugeChart"
  display: {
  	name: string
  }
  options: {
    query: #query
    calculation: #common.calculation
    unit?: #common.unit
    thresholds?: #common.threasholds
  }
}

#query: {

}

#panel
