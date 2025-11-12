// Copyright 2023 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package common

#format: #timeFormat | #percentFormat | #decimalFormat | #bitsFormat | #bytesFormat | #throughputFormat | #currencyFormat | #temperatureFormat | #dateFormat

#timeFormat: {
	unit?:          "nanoseconds" | "microseconds" | "milliseconds" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years"
	decimalPlaces?: number
}

#percentFormat: {
	unit?:          "percent" | "percent-decimal"
	decimalPlaces?: number
}

#decimalFormat: {
	unit?:          "decimal"
	decimalPlaces?: number
	shortValues?:   bool
}

#bitsFormat: {
	unit?:          "bits" | "decbits"
	decimalPlaces?: number
	shortValues?:   bool
}

#bytesFormat: {
	unit?:          "bytes" | "decbytes"
	decimalPlaces?: number
	shortValues?:   bool
}

#throughputFormat: {
	unit?:          "bits/sec" | "decbits/sec" | "bytes/sec" | "decbytes/sec" | "counts/sec" | "events/sec" | "messages/sec" | "ops/sec" | "packets/sec" | "reads/sec" | "records/sec" | "requests/sec" | "rows/sec" | "writes/sec"
	decimalPlaces?: number
	shortValues?:   bool
}

#currencyFormat: {
	unit?:          "aud" | "cad" | "chf" | "cny" | "eur" | "gbp" | "hkd" | "inr" | "jpy" | "krw" | "nok" | "nzd" | "sek" | "sgd" | "usd"
	decimalPlaces?: number
}

#temperatureFormat: {
	unit: "celsius" | "fahrenheit"
	decimalPlaces?: number
}

#dateFormat: {
	unit?: "datetime-iso" | "datetime-us" | "datetime-local" | "date-iso" | "date-us" | "date-local" | "time-local" | "time-iso" | "time-us" | "relative-time" | "unix-timestamp" | "unix-timestamp-ms"
}