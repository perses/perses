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
	"github.com/perses/perses/internal/cli/cmd/login"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/spf13/cobra"
)

type option struct {
	persesCMD.Option
	writer       io.Writer
	errWriter    io.Writer
	apiClient    api.ClientInterface
	externalAuth bool
}

func (o *option) Complete(args []string) error {
	// if config.Global
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
		// If the kubernetes provider is enabled then we are using an external auth system
		o.externalAuth = true
	}

	return nil
}

func (o *option) Validate() error {
	if !o.externalAuth && len(config.Global.RefreshToken) == 0 {
		return fmt.Errorf("refresh_token doesn't exist in the config, please use the command login to get one")
	}
	return nil
}

func (o *option) Execute() error {
	if o.externalAuth {
		return o.externalRefresh()
	}
	response, err := o.apiClient.Auth().Refresh(config.Global.RefreshToken)
	if err != nil {
		return err
	}
	if writeErr := config.SetAccessToken(response.AccessToken); writeErr != nil {
		return writeErr
	}
	return output.HandleString(o.writer, "access token has been refreshed")
}

func (o *option) externalRefresh() error {
	// If the k8sAuth secret hasn't been set yet then we know that the user hasn't attempted to log in
	if config.Global.RestClientConfig.K8sAuth == nil {
		return fmt.Errorf("kubeconfig location has not been set yet, please use the command login to set it")
	}

	k8sRefresh := login.NewK8sLogin(o.apiClient, config.Global.RestClientConfig.K8sAuth.KubeconfigFile)

	tok, err := k8sRefresh.Refresh()
	if err != nil {
		return err
	}

	config.Global.RestClientConfig.K8sAuth = &secret.K8sAuth{
		KubeconfigFile: tok.AccessToken,
	}

	if writeErr := config.WriteFromScratch(&config.Config{
		RestClientConfig: config.Global.RestClientConfig,
		RefreshToken:     "",
	}); writeErr != nil {
		return writeErr
	}

	return output.HandleString(o.writer, "kubeconfig has been refreshed")
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) SetErrWriter(errWriter io.Writer) {
	o.errWriter = errWriter
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
