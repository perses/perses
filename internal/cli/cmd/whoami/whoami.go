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

package whoami

import (
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/spf13/cobra"
)

type whoamiOption interface {
	Whoami() (string, error)
}

type option struct {
	persesCMD.Option
	writer        io.Writer
	errWriter     io.Writer
	showToken     bool
	showURL       bool
	authorization *secret.Authorization
}

func (o *option) Complete(_ []string) error {
	o.authorization = config.Global.RestClientConfig.Authorization
	return nil
}

func (o *option) Validate() error {
	if o.authorization == nil {
		return fmt.Errorf("you are not connected to any Perses server")
	}
	return nil
}

func (o *option) Execute() error {
	if o.showURL {
		if err := output.HandleString(o.writer, fmt.Sprintf("Authenticated to the server: %s", config.Global.RestClientConfig.URL)); err != nil {
			return err
		}
	}
	if o.showToken {
		if err := output.HandleString(o.writer, fmt.Sprintf("Token used: %s", o.authorization.Credentials)); err != nil {
			return err
		}
	}
	whoamiOption, err := o.newWhoamiOption()
	if err != nil {
		return err
	}
	username, err := whoamiOption.Whoami()
	if err != nil {
		return err
	}
	return output.HandleString(o.writer, fmt.Sprintf("User used: %s", username))
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func (o *option) newWhoamiOption() (whoamiOption, error) {
	if config.Global.RestClientConfig.K8sAuth != nil {
		apiClient, err := config.Global.GetAPIClient()
		if err != nil {
			return nil, err
		}
		return &k8sWhoami{
			apiClient: apiClient,
		}, nil
	}
	return &nativeWhoami{
		credentials: o.authorization.Credentials,
	}, nil
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "whoami",
		Short: "Display current user used",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().BoolVar(&o.showToken, "show-token", o.showToken, "Print the token the current session is using.")
	cmd.Flags().BoolVar(&o.showURL, "show-url", o.showURL, "Print the current server's REST API URL.")
	return cmd
}
