package common

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
	Unit          string `json:"text" yaml:"text"`
	DecimalPlaces *int   `json:"text" yaml:"text"`
	ShortValues   *bool  `json:"text" yaml:"text"`
}
