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
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/sirupsen/logrus"
	"golang.org/x/sync/errgroup"
)

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
	logrus.Debugf("unzipping archive %s", archiveFileName)
	archiveName := archive.ExtractArchiveName(archiveFileName)
	if strings.Contains(archiveName, "..") {
		return fmt.Errorf("archive name %q contains invalid characters", archiveName)
	}
	archiveFile := filepath.Join(folder, archiveFileName)
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
