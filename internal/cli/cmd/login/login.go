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

package login

import (
	"fmt"
	"io"

	"github.com/charmbracelet/huh"
	"github.com/perses/perses/internal/api/utils"
	persesCMD "github.com/perses/perses/internal/cli/cmd"
	"github.com/perses/perses/internal/cli/config"
	"github.com/perses/perses/internal/cli/output"
	"github.com/perses/perses/pkg/client/api"
	"github.com/perses/perses/pkg/client/perseshttp"
	modelAPI "github.com/perses/perses/pkg/model/api"
	backendConfig "github.com/perses/perses/pkg/model/api/config"
	"github.com/perses/perses/pkg/model/api/v1/common"
	"github.com/perses/perses/pkg/model/api/v1/secret"
	"github.com/spf13/cobra"
)

type externalAuthKind string

const (
	externalAuthKindOAuth externalAuthKind = utils.AuthKindOAuth
	externalAuthKindOIDC  externalAuthKind = utils.AuthKindOIDC
)

const (
	nativeProvider          = "native"
	errAuthorizationPending = "authorization_pending"
	errSlowDown             = "slow_down"
	errAccessDenied         = "access_denied"
	errExpiredToken         = "expired_token"
)

type loginOption interface {
	Login() (*modelAPI.AuthResponse, error)
	SetMissingInput() error
}

type option struct {
	persesCMD.Option
	writer               io.Writer
	url                  *common.URL
	isNativeSelected     bool
	username             string
	password             string
	clientID             string
	clientSecret         string
	externalAuthKind     externalAuthKind
	externalAuthProvider string
	accessToken          string
	refreshToken         string
	insecureTLS          bool
	apiClient            api.ClientInterface
	restConfig           perseshttp.RestConfigClient
	remoteConfig         *backendConfig.Config
}

func (o *option) Complete(args []string) error {
	if len(args) > 1 {
		return fmt.Errorf("only the server URL should be specified as an argument")
	}

	// get the URL from the parameter or from the previous config
	if len(args) == 0 {
		o.url = config.Global.RestClientConfig.URL
	} else {
		var parseURLErr error
		o.url, parseURLErr = common.ParseURL(args[0])
		if parseURLErr != nil {
			return parseURLErr
		}
	}
	if o.url == nil {
		return fmt.Errorf("no URL has been provided neither found in the previous configuration")
	}

	// create a new apiClient
	o.restConfig = config.Global.RestClientConfig
	o.restConfig.URL = o.url
	if o.restConfig.TLSConfig == nil {
		o.restConfig.TLSConfig = &secret.TLSConfig{}
	}
	o.restConfig.TLSConfig.InsecureSkipVerify = o.insecureTLS
	restClient, err := perseshttp.NewFromConfig(o.restConfig)
	if err != nil {
		return err
	}
	o.apiClient = api.NewWithClient(restClient)

	// Finally get the API config, we will need for later
	cfg, err := o.apiClient.Config()
	if err != nil {
		return err
	}
	o.remoteConfig = cfg
	return nil
}

func (o *option) Validate() error {
	if !o.remoteConfig.Security.EnableAuth {
		// In case the authentication is not activated on the Perses API side,
		// there is no need to verify that the flags are correctly used since they are all being ignored.
		return nil
	}
	// check if all parameters are properly set and if exclusive flags are not used
	if len(o.username) > 0 && len(o.accessToken) > 0 {
		return fmt.Errorf("--token and --username are mutually exclusive")
	}
	if (len(o.username) > 0 || len(o.accessToken) > 0) && (len(o.clientID) > 0 || len(o.clientSecret) > 0 || len(o.externalAuthProvider) > 0) {
		return fmt.Errorf("you can not set --username or --token at the same time than --client-id or --client-secret or --provider")
	}

	// check if based on the API config, flags can be used
	providers := o.remoteConfig.Security.Authentication.Providers
	if !providers.EnableNative && (len(o.username) > 0 || len(o.password) > 0) {
		return fmt.Errorf("username/password input is forbidden as backend does not support native auth provider")
	}
	if providers.EnableNative && (len(o.username) > 0 || len(o.password) > 0) {
		o.isNativeSelected = true
	}
	if len(o.externalAuthProvider) > 0 {
		for _, prov := range providers.OIDC {
			if prov.SlugID == o.externalAuthProvider {
				o.setExternalAuthProvider(externalAuthKindOIDC, prov.SlugID)
			}
		}
		for _, prov := range providers.OAuth {
			if prov.SlugID == o.externalAuthProvider {
				o.setExternalAuthProvider(externalAuthKindOAuth, prov.SlugID)
			}
		}
		if len(o.externalAuthKind) == 0 {
			return fmt.Errorf("provider %q does not exist", o.externalAuthProvider)
		}
	}
	return nil
}

