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

// This script updates the formulae of the Homebrew tap (https://github.com/perses/homebrew-tap) for a stable release.
// It sets the version of each formula and the sha256 of each archive, using the checksums file published with the
// GitHub release. A formula already providing the same or a newer version is left untouched.
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"golang.org/x/mod/semver"
)

const (
	checksumsURLTemplate = "https://github.com/perses/perses/releases/download/v%[1]s/perses_%[1]s_checksums.txt"
	downloadTimeout      = time.Minute
)

var (
	formulae       = []string{"perses.rb", "percli.rb"}
	versionRegexp  = regexp.MustCompile(`^(\s*version\s+['"])([^'"]+)(['"].*)$`)
	urlRegexp      = regexp.MustCompile(`^\s*url\s+['"]([^'"]+)['"]`)
	sha256Regexp   = regexp.MustCompile(`^(\s*sha256\s+['"])[0-9a-f]{64}(['"].*)$`)
	checksumRegexp = regexp.MustCompile(`^[0-9a-f]{64}$`)
)

// checksumsFetcher returns the checksums of the archives released for the given version, indexed by archive name.
type checksumsFetcher func(ctx context.Context, version string) (map[string]string, error)

// outdatedFormula is a formula of the tap providing a version older than the released one.
type outdatedFormula struct {
	name    string
	content string
	version string
	perm    os.FileMode
}

// stableVersion returns the version without the leading "v".
// It fails if the version is not a full semver version, or if it has pre-release or build metadata.
func stableVersion(version string) (string, error) {
	v := "v" + strings.TrimPrefix(version, "v")
	if semver.Canonical(v) != v || semver.Prerelease(v) != "" {
		return "", fmt.Errorf("%q is not a stable semver version (expected format: v<major>.<minor>.<patch>)", version)
	}
	return strings.TrimPrefix(v, "v"), nil
}

func currentVersion(formula string) (string, error) {
	for line := range strings.SplitSeq(formula, "\n") {
		if m := versionRegexp.FindStringSubmatch(line); m != nil {
			return stableVersion(m[2])
		}
	}
	return "", errors.New("no version found")
}

func parseChecksums(r io.Reader) (map[string]string, error) {
	checksums := map[string]string{}
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		if len(fields) != 2 || !checksumRegexp.MatchString(fields[0]) {
			return nil, fmt.Errorf("invalid checksum line %q", line)
		}
		checksums[fields[1]] = fields[0]
	}
	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("unable to read the checksums: %w", err)
	}
	return checksums, nil
}

func checksumsURL(version string) string {
	return fmt.Sprintf(checksumsURLTemplate, version)
}

func downloadChecksums(ctx context.Context, url string) (map[string]string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("unable to create the request for %s: %w", url, err)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("unable to download %s: %w", url, err)
	}
	defer resp.Body.Close() //nolint:errcheck
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unable to download %s: unexpected status %s", url, resp.Status)
	}
	checksums, err := parseChecksums(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("unable to parse %s: %w", url, err)
	}
	return checksums, nil
}

// updateFormula sets the version of the formula and the sha256 following each url.
// The archive name is the last element of the url, where the Ruby interpolation #{version} is replaced by the version.
func updateFormula(formula, version string, checksums map[string]string) (string, error) {
	var versionCount, sha256Count int
	var pendingArchive string
	lines := strings.Split(formula, "\n")
	for i, line := range lines {
		if m := versionRegexp.FindStringSubmatch(line); m != nil {
			lines[i] = m[1] + version + m[3]
			versionCount++
		} else if m := urlRegexp.FindStringSubmatch(line); m != nil {
			if pendingArchive != "" {
				return "", fmt.Errorf("no sha256 found for the archive %q", pendingArchive)
			}
			pendingArchive = strings.ReplaceAll(path.Base(m[1]), "#{version}", version)
		} else if m := sha256Regexp.FindStringSubmatch(line); m != nil {
			if pendingArchive == "" {
				return "", fmt.Errorf("sha256 at line %d is not preceded by a url", i+1)
			}
			checksum, ok := checksums[pendingArchive]
			if !ok {
				return "", fmt.Errorf("no checksum found for the archive %q", pendingArchive)
			}
			lines[i] = m[1] + checksum + m[2]
			pendingArchive = ""
			sha256Count++
		}
	}
	if pendingArchive != "" {
		return "", fmt.Errorf("no sha256 found for the archive %q", pendingArchive)
	}
	if versionCount != 1 {
		return "", fmt.Errorf("expected exactly one version, found %d", versionCount)
	}
	if sha256Count == 0 {
		return "", errors.New("no url and sha256 found")
	}
	return strings.Join(lines, "\n"), nil
}

