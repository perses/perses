package common

#unit: #timeUnit | #percentUnit | #decimalUnit

#timeUnit: {
	kind: "Milliseconds" | "Seconds" | "Minutes" | "Hours" | "Days" | "Weeks" | "Months" | "Years"
}

#percentUnit: {
	kind:           "Percent" | "PercentDecimal"
	decimal_places: number
}

#decimalUnit: {
	kind:           "Decimal"
	decimal_places: number
	suffix?:        "string"
	display?:       "short" | "long" | "narrow"
}