func (o *option) Execute() error {
	if o.remoteConfig.Security.EnableAuth && len(o.accessToken) == 0 {
		if len(o.externalAuthProvider) == 0 && len(o.username) == 0 && len(o.password) == 0 {
			if err := o.selectAndSetProvider(); err != nil {
				return err
			}
		}
		lgOption, err := o.newLoginOption()
		if err != nil {
			return err
		}
		if inputErr := lgOption.SetMissingInput(); inputErr != nil {
			return inputErr
		}
		token, authErr := lgOption.Login()
		if authErr != nil {
			return authErr
		}
		o.accessToken = token.AccessToken
		o.refreshToken = token.RefreshToken
	}

	o.restConfig.Authorization = secret.NewBearerToken(o.accessToken)
	if writeErr := config.Write(&config.Config{
		RestClientConfig: o.restConfig,
		RefreshToken:     o.refreshToken,
	}); writeErr != nil {
		return writeErr
	}
	return output.HandleString(o.writer, fmt.Sprintf("successfully logged in %s", o.url))
}

func (o *option) SetWriter(writer io.Writer) {
	o.writer = writer
}

func (o *option) newLoginOption() (loginOption, error) {
	if o.isNativeSelected {
		return &nativeLogin{
			writer:    o.writer,
			username:  o.username,
			password:  o.password,
			apiClient: o.apiClient,
		}, nil
	}
	if len(o.externalAuthProvider) > 0 {
		if len(o.clientSecret) > 0 || len(o.clientID) > 0 {
			return &roboticLogin{
				writer:               o.writer,
				externalAuthKind:     o.externalAuthKind,
				externalAuthProvider: o.externalAuthProvider,
				clientID:             o.clientID,
				clientSecret:         o.clientSecret,
				apiClient:            o.apiClient,
			}, nil
		}
		return &deviceCodeLogin{
			writer:               o.writer,
			externalAuthKind:     o.externalAuthKind,
			externalAuthProvider: o.externalAuthProvider,
			apiClient:            o.apiClient,
		}, nil
	}
	return nil, fmt.Errorf("unable to know what kind of login should be executed")
}

func (o *option) selectAndSetProvider() error {
	providers := o.remoteConfig.Security.Authentication.Providers
	// The first step is to collect the different providers and store it into items + modifiers.
	// items will be the selection items to display to users.
	// modifiers will be the action to save the different user input into option struct.
	modifiers := map[string]func(){}
	var options []huh.Option[string]

	if providers.EnableNative {
		optKey := "Native (username/password)"
		optValue := nativeProvider
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = func() {
			o.isNativeSelected = true
		}
	}

	// Saving OIDC item(s)
	for _, prov := range providers.OIDC {
		optKey := fmt.Sprintf("OIDC (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = func() {
			o.setExternalAuthProvider(externalAuthKindOIDC, prov.SlugID)
		}
	}

	// Saving OAuth 2.0 item(s)
	for _, prov := range providers.OAuth {
		optKey := fmt.Sprintf("OAuth 2.0 (%s)", prov.Name)
		optValue := prov.SlugID
		options = append(options, huh.NewOption(optKey, optValue))
		modifiers[optValue] = func() {
			o.setExternalAuthProvider(externalAuthKindOAuth, prov.SlugID)
		}
	}

	// In case there is only one item available, prompt selection is not necessary
	if len(options) == 1 {
		modifiers[options[0].Value]()
		return nil
	}

	selectedItem, err := o.promptProvider(options)
	if err != nil {
		return err
	}

	// Apply the modifier of the corresponding item
	modifiers[selectedItem]()
	return nil
}

func (o *option) promptProvider(options []huh.Option[string]) (string, error) {
	selectedItem := ""
	sel := huh.NewSelect[string]().
		Title("Select Provider")
	if err := sel.
		Options(options...).
		Value(&selectedItem).Run(); err != nil {
		return "", err
	}

	if err := output.HandleString(o.writer, sel.View()); err != nil {
		return "", err
	}
	return selectedItem, nil
}

func (o *option) setExternalAuthProvider(kind externalAuthKind, slugID string) {
	o.externalAuthKind = kind
	o.externalAuthProvider = slugID
}

func NewCMD() *cobra.Command {
	o := &option{}
	cmd := &cobra.Command{
		Use:   "login [URL]",
		Short: "Log in to the Perses API",
		Example: `
# Log in to the given server
percli login https://demo.perses.dev
`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return persesCMD.Run(o, cmd, args)
		},
	}
	cmd.Flags().BoolVar(&o.insecureTLS, "insecure-skip-tls-verify", o.insecureTLS, "If true the server's certificate will not be checked for validity. This will make your HTTPS connections insecure.")
	cmd.Flags().StringVarP(&o.username, "username", "u", "", "Username used for the authentication.")
	cmd.Flags().StringVarP(&o.password, "password", "p", "", "Password used for the authentication.")
	cmd.Flags().StringVar(&o.clientID, "client-id", "", "Client ID used for robotic access when using external authentication provider.")
	cmd.Flags().StringVar(&o.clientSecret, "client-secret", "", "Client Secret used for robotic access when using external authentication provider.")
	cmd.Flags().StringVar(&o.accessToken, "token", "", "Bearer token for authentication to the API server")
	cmd.Flags().StringVar(&o.externalAuthProvider, "provider", "", "External authentication provider identifier. (slug_id)")
	return cmd
}
