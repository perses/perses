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

package plugin

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/mholt/archives"
	"github.com/perses/perses/internal/api/archive"
	"github.com/sirupsen/logrus"
)

type Arch struct {
	Folder       string
	TargetFolder string
}

func (a *Arch) UnzipAll() error {
	files, err := os.ReadDir(a.Folder)
	if err != nil {
		return fmt.Errorf("unable to read directory %s: %w", a.Folder, err)
	}
	for _, file := range files {
		if file.IsDir() {
			// we are only looking for archive, so we can skip any sub-folder
			continue
		}

		if unzipErr := a.unzip(file.Name()); unzipErr != nil {
			return fmt.Errorf("unable to unzip plugin archive %q: %w", file.Name(), unzipErr)
		}
	}
	return nil
}

func (a *Arch) unzip(archiveFileName string) error {
	if !archive.IsArchiveFile(archiveFileName) {
		logrus.Debugf("skipping unarchive file %s", archiveFileName)
		return nil
	}
	logrus.Debugf("unzipping archive %s", archiveFileName)
	archiveFile := filepath.Join(a.Folder, archiveFileName)
	stream, archiveOpenErr := os.Open(archiveFile)
	defer func() {
		if closeErr := stream.Close(); closeErr != nil {
			logrus.WithError(closeErr).Error("unable to close archive file stream")
		}
	}()
	if archiveOpenErr != nil {
		return fmt.Errorf("unable to open archive file %q", archiveFile)
	}
	format, newStream, identifyErr := archives.Identify(context.Background(), archiveFile, stream)
	if identifyErr != nil {
		logrus.WithError(identifyErr).Errorf("unable to identify the type of the archive %q. Skipping it.", archiveFile)
		return nil
	}
	if ex, ok := format.(archives.Extractor); ok {
		if extractErr := ex.Extract(context.Background(), newStream, a.extractArchiveFileHandler); extractErr != nil {
			return fmt.Errorf("unable to extract the archive file")
		}
	}
	return nil
}

func (a *Arch) extractArchiveFileHandler(_ context.Context, f archives.FileInfo) error {
	if f.IsDir() {
		return nil
	}
	currentDir, _ := filepath.Split(f.NameInArchive)
	if mkdirErr := os.MkdirAll(filepath.Join(a.TargetFolder, currentDir), os.ModePerm); mkdirErr != nil {
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
	respBytes, err := io.ReadAll(stream)
	if err != nil {
		return fmt.Errorf("unable to read the file %q: %w", f.NameInArchive, err)
	}
	if writeErr := os.WriteFile(filepath.Join(a.TargetFolder, f.NameInArchive), respBytes, 0644); writeErr != nil { // nolint: gosec
		return fmt.Errorf("unable to write the file %q: %w", f.NameInArchive, writeErr)
	}
	return nil
}
