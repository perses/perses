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
	"fmt"
)

type (
	TimeUnit        string
	PercentageUnit  string
	ThroughputUnit  string
	CurrencyUnit    string
	BytesUnit       string
	TemperatureUnit string
	DateUnit        string
)

const (
	NanoSecondsUnit  TimeUnit = "nanoseconds"
	MicroSecondsUnit TimeUnit = "microseconds"
	MilliSecondsUnit TimeUnit = "milliseconds"
	SecondsUnit      TimeUnit = "seconds"
	MinutesUnit      TimeUnit = "minutes"
	HoursUnit        TimeUnit = "hours"
	DaysUnit         TimeUnit = "days"
	WeeksUnit        TimeUnit = "weeks"
	MonthsUnit       TimeUnit = "months"
	YearsUnit        TimeUnit = "years"
	// DtDhmsUnit formats a duration in seconds as "D d HH:MM:SS".
	DtDhmsUnit             TimeUnit       = "dtdhms"
	PercentUnit            PercentageUnit = "percent"
	PercentDecimalUnit     PercentageUnit = "percent-decimal"
	DecimalUnit            string         = "decimal"
	BinaryBitsUnit         BytesUnit      = "bits"
	DecimalBitsUnit        BytesUnit      = "decbits"
	BinaryBytesUnit        BytesUnit      = "bytes"
	DecimalBytesUnit       BytesUnit      = "decbytes"
	BitsPerSecondsUnit     ThroughputUnit = "bits/sec"
	BitsDecPerSecondsUnit  ThroughputUnit = "decbits/sec"
	BytesPerSecondsUnit    ThroughputUnit = "bytes/sec"
	BytesDecPerSecondsUnit ThroughputUnit = "decbytes/sec"
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
	// Additional rate units (unit string = display suffix).
	TpsUnit                ThroughputUnit  = "tps"
	TracesPerSecUnit       ThroughputUnit  = "trc/s"
	TrxPerSecUnit          ThroughputUnit  = "trx/s"
	EventsSlashSUnit       ThroughputUnit  = "e/s"
	OpSlashSUnit           ThroughputUnit  = "op/s"
	OpsSlashSUnit          ThroughputUnit  = "ops/s"
	MsgSlashSUnit          ThroughputUnit  = "msg/s"
	MsgPerSecUnit          ThroughputUnit  = "msg/sec"
	ErrorsPerSecUnit       ThroughputUnit  = "errors/s"
	CallsPerSecUnit        ThroughputUnit  = "calls/s"
	QpsUnit                ThroughputUnit  = "qps"
	DropPerSecUnit         ThroughputUnit  = "drop/s"
	RejectPerSecUnit       ThroughputUnit  = "reject/s"
	RequestsSlashSUnit     ThroughputUnit  = "requests/s"
	FlowsPerSecUnit        ThroughputUnit  = "flows/s"
	FailPerSecUnit         ThroughputUnit  = "fail/sec"
	TimeoutPerSecUnit      ThroughputUnit  = "to/s"
	ContentionPerSecUnit   ThroughputUnit  = "c/s"
	GcPerSecUnit           ThroughputUnit  = "gc/s"
	TokensPerSecUnit       ThroughputUnit  = "tk/s"
	CxnPerSecUnit          ThroughputUnit  = "cxn/s"
	CountTpsUnit           ThroughputUnit  = "count:tps"
	CountTracesPerSUnit    ThroughputUnit  = "count:traces/s"
	CountMsgPerSUnit       ThroughputUnit  = "count:msg/s"
	AustralianDollarUnit   CurrencyUnit    = "aud"
	CanadianDollarUnit     CurrencyUnit    = "cad"
	SwissFrancUnit         CurrencyUnit    = "chf"
	RenminbiUnit           CurrencyUnit    = "cny"
	EuroUnit               CurrencyUnit    = "eur"
	PoundUnit              CurrencyUnit    = "gbp"
	HongKongDollarUnit     CurrencyUnit    = "hkd"
	IndianRupeeUniit       CurrencyUnit    = "inr"
	YenUnit                CurrencyUnit    = "jpy"
	SouthKoreanWonUnit     CurrencyUnit    = "krw"
	NorwegianKroneUnit     CurrencyUnit    = "nok"
	NewZealandDollarUnit   CurrencyUnit    = "nzd"
	SwedishKronaDollarUnit CurrencyUnit    = "sek"
	SingaporeDollarUnit    CurrencyUnit    = "sgd"
	USDollarUnit           CurrencyUnit    = "usd"
	CelsiusUnit            TemperatureUnit = "celsius"
	FahrenheitUnit         TemperatureUnit = "fahrenheit"
	DatetimeISOUnit        DateUnit        = "datetime-iso"
	DatetimeUSUnit         DateUnit        = "datetime-us"
	DatetimeLocalUnit      DateUnit        = "datetime-local"
	DateISOUnit            DateUnit        = "date-iso"
	DateUSUnit             DateUnit        = "date-us"
	DateLocalUnit          DateUnit        = "date-local"
	TimeLocalUnit          DateUnit        = "time-local"
	TimeISOUnit            DateUnit        = "time-iso"
	TimeUSUnit             DateUnit        = "time-us"
	RelativeTimeUnit       DateUnit        = "relative-time"
	UnixTimestampUnit      DateUnit        = "unix-timestamp"
	UnixTimestampMsUnit    DateUnit        = "unix-timestamp-ms"
)

