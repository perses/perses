// Copyright The Perses Authors
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

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

// validUnits lists every unit string the package exports as a legal Format
// unit. Format.validate must accept all of them; keeping this list next to the
// switch guards against a newly-added constant being forgotten in validate.
var validUnits = []string{
	string(NanoSecondsUnit), string(MicroSecondsUnit), string(MilliSecondsUnit), string(SecondsUnit),
	string(MinutesUnit), string(HoursUnit), string(DaysUnit), string(WeeksUnit), string(MonthsUnit), string(YearsUnit),
	string(PercentUnit), string(PercentDecimalUnit),
	DecimalUnit,
	string(BinaryBitsUnit), string(DecimalBitsUnit), string(BinaryBytesUnit), string(DecimalBytesUnit),
	string(BitsPerSecondsUnit), string(BitsDecPerSecondsUnit), string(BytesPerSecondsUnit), string(BytesDecPerSecondsUnit),
	string(CountsPerSecondsUnit), string(EventsPerSecondsUnit), string(MessagesPerSecondsUnit), string(OpsPerSecondsUnit),
	string(PacketsPerSecondsUnit), string(ReadsPerSecondsUnit), string(RecordsPerSecondsUnit), string(RequestsPerSecondsUnit),
	string(RowsPerSecondsUnit), string(WritesPerSecondsUnit),
	string(AustralianDollarUnit), string(CanadianDollarUnit), string(SwissFrancUnit), string(RenminbiUnit),
	string(EuroUnit), string(PoundUnit), string(HongKongDollarUnit), string(IndianRupeeUniit), string(YenUnit),
	string(SouthKoreanWonUnit), string(NorwegianKroneUnit), string(NewZealandDollarUnit), string(SwedishKronaDollarUnit),
	string(SingaporeDollarUnit), string(USDollarUnit),
	string(CelsiusUnit), string(FahrenheitUnit),
	string(DatetimeISOUnit), string(DatetimeUSUnit), string(DatetimeLocalUnit), string(DateISOUnit), string(DateUSUnit), string(DateLocalUnit),
	string(TimeLocalUnit), string(TimeISOUnit), string(TimeUSUnit), string(RelativeTimeUnit), string(UnixTimestampUnit), string(UnixTimestampMsUnit),
}

func TestFormatUnmarshalJSONValidUnits(t *testing.T) {
	for _, unit := range validUnits {
		t.Run(unit, func(t *testing.T) {
			var f Format
			err := json.Unmarshal([]byte(`{"unit":"`+unit+`"}`), &f)
			assert.NoError(t, err)
			if assert.NotNil(t, f.Unit) {
				assert.Equal(t, unit, *f.Unit)
			}
		})
	}
}

func TestFormatUnmarshalJSON(t *testing.T) {
	testCases := []struct {
		name        string
		json        string
		expectError bool
	}{
		// Regression cases: these exported units were rejected as "unknown format".
		{name: "bits", json: `{"unit":"bits"}`},
		{name: "decbits", json: `{"unit":"decbits"}`},
		{name: "sek", json: `{"unit":"sek"}`},
		{name: "sgd", json: `{"unit":"sgd"}`},
		{name: "usd", json: `{"unit":"usd"}`},
		{name: "celsius", json: `{"unit":"celsius"}`},
		{name: "fahrenheit", json: `{"unit":"fahrenheit"}`},
		{name: "datetime-iso", json: `{"unit":"datetime-iso"}`},
		{name: "unix-timestamp", json: `{"unit":"unix-timestamp"}`},
		{name: "no unit", json: `{"decimalPlaces":2}`},
		{name: "unknown unit", json: `{"unit":"not-a-unit"}`, expectError: true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			var f Format
			err := json.Unmarshal([]byte(tc.json), &f)
			if tc.expectError {
				assert.Error(t, err)
				assert.Contains(t, err.Error(), "unknown format")
			} else {
				assert.NoError(t, err)
			}
		})
	}
}
