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

package refresh

import (
	"fmt"
	"io"

	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/spf13/cobra"
)

type refreshOption interface {
	Refresh() error
}

type option struct {
	persesCMD.Option
	writer       io.Writer
	errWriter    io.Writer
	apiClient    api.ClientInterface
	externalAuth bool
}

func (o *option) Complete(args []string) error {
	if len(args) > 0 {
		return fmt.Errorf("no args are supported by the command 'refresh'")
	}
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return err
	}
	o.apiClient = apiClient

	apiConfig, err := apiClient.Config()
	if err != nil {
		return err
	}
	if apiConfig.Security.Authentication.Providers.KubernetesProvider.Enable {
		o.externalAuth = true
	}

	return nil
}

func (o *option) Validate() error {
	if !o.externalAuth && len(config.Global.RefreshToken) == 0 {
		return fmt.Errorf("refresh_token doesn't exist in the config, please use the command login to get one")
	}
	if o.externalAuth && len(config.Global.RestClientConfig.K8sAuth.KubeconfigFile) == 0 {
		return fmt.Errorf("kubeconfig location has not been set, please use the command login to set it")
	}
	return nil
}

func (o *option) Execute() error {
	refreshOption, err := o.newRefreshOption()
	if err != nil {
		return err
	}
	err = refreshOption.Refresh()
	if err != nil {
		return err
	}
	return output.HandleString(o.writer, "token has been refreshed")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
}

func (o *option) newRefreshOption() (refreshOption, error) {
	apiClient, err := config.Global.GetAPIClient()
	if err != nil {
		return nil, err
	}
	if config.Global.RestClientConfig.K8sAuth != nil {
		return &k8sRefresh{
			apiClient: apiClient,
		}, nil
	}
	return &nativeRefresh{
		apiClient: apiClient,
	}, nil
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "refresh",
		Short: "refresh the access token when it expires",
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	return cmd
}
