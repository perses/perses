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

package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

const (
	defaultRepository = "perses"
	defaultNamespace  = "persesdev"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token string `json:"token"`
}

type tagsResponse struct {
	Next    string `json:"next"`
	Results []struct {
		Name        string    `json:"name"`
		LastUpdated time.Time `json:"last_updated"`
	} `json:"results"`
}

type dockerHubClient struct {
	client *http.Client
	token  string
}

func (d *dockerHubClient) login(username, password string) error {
	body, _ := json.Marshal(loginRequest{Username: username, Password: password}) // nolint:gosec
	req, err := http.NewRequest(http.MethodPost, "https://hub.docker.com/v2/users/login/", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close() //nolint:errcheck

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("login failed: %s: %s", res.Status, string(b))
	}

	var lr loginResponse
	if err := json.NewDecoder(res.Body).Decode(&lr); err != nil {
		return err
	}
	if lr.Token == "" {
		return fmt.Errorf("empty token in login response")
	}
	d.token = lr.Token
	logrus.Info("login succeeded")
	return nil
}

func (d *dockerHubClient) listTags(endpoint string) (*tagsResponse, error) {
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+d.token)

	res, err := d.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close() //nolint:errcheck

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return nil, fmt.Errorf("list tags failed: %s: %s", res.Status, string(b))
	}

	var tr tagsResponse
	if err := json.NewDecoder(res.Body).Decode(&tr); err != nil {
		return nil, err
	}
	return &tr, nil
}

func (d *dockerHubClient) deleteTag(tag string) error {
	logrus.Infof("deleting tag: %s", tag)
	endpoint := fmt.Sprintf("https://hub.docker.com/v2/repositories/%s/%s/tags/%s/", defaultNamespace, defaultRepository, url.PathEscape(tag))
	req, err := http.NewRequest(http.MethodDelete, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+d.token)

	res, err := d.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close() //nolint:errcheck

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("delete tag %q failed: %s: %s", tag, res.Status, string(b))
	}
	return nil
}

// This script is removing docker image from dockerhub older than one month. It only removes images starting with 'main-'.
// So only the images created for each commit.
func main() {
	var (
		username = flag.String("username", os.Getenv("DOCKERHUB_USER"), "Docker Hub username")
		password = flag.String("password", os.Getenv("DOCKERHUB_PAT"), "Docker Hub PAT/password")
		dryRun   = flag.Bool("dry-run", true, "Only print tags that would be deleted")
		pageSize = flag.Int("page-size", 100, "Tags page size")
	)
	flag.Parse()

	if *username == "" || *password == "" {
		fmt.Fprintln(os.Stderr, "missing required params: username, password")
		os.Exit(1)
	}
	client := &dockerHubClient{client: &http.Client{Timeout: 30 * time.Second}}

	must(client.login(*username, *password))

	cutoff := time.Now().UTC().AddDate(0, -1, 0) // 1 month ago
	nextURL := fmt.Sprintf("https://hub.docker.com/v2/namespaces/%s/repositories/%s/tags?page_size=%d", defaultNamespace, defaultRepository, *pageSize)

	for nextURL != "" {
		resp, err := client.listTags(nextURL)
		must(err)

		for _, t := range resp.Results {
			if !strings.HasPrefix(t.Name, "main-") {
				continue
			}
			if t.LastUpdated.Before(cutoff) {
				if *dryRun {
					fmt.Printf("Would delete: %s (last_updated=%s)\n", t.Name, t.LastUpdated.Format(time.RFC3339))
				} else {
					fmt.Printf("Deleting: %s\n", t.Name)
					must(client.deleteTag(t.Name))
				}
			}
		}

		nextURL = resp.Next
	}
}

func must(err error) {
	if err != nil {
		_, _ = fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}
