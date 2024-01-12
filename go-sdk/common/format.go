// Copyright 2024 The Perses Authors
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
	"fmt"
)

type TimeUnit string
type PercentageUnit string
type ThroughputUnit string

const (
	MilliSecondsUnit       TimeUnit       = "milliseconds"
	SecondsUnit            TimeUnit       = "seconds"
	MinutesUnit            TimeUnit       = "minutes"
	HoursUnit              TimeUnit       = "hours"
	DaysUnit               TimeUnit       = "days"
	WeeksUnit              TimeUnit       = "weeks"
	MonthsUnit             TimeUnit       = "months"
	YearsUnit              TimeUnit       = "years"
	PercentUnit            PercentageUnit = "percent"
	PercentDecimalUnit     PercentageUnit = "percent-decimal"
	DecimalUnit            string         = "decimal"
	BytesUnit              string         = "bytes"
	CountsPerSecondsUnit   ThroughputUnit = "counts/sec"
	EventsPerSecondsUnit   ThroughputUnit = "events/sec"
	MessagesPerSecondsUnit ThroughputUnit = "messages/sec"
	OpsPerSecondsUnit      ThroughputUnit = "ops/sec"
	PacketsPerSecondsUnit  ThroughputUnit = "packets/sec"
	ReadsPerSecondsUnit    ThroughputUnit = "reads/sec"
	RecordsPerSecondsUnit  ThroughputUnit = "records/sec"
	RequestsPerSecondsUnit ThroughputUnit = "requests/sec"
	RowsPerSecondsUnit     ThroughputUnit = "rows/sec"
	WritesPerSecondsUnit   ThroughputUnit = "writes/sec"
)

type Format struct {
	Unit          string `json:"unit" yaml:"unit"`
	DecimalPlaces *int   `json:"decimalPlaces" yaml:"decimalPlaces"`
	ShortValues   *bool  `json:"shortValues" yaml:"shortValues"`
}

func (f *Format) UnmarshalJSON(data []byte) error {
	type plain Format
	var tmp Format
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Format) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var tmp Format
	type plain Format
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Format) validate() error {
	switch f.Unit {
	case string(MilliSecondsUnit), string(SecondsUnit), string(MinutesUnit),
		string(HoursUnit), string(DaysUnit), string(WeeksUnit), string(MonthsUnit),
		string(YearsUnit), string(PercentUnit), string(PercentDecimalUnit), DecimalUnit, BytesUnit,
		string(CountsPerSecondsUnit), string(EventsPerSecondsUnit), string(MessagesPerSecondsUnit),
		string(OpsPerSecondsUnit), string(PacketsPerSecondsUnit), string(ReadsPerSecondsUnit), string(RecordsPerSecondsUnit),
		string(RequestsPerSecondsUnit), string(RowsPerSecondsUnit), string(WritesPerSecondsUnit):
		return nil
	default:
		return fmt.Errorf("unknown format")
	}
}