type Format struct {
	Unit          *string `json:"unit,omitempty"          yaml:"unit,omitempty"`
	DecimalPlaces int     `json:"decimalPlaces,omitempty" yaml:"decimalPlaces,omitempty"`
	ShortValues   bool    `json:"shortValues,omitempty"   yaml:"shortValues,omitempty"`
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

func (f *Format) UnmarshalYAML(unmarshal func(any) error) error {
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
	if f.Unit == nil {
		return nil
	}
	switch *f.Unit {
	case string(NanoSecondsUnit), string(MicroSecondsUnit), string(MilliSecondsUnit), string(SecondsUnit), string(MinutesUnit),
		string(HoursUnit), string(DaysUnit), string(WeeksUnit), string(MonthsUnit),
		string(YearsUnit), string(DtDhmsUnit), string(PercentUnit), string(PercentDecimalUnit), DecimalUnit, string(BinaryBitsUnit), string(DecimalBitsUnit), string(BinaryBytesUnit), string(DecimalBytesUnit),
		string(BitsPerSecondsUnit), string(BitsDecPerSecondsUnit), string(BytesPerSecondsUnit), string(BytesDecPerSecondsUnit), string(CountsPerSecondsUnit), string(EventsPerSecondsUnit),
		string(MessagesPerSecondsUnit), string(OpsPerSecondsUnit), string(PacketsPerSecondsUnit),
		string(ReadsPerSecondsUnit), string(RecordsPerSecondsUnit), string(RequestsPerSecondsUnit),
		string(RowsPerSecondsUnit), string(WritesPerSecondsUnit),
		string(TpsUnit), string(TracesPerSecUnit), string(TrxPerSecUnit), string(EventsSlashSUnit),
		string(OpSlashSUnit), string(OpsSlashSUnit), string(MsgSlashSUnit), string(MsgPerSecUnit),
		string(ErrorsPerSecUnit), string(CallsPerSecUnit), string(QpsUnit), string(DropPerSecUnit),
		string(RejectPerSecUnit), string(RequestsSlashSUnit), string(FlowsPerSecUnit), string(FailPerSecUnit),
		string(TimeoutPerSecUnit), string(ContentionPerSecUnit), string(GcPerSecUnit), string(TokensPerSecUnit),
		string(CxnPerSecUnit), string(CountTpsUnit), string(CountTracesPerSUnit), string(CountMsgPerSUnit),
		string(AustralianDollarUnit), string(CanadianDollarUnit),
		string(SwissFrancUnit), string(RenminbiUnit), string(EuroUnit), string(PoundUnit),
		string(HongKongDollarUnit), string(IndianRupeeUniit), string(YenUnit), string(SouthKoreanWonUnit),
		string(NorwegianKroneUnit), string(NewZealandDollarUnit), string(SwedishKronaDollarUnit), string(SingaporeDollarUnit), string(USDollarUnit),
		string(CelsiusUnit), string(FahrenheitUnit),
		string(DatetimeISOUnit), string(DatetimeUSUnit), string(DatetimeLocalUnit), string(DateISOUnit), string(DateUSUnit), string(DateLocalUnit),
		string(TimeLocalUnit), string(TimeISOUnit), string(TimeUSUnit), string(RelativeTimeUnit), string(UnixTimestampUnit), string(UnixTimestampMsUnit):
		return nil
	default:
		return fmt.Errorf("unknown format")
	}
}
