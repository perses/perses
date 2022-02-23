// Copyright 2022 The Perses Authors
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

package utils

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/olekukonko/tablewriter"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v2"
)

const (
	JSONOutput = "json"
	YAMLOutput = "yaml"
)

// ValidateAndSetOutput will validate the given output and if it's empty will set it with the default value "yaml"
func ValidateAndSetOutput(o *string) error {
	if *o == "" {
		*o = YAMLOutput
		return nil
	} else if *o != YAMLOutput && *o != JSONOutput {
		return fmt.Errorf("--ouput must be %q or %q", JSONOutput, YAMLOutput)
	}

	return nil
}

func HandleOutput(output string, obj interface{}) error {
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
	fmt.Println(string(data))
	return nil
}

func HandleError(err error) {
	if err != nil {
		logrus.Error(err)
		os.Exit(1)
	}
}

func HandlerTable(column []string, data [][]string) {
	table := tablewriter.NewWriter(os.Stdout)
	table.SetHeader(column)
	table.SetBorder(false)
	table.AppendBulk(data)
	table.Render()
}

// FormatArrayMessage format an array to a list
func FormatArrayMessage(message string, list []string) string {
	var builder strings.Builder
	builder.WriteString(message)
	for _, e := range list {
		builder.WriteString(fmt.Sprintf("  * %s\n", e))
	}
	return builder.String()
}

// FormatTime formats a time with human readable format
func FormatTime(t time.Time) string {
	var age string

	delay := time.Since(t)

	if day := int(delay.Hours() / 24); day > 1 {
		age = strconv.Itoa(day) + "d"
	} else if hours := int(delay.Hours()); hours > 0 {
		age = strconv.Itoa(hours) + "h"
	} else if minutes := int(delay.Minutes()); minutes > 0 {
		age = strconv.Itoa(minutes) + "m"
	} else {
		age = strconv.Itoa(int(delay.Seconds())) + "s"
	}
	return age
}
