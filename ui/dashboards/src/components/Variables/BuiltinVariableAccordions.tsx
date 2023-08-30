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
import { useMemo } from 'react';

type BuiltinVariableAccordionsProps = {
  builtinVariableDefinitions: BuiltinVariableDefinition[];
};

export function BuiltinVariableAccordions({ builtinVariableDefinitions }: BuiltinVariableAccordionsProps) {
  const builtinVariablesBySource = useMemo(() => {
    const result: Record<string, BuiltinVariableDefinition[]> = {};
    for (const definition of builtinVariableDefinitions) {
      const value = result[definition.spec.source];
      if (value) {
        value.push(definition);
      } else {
        result[definition.spec.source] = [definition];
      }
    }
    return result;
  }, [builtinVariableDefinitions]);

  return (
    <>
      <Accordion
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
            <InfoTooltip title="Builtin Variables" description="Variables computed during dashboard rendering.">
              <span>Builtin Variables</span>
            </InfoTooltip>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="table of external variables">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {builtinVariableDefinitions.map((v) => (
                  <TableRow key={v.spec.name}>
                    <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                      {v.spec.name}
                    </TableCell>
                    <TableCell>{v.spec.source}</TableCell>
                    <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
