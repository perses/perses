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

package login

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"testing"

	cmdTest "github.com/perses/perses/internal/cli/test"
	"github.com/perses/perses/pkg/client/api"
	clientConfig "github.com/perses/perses/pkg/client/config"
	"github.com/perses/spec/go/common"
	"github.com/stretchr/testify/require"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

func TestLoginCMD(t *testing.T) {
	testSuite := []cmdTest.Suite{
		{
			Title:           "empty args",
			Args:            []string{},
			IsErrorExpected: true,
			ExpectedMessage: "no URL has been provided neither found in the previous configuration",
		},
		{
			Title:           "native login flag and provider flag cannot be set at the same time (1)",
			Args:            []string{"--username", "foo", "--provider", "google", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --username or --token at the same time than --client-id or --client-secret or --provider",
		},
		{
			Title:           "native login flag and provider flag cannot be set at the same time (2)",
			Args:            []string{"--username", "foo", "--client-id", "bar", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --username or --token at the same time than --client-id or --client-secret or --provider",
		},
		{
			Title:           "k8s login flag and provider flag cannot be set at the same time (1)",
			Args:            []string{"--kube", "--provider", "google", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --kube or --kubeconfig-file at the same time than --client-id or --client-secret or --provider",
		},
		{
			Title:           "k8s login flag and provider flag cannot be set at the same time (2)",
			Args:            []string{"--kube", "--client-id", "bar", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --kube or --kubeconfig-file at the same time than --client-id or --client-secret or --provider",
		},
		{
			Title:           "k8s login flag and native login flag cannot be set at the same time (1)",
			Args:            []string{"--kube", "--username", "foo", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --username or --token at the same time as --kube or --kubeconfig-file",
		},
		{
			Title:           "k8s login flag and native login flag cannot be set at the same time (2)",
			Args:            []string{"--kube", "--token", "tok", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "you can not set --username or --token at the same time as --kube or --kubeconfig-file",
		},
		{
			Title:           "provider not known",
			Args:            []string{"--provider", "bar", "https://demo.perses.dev"},
			IsErrorExpected: true,
			ExpectedMessage: "provider \"bar\" does not exist",
		},
		{
			Title:           "token flag used",
			Args:            []string{"--token", "foo.bar.jwt", "https://demo.perses.dev"},
			IsErrorExpected: false,
			ExpectedMessage: `successfully logged in https://demo.perses.dev
`,
		},
	}
	cmdTest.ExecuteSuiteTest(t, NewCMD, testSuite)
}

func TestK8sLoginExecCredentialsRotate(t *testing.T) {
	authorizations := make(chan string, 3)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authorizations <- r.Header.Get("Authorization")
		_, _ = w.Write([]byte("{}"))
	}))
	t.Cleanup(server.Close)

	executable, err := os.Executable()
	require.NoError(t, err)
	tempDir := t.TempDir()
	stateID := strconv.Itoa(os.Getpid())
	stateFile := filepath.Join(tempDir, "perses-k8s-exec-state-"+stateID)
	require.NoError(t, os.WriteFile(stateFile, []byte("0"), 0o600))
	kubeconfigFile := filepath.Join(tempDir, "config")
	kubeconfig := clientcmdapi.Config{
		Clusters: map[string]*clientcmdapi.Cluster{
			"cluster": {Server: "https://kubernetes.example"},
		},
		AuthInfos: map[string]*clientcmdapi.AuthInfo{
			"user": {Exec: &clientcmdapi.ExecConfig{
				APIVersion:      "client.authentication.k8s.io/v1",
				Command:         executable,
				Args:            []string{"-test.run=^TestK8sExecCredentialPlugin$"},
				InteractiveMode: clientcmdapi.NeverExecInteractiveMode,
				Env: []clientcmdapi.ExecEnvVar{
					{Name: "PERSES_K8S_EXEC_PLUGIN", Value: "1"},
					{Name: "PERSES_K8S_EXEC_STATE_DIR", Value: tempDir},
					{Name: "PERSES_K8S_EXEC_STATE_ID", Value: stateID},
				},
			}},
		},
		Contexts: map[string]*clientcmdapi.Context{
			"context": {Cluster: "cluster", AuthInfo: "user"},
		},
		CurrentContext: "context",
	}
	require.NoError(t, clientcmd.WriteToFile(kubeconfig, kubeconfigFile))

	baseURL := common.MustParseURL(server.URL)
	loginClient, err := clientConfig.NewRESTClient(clientConfig.RestConfigClient{URL: baseURL})
	require.NoError(t, err)
	token, err := NewK8sLogin(api.NewWithClient(loginClient), kubeconfigFile).Login()
	require.NoError(t, err)
	require.Empty(t, token.AccessToken)

	persistentClient, err := clientConfig.NewRESTClient(clientConfig.RestConfigClient{
		URL:     baseURL,
		K8sAuth: &clientConfig.K8sAuth{KubeconfigFile: kubeconfigFile},
	})
	require.NoError(t, err)
	for range 2 {
		require.NoError(t, persistentClient.Get().APIPrefix("").APIVersion("").Do().Error())
	}

	for i := 1; i <= 3; i++ {
		require.Equal(t, fmt.Sprintf("Bearer token-%d", i), <-authorizations)
	}
}

func TestK8sExecCredentialPlugin(t *testing.T) {
	if os.Getenv("PERSES_K8S_EXEC_PLUGIN") != "1" {
		return
	}

	stateID, err := strconv.Atoi(os.Getenv("PERSES_K8S_EXEC_STATE_ID"))
	if err != nil || stateID <= 0 {
		fmt.Fprintln(os.Stderr, "invalid state ID")
		os.Exit(1)
	}
	stateRoot, err := os.OpenRoot(os.Getenv("PERSES_K8S_EXEC_STATE_DIR"))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	defer func() { _ = stateRoot.Close() }()
	stateFile := fmt.Sprintf("perses-k8s-exec-state-%d", stateID)
	data, err := stateRoot.ReadFile(stateFile)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	count, _ := strconv.Atoi(string(data))
	count++
	if err := stateRoot.WriteFile(stateFile, []byte(strconv.Itoa(count)), 0o600); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	fmt.Printf(`{"apiVersion":"client.authentication.k8s.io/v1","kind":"ExecCredential","status":{"expirationTimestamp":"2000-01-01T00:00:00Z","token":"token-%d"}}`, count)
	os.Exit(0)
}
