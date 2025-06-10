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

import { BuiltinVariableDefinition } from '@perses-dev/core';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from 'mdi-material-ui/ChevronUp';
import { InfoTooltip } from '@perses-dev/components';
import { ReactElement, useMemo } from 'react';

type BuiltinVariableAccordionsProps = {
  builtinVariableDefinitions: BuiltinVariableDefinition[];
};

export function BuiltinVariableAccordions({
  builtinVariableDefinitions,
}: BuiltinVariableAccordionsProps): ReactElement {
  const builtinVariablesBySource = useMemo(() => {
    const result: Record<string, BuiltinVariableDefinition[]> = {};
    for (const definition of builtinVariableDefinitions) {
      const value = result[definition.spec.source];
      if (value) {
        value.push(definition);
        continue;
      }
      result[definition.spec.source] = [definition];
    }
    return result;
  }, [builtinVariableDefinitions]);

  // LOGZ.IO CHANGE START:: unidash add tooltips to make features more clear to users [APPZ-348]
  const sourceDescriptionMap = useMemo((): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const definition of builtinVariableDefinitions) {
      const source = definition.spec.source;
      // Only set if we haven't found a sourceDescription for this source yet and this definition has a sourceDescription
      if (!result[source] && definition.spec.sourceDescription) {
        result[source] = definition.spec.sourceDescription;
      }
    }
    return result;
  }, [builtinVariableDefinitions]);
  // LOGZ.IO CHANGE END:: unidash add tooltips to make features more clear to users [APPZ-348]

  const sources = useMemo((): string[] => {
    const result: string[] = [];
    for (const source in builtinVariablesBySource) {
      if (!result.includes(source)) {
        result.push(source);
      }
    }
    return result;
  }, [builtinVariablesBySource]);

  const getSourceDescription = (source: string): string => {
    return sourceDescriptionMap[source] || 'Variables computed during dashboard rendering.';
  };

  return (
    <>
      {sources.map((source) => (
        <Accordion
          key={source}
          sx={(theme) => ({
            '.MuiAccordionSummary-root': {
              backgroundColor: theme.palette.background.lighter,
            },
            '.MuiAccordionDetails-root': {
              backgroundColor: theme.palette.background.lighter,
            },
          })}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="builtin" id="builtin">
            <Typography variant="h2">
              <InfoTooltip title={`${source} Built-in Variables`} description={getSourceDescription(source)}>
                <span>{source} Built-in Variables</span>
              </InfoTooltip>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="table of external variables">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(builtinVariablesBySource[source] ?? []).map((v) => (
                    <TableRow key={source + '-' + v.spec.name}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        {v.spec.name}
                      </TableCell>
                      <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}
