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

package sdk

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"

	"github.com/perses/perses/go-sdk/dashboard"
	"gopkg.in/yaml.v3"
)

const (
	JSONOutput = "json"
	YAMLOutput = "yaml"
)

func executeDashboardBuilder(builder dashboard.Builder, outputFormat string, writer io.Writer, errWriter io.Writer) {
	var err error
	var output []byte
	if outputFormat == YAMLOutput {
		output, err = yaml.Marshal(builder.Dashboard)
	} else if outputFormat == JSONOutput {
		output, err = json.Marshal(builder.Dashboard)
	} else {
		err = fmt.Errorf("--output must be %q or %q", JSONOutput, YAMLOutput)
	}

	if err != nil {
		fmt.Fprint(errWriter, err)
		os.Exit(-1)
	}
	fmt.Fprint(writer, string(output))
}

func NewExec() Exec {
	outputFormat := flag.String("output", YAMLOutput, "output format of the exec")
	flag.Parse()

	return Exec{
		outputFormat: *outputFormat,
	}
}

type Exec struct {
	outputFormat string
}

// ExecuteDashboard is a helper to print the result of a dashboard builder in stdout and errors to stderr
func (b *Exec) ExecuteDashboard(builder dashboard.Builder, err error) {
	if err != nil {
		fmt.Fprint(os.Stderr, err)
		os.Exit(-1)
	}
	executeDashboardBuilder(builder, b.outputFormat, os.Stdout, os.Stderr)
}
