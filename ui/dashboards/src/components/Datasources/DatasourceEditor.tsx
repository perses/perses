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

import { Button } from '@mui/material';
import { DatasourceSpec } from '@perses-dev/core';
import { ExternalDatasources } from '../../context';

export function DatasourceEditor(props: {
  localDatasources: Record<string, DatasourceSpec>;
  externalDatasources: ExternalDatasources[];
  onChange: (datasources: Record<string, DatasourceSpec>) => void;
  onCancel: () => void;
}) {
  const { localDatasources, externalDatasources, onChange, onCancel } = props;

  return (
    <>
      <div>Cest gagné !</div>
      <div>
        <p>localDatasources:</p>
        {Object.keys(localDatasources).map((_, i) => {
          return <span key={i}>lds n°{i}</span>;
        })}
      </div>
      <div>
        <p>externalDatasources:</p>
        {externalDatasources.map((_, i) => {
          return <span key={i}>eds n°{i}</span>;
        })}
      </div>
      <Button
        variant="contained"
        onClick={() => {
          onChange(localDatasources);
        }}
      >
        Apply
      </Button>
      <Button color="secondary" variant="outlined" onClick={onCancel}>
        Cancel
      </Button>
    </>
  );
}