func outdatedFormulae(root *os.Root, version string) ([]outdatedFormula, error) {
	outdated := []outdatedFormula{}
	for _, name := range formulae {
		info, err := root.Stat(name)
		if err != nil {
			return nil, fmt.Errorf("unable to stat the formula %q: %w", name, err)
		}
		data, err := root.ReadFile(name)
		if err != nil {
			return nil, fmt.Errorf("unable to read the formula %q: %w", name, err)
		}
		current, err := currentVersion(string(data))
		if err != nil {
			return nil, fmt.Errorf("unable to get the version of the formula %q: %w", name, err)
		}
		if semver.Compare("v"+current, "v"+version) >= 0 {
			logrus.Infof("formula %s already provides the version %s, skipping it", name, current)
			continue
		}
		outdated = append(outdated, outdatedFormula{
			name:    name,
			content: string(data),
			version: current,
			perm:    info.Mode().Perm(),
		})
	}
	return outdated, nil
}

func updateTap(ctx context.Context, root *os.Root, version string, fetchChecksums checksumsFetcher) error {
	outdated, err := outdatedFormulae(root, version)
	if err != nil {
		return err
	}
	if len(outdated) == 0 {
		return nil
	}
	checksums, err := fetchChecksums(ctx, version)
	if err != nil {
		return err
	}
	// Every formula is updated before writing any of them, so the tap is left untouched if one of them can't be updated.
	updated := make([]string, 0, len(outdated))
	for _, formula := range outdated {
		content, err := updateFormula(formula.content, version, checksums)
		if err != nil {
			return fmt.Errorf("unable to update the formula %q: %w", formula.name, err)
		}
		updated = append(updated, content)
	}
	for i, formula := range outdated {
		if err := root.WriteFile(formula.name, []byte(updated[i]), formula.perm); err != nil {
			return fmt.Errorf("unable to write the formula %q: %w", formula.name, err)
		}
		logrus.Infof("formula %s updated from version %s to %s", formula.name, formula.version, version)
	}
	return nil
}

func run(version, tapDir string) error {
	if version == "" {
		return errors.New("the flag --version is required")
	}
	if tapDir == "" {
		return errors.New("the flag --tap-dir is required")
	}
	stable, err := stableVersion(version)
	if err != nil {
		return err
	}
	root, err := os.OpenRoot(tapDir)
	if err != nil {
		return fmt.Errorf("unable to open the Homebrew tap directory: %w", err)
	}
	defer root.Close() //nolint:errcheck

	ctx, cancel := context.WithTimeout(context.Background(), downloadTimeout)
	defer cancel()
	fetchChecksums := func(ctx context.Context, version string) (map[string]string, error) {
		return downloadChecksums(ctx, checksumsURL(version))
	}
	return updateTap(ctx, root, stable, fetchChecksums)
}

func main() {
	version := flag.String("version", "", "stable version released, with or without the leading 'v' (required)")
	tapDir := flag.String("tap-dir", "", "path to a local clone of the Homebrew tap (required)")
	flag.Parse()
	if err := run(*version, *tapDir); err != nil {
		logrus.WithError(err).Fatal("unable to update the Homebrew tap")
	}
}
