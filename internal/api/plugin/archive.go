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
	"path"
	"strings"

	"github.com/mholt/archiver/v4"
	"github.com/sirupsen/logrus"
)

var supportedArchiveFormat = []string{
	".tar.gz",
	".tar",
	".zip",
	".rar",
	".7z",
}

func isArchiveFile(filename string) bool {
	for _, format := range supportedArchiveFormat {
		if strings.HasSuffix(filename, format) {
			return true
		}
	}
	return false
}

type archive struct {
	folder       string
	targetFolder string
}

func (a *archive) unzipAll() error {
	files, err := os.ReadDir(a.folder)
	if err != nil {
		return fmt.Errorf("unable to read directory %s: %w", a.folder, err)
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

func (a *archive) unzip(archiveFileName string) error {
	if !isArchiveFile(archiveFileName) {
		logrus.Debugf("skipping unarchive file %s", archiveFileName)
		return nil
	}
	logrus.Debugf("unzipping archive %s", archiveFileName)
	archiveFile := path.Join(a.folder, archiveFileName)
	stream, archiveOpenErr := os.Open(archiveFile)
	defer func() {
		if closeErr := stream.Close(); closeErr != nil {
			logrus.WithError(closeErr).Error("unable to close archive file stream")
		}
	}()
	if archiveOpenErr != nil {
		return fmt.Errorf("unable to open archive file %q", archiveFile)
	}
	format, newStream, identifyErr := archiver.Identify(archiveFile, stream)
	if identifyErr != nil {
		logrus.WithError(identifyErr).Errorf("unable to identify the type of the archive %q. Skipping it.", archiveFile)
		return nil
	}
	if ex, ok := format.(archiver.Extractor); ok {
		if extractErr := ex.Extract(context.Background(), newStream, nil, a.extractArchiveFileHandler); extractErr != nil {
			return fmt.Errorf("unable to extract the archive file")
		}
	}
	return nil
}

func (a *archive) extractArchiveFileHandler(_ context.Context, f archiver.File) error {
	if f.IsDir() {
		return nil
	}
	currentDir, _ := path.Split(f.NameInArchive)
	if mkdirErr := os.MkdirAll(path.Join(a.targetFolder, currentDir), os.ModePerm); mkdirErr != nil {
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
	if writeErr := os.WriteFile(path.Join(a.targetFolder, f.NameInArchive), respBytes, os.ModePerm); writeErr != nil {
		return fmt.Errorf("unable to write the file %q: %w", f.NameInArchive, writeErr)
	}
	return nil
}
