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

package archive

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/mholt/archives"
)

type Format string

const (
	TARgz Format = "tar.gz"
	TAR   Format = "tar"
	ZIP   Format = "zip"
)

var supportedArchiveFormat = []Format{TARgz, TAR, ZIP}

func ExtractArchiveName(archiveName string) string {
	for _, format := range supportedArchiveFormat {
		if strings.HasSuffix(archiveName, string(format)) {
			return strings.TrimSuffix(archiveName, "."+string(format))
		}
	}
	return archiveName
}

func IsArchiveFile(filename string) bool {
	for _, format := range supportedArchiveFormat {
		if strings.HasSuffix(filename, string(format)) {
			return true
		}
	}
	return false
}

func IsValidFormat(format Format) bool {
	return format == TARgz ||
		format == TAR ||
		format == ZIP
}

func Build(archiveName string, archiveFormat Format, files []archives.FileInfo) error {
	// create the output file we'll write to
	out, err := os.Create(fmt.Sprintf("%s.%s", archiveName, archiveFormat))
	if err != nil {
		return err
	}
	defer out.Close() //nolint:errcheck
	format := buildCompressedArchiveStruct(archiveFormat)

	// create the archive
	return format.Archive(context.Background(), out, files)
}

func buildCompressedArchiveStruct(format Format) archives.CompressedArchive {
	switch format {
	case TAR:
		return archives.CompressedArchive{
			Archival: archives.Tar{},
		}
	case TARgz:
		return archives.CompressedArchive{
			Compression: archives.Gz{},
			Archival:    archives.Tar{},
		}
	case ZIP:
		return archives.CompressedArchive{
			Archival: archives.Zip{},
		}
	default:
		return archives.CompressedArchive{
			Compression: archives.Gz{},
			Archival:    archives.Tar{},
		}
	}
}
