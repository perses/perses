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

package plugin

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

// extractionMarkerFileName is the name of the file written at the root of a plugin folder once its archive has been fully extracted.
// It contains the fingerprint of the archive, so the extraction can be skipped when the archive didn't change since the last time.
const extractionMarkerFileName = ".perses-archive.json"

// archiveFingerprint identifies the version of an archive file that has been extracted.
// Size and modification time are enough to detect that an archive has been replaced, and it avoids reading the archive entirely.
type archiveFingerprint struct {
	Name    string    `json:"name"`
	Size    int64     `json:"size"`
	ModTime time.Time `json:"modTime"`
}

func newArchiveFingerprint(info os.FileInfo) archiveFingerprint {
	return archiveFingerprint{
		Name:    info.Name(),
		Size:    info.Size(),
		ModTime: info.ModTime().UTC(),
	}
}

func (f archiveFingerprint) equal(other archiveFingerprint) bool {
	return f.Name == other.Name && f.Size == other.Size && f.ModTime.Equal(other.ModTime)
}

// isAlreadyExtracted returns true if the marker present in the plugin folder matches the given archive fingerprint,
// meaning the archive has already been fully extracted and didn't change since.
func isAlreadyExtracted(pluginFolder string, fingerprint archiveFingerprint) bool {
	data, readErr := os.ReadFile(filepath.Join(pluginFolder, extractionMarkerFileName)) //nolint: gosec
	if readErr != nil {
		if !errors.Is(readErr, fs.ErrNotExist) {
			logrus.WithError(readErr).Warnf("unable to read the extraction marker of the plugin folder %q", pluginFolder)
		}
		return false
	}
	var extracted archiveFingerprint
	if unmarshalErr := json.Unmarshal(data, &extracted); unmarshalErr != nil {
		logrus.WithError(unmarshalErr).Warnf("invalid extraction marker in the plugin folder %q", pluginFolder)
		return false
	}
	return fingerprint.equal(extracted)
}

func writeExtractionMarker(pluginFolder string, fingerprint archiveFingerprint) error {
	data, marshalErr := json.Marshal(fingerprint)
	if marshalErr != nil {
		return fmt.Errorf("unable to marshal the extraction marker: %w", marshalErr)
	}
	// The plugin folder might not exist if the archive is empty.
	if mkdirErr := os.MkdirAll(pluginFolder, 0750); mkdirErr != nil {
		return fmt.Errorf("unable to create directory %q: %w", pluginFolder, mkdirErr)
	}
	if writeErr := os.WriteFile(filepath.Join(pluginFolder, extractionMarkerFileName), data, 0600); writeErr != nil {
		return fmt.Errorf("unable to write the extraction marker in the plugin folder %q: %w", pluginFolder, writeErr)
	}
	return nil
}

type archiveJob struct {
	folder   string
	fileName string
}

type arch struct {
	folders      []string
	targetFolder string
}

func (a *arch) unzipAll() error {
	// Phase 1: collect and deduplicate by target name
	jobs := make(map[string]archiveJob)
	for _, folder := range a.folders {
		files, err := os.ReadDir(folder)
		if err != nil {
			return fmt.Errorf("unable to read directory %s: %w", folder, err)
		}
		for _, file := range files {
			if file.IsDir() || !archive.IsArchiveFile(file.Name()) {
				// We are only interested in archive files, so we skip directories and non-archive files.
				continue
			}
			name := archive.ExtractArchiveName(file.Name())
			if existing, ok := jobs[name]; ok {
				// In case there is a duplicate, we keep the one from the first folder in the list and log a warning.
				logrus.Warnf("plugin archive %q found in both %q and %q, keeping the one from %q",
					name, existing.folder, folder, existing.folder)
				continue
			}
			jobs[name] = archiveJob{folder: folder, fileName: file.Name()}
		}
	}

	// Phase 2: extract in parallel
	g := new(errgroup.Group)
	g.SetLimit(runtime.NumCPU())
	for _, job := range jobs {
		g.Go(func() error { // Go >= 1.22: loop var is per-iteration
			if err := a.unzip(job.folder, job.fileName); err != nil {
				return fmt.Errorf("unable to unzip plugin archive %q: %w", job.fileName, err)
			}
			return nil
		})
	}
	return g.Wait()
}

