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

package output

import (
	"encoding/json"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/olekukonko/tablewriter"
	"github.com/olekukonko/tablewriter/renderer"
	"github.com/olekukonko/tablewriter/tw"
	"gopkg.in/yaml.v3"
)

const (
	JSONOutput = "json"
	YAMLOutput = "yaml"
)

// ValidateAndSet will validate the given output and if it's empty will set it with the default value "yaml"
func ValidateAndSet(o *string) error {
	if *o == "" {
		*o = YAMLOutput
		return nil
	} else if *o != YAMLOutput && *o != JSONOutput {
		return fmt.Errorf("--output must be %q or %q", JSONOutput, YAMLOutput)
	}

	return nil
}

func Handle(writer io.Writer, output string, obj interface{}) error {
	var data []byte
	var err error
	if output == JSONOutput {
		data, err = json.Marshal(obj)
	} else {
		data, err = yaml.Marshal(obj)
	}
	if err != nil {
		return err
	}
	_, err = fmt.Fprintln(writer, string(data))
	return err
}

func HandleString(writer io.Writer, msg string) error {
	_, err := fmt.Fprintln(writer, msg)
	return err
}

func HandlerTable(writer io.Writer, column []string, data [][]string) error {
	table := tablewriter.NewTable(writer, tablewriter.WithRenderer(
		renderer.NewBlueprint(tw.Rendition{Borders: tw.BorderNone}),
	))
	table.Header(column)
	if err := table.Bulk(data); err != nil {
		return fmt.Errorf("unable to render table: %w", err)
	}
	return table.Render()
}

// FormatArrayMessage format an array to a list
func FormatArrayMessage(message string, list []string) string {
	var builder strings.Builder
	builder.WriteString(message + "\n")
	for _, e := range list {
		builder.WriteString(fmt.Sprintf("  * %s\n", e))
	}
	return builder.String()
}

// FormatAge returns a formatted age string corresponding to the date provided
func FormatAge(t time.Time) string {
	return FormatDuration(time.Since(t))
}

// FormatDuration formats a duration in a human-readable way
func FormatDuration(d time.Duration) string {
	var durationStr string

	if day := int(d.Hours() / 24); day > 1 {
		durationStr = strconv.Itoa(day) + "d"
	} else if hours := int(d.Hours()); hours > 0 {
		durationStr = strconv.Itoa(hours) + "h"
	} else if minutes := int(d.Minutes()); minutes > 0 {
		durationStr = strconv.Itoa(minutes) + "m"
	} else {
		durationStr = strconv.Itoa(int(d.Seconds())) + "s"
	}
	return durationStr
}
