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

package login

import (
	"fmt"
	"net/url"

	cmdUtils "github.com/perses/perses/internal/cli/utils"
	"github.com/perses/perses/pkg/client/perseshttp"
	"github.com/spf13/cobra"
)

type option struct {
	url         string
	insecureTLS bool
}

func (o *option) complete(args []string) error {
	if len(args) == 0 || len(args) > 1 {
		return fmt.Errorf("only the server URL should be specified as an argument")
	}
	o.url = args[0]
	return nil
}

func (o *option) validate() error {
	if _, err := url.Parse(o.url); err != nil {
		return err
	}
	return nil
}

func (o *option) execute() error {
	return cmdUtils.WriteConfig(&cmdUtils.CLIConfig{
		RestClientConfig: perseshttp.RestConfigClient{
			URL:         o.url,
			InsecureTLS: o.insecureTLS,
		},
	})
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "login URL",
		Short: "Lo in to the Perses' API",
		Example: `
# Log in to the given server
percli login https://perses.dev
`,
		Run: func(cmd *cobra.Command, args []string) {
			cmdUtils.HandleError(o.complete(args))
			cmdUtils.HandleError(o.validate())
			cmdUtils.HandleError(o.execute())
		},
	}
	cmd.Flags().BoolVar(&o.insecureTLS, "insecure-skip-tls-verify", o.insecureTLS, "if true the server's certificate will not be checked for validity. This will make your HTTPS connections insecure")
	return cmd
}