func (a *arch) unzip(folder string, archiveFileName string) error {
	archiveName := archive.ExtractArchiveName(archiveFileName)
	if strings.Contains(archiveName, "..") {
		return fmt.Errorf("archive name %q contains invalid characters", archiveName)
	}
	archiveFile := filepath.Join(folder, archiveFileName)
	archiveInfo, statErr := os.Stat(archiveFile)
	if statErr != nil {
		return fmt.Errorf("unable to get the information of the archive file %q: %w", archiveFile, statErr)
	}
	fingerprint := newArchiveFingerprint(archiveInfo)
	pluginFolder := filepath.Join(a.targetFolder, archiveName)
	if isAlreadyExtracted(pluginFolder, fingerprint) {
		logrus.Debugf("archive %s already extracted, skipping it", archiveFileName)
		return nil
	}
	logrus.Debugf("unzipping archive %s", archiveFileName)
	stream, archiveOpenErr := os.Open(archiveFile) //nolint: gosec
	if archiveOpenErr != nil {
		return fmt.Errorf("unable to open archive file %q: %w", archiveFile, archiveOpenErr)
	}
	defer func() {
		if closeErr := stream.Close(); closeErr != nil {
			logrus.WithError(closeErr).Error("unable to close archive file stream")
		}
	}()
	format, newStream, identifyErr := archives.Identify(context.Background(), archiveFile, stream)
	if identifyErr != nil {
		logrus.WithError(identifyErr).Errorf("unable to identify the type of the archive %q. Skipping it.", archiveFile)
		return nil
	}
	if ex, ok := format.(archives.Extractor); ok {
		if extractErr := ex.Extract(context.Background(), newStream, a.extractArchiveFileHandler(archiveName)); extractErr != nil {
			return fmt.Errorf("unable to extract the archive file: %w", extractErr)
		}
		// The marker is written only once the archive has been fully extracted.
		// If the extraction is interrupted, the marker is missing (or outdated), and the archive will be extracted again on the next start.
		return writeExtractionMarker(pluginFolder, fingerprint)
	}
	return nil
}

func (a *arch) extractArchiveFileHandler(archiveName string) archives.FileHandler {
	return func(_ context.Context, f archives.FileInfo) error {
		if f.IsDir() {
			return nil
		}
		if strings.Contains(f.NameInArchive, "..") {
			return fmt.Errorf("file %q in the archive archive %q contains invalid characters", f.NameInArchive, archiveName)
		}
		currentDir, _ := filepath.Split(f.NameInArchive)
		if mkdirErr := os.MkdirAll(filepath.Join(a.targetFolder, archiveName, currentDir), 0750); mkdirErr != nil {
			return fmt.Errorf("unable to create directory %q: %w", currentDir, mkdirErr)
		}
		stream, openErr := f.Open()
		if openErr != nil {
			return fmt.Errorf("unable to open archive file %q: %w", f.NameInArchive, openErr)
		}
		defer func() {
			if closeErr := stream.Close(); closeErr != nil {
				logrus.WithError(closeErr).Error("unable to close archive file stream")
			}
		}()
		createdFile, err := os.Create(filepath.Join(a.targetFolder, archiveName, f.NameInArchive)) // nolint: gosec
		if err != nil {
			return fmt.Errorf("unable to create the file %q: %w", f.NameInArchive, err)
		}
		defer func() {
			if closeErr := createdFile.Close(); closeErr != nil {
				logrus.WithError(closeErr).Error("unable to close created file")
			}
		}()
		// Using io.Copy instead of io.ReadAll to avoid loading the entire file into memory, which can be problematic for large files.
		_, err = io.Copy(createdFile, stream)
		if err != nil {
			return fmt.Errorf("unable to copy the file %q: %w", f.NameInArchive, err)
		}
		return nil
	}
}
