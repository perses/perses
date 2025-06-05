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

import { Accordion, AccordionDetails, Chip, AccordionSummary, Box, Divider, Typography, useTheme } from '@mui/material';

import { ReactElement } from 'react';
import { useUserPermissions } from '../../model/user-client';
import { useAuthToken } from '../../model/auth-client';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ShieldAccount from 'mdi-material-ui/ShieldAccount';

const ProfilePermissions = (): ReactElement => {
  const theme = useTheme();
  const { data: decodedToken } = useAuthToken();
  const username = decodedToken?.sub || '';
  const { data: permissions } = useUserPermissions(username);

  const permissionsFlat = Object.keys(permissions || {}).map((key) => ({
    key,
    permissions: permissions?.[key] || [],
  }));

  const glossary: Record<string, string> = {
    '*': 'All',
  };

  const groupWrapperStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 0.5,
  };

  /* 33.33% Because maybe later probably we have an edit button in the last cell */
  const tableCellStyle = {
    width: '33.33%',
    borderBottom: 'none',
  };

  return (
    <Box data-testid="permissions-container" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: (theme) => theme.spacing(2, 2),
          gap: 0.5,
        }}
      >
        <ShieldAccount sx={{ fontSize: 24 }} />
        <Typography variant="h1" sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          Permissions and roles
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ padding: (theme) => theme.spacing(2, 2) }}>
        {permissionsFlat.map((item) => (
          <Accordion
            data-testid={`${item.key}-according`}
            sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}
            expanded
            key={item.key}
          >
            <AccordionSummary
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                paddingBottom: 1,
              }}
              id={item.key}
            >
              <Typography variant="h2">{glossary[item.key] || item.key}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              {(item.permissions || []).map((g, idx) => (
                <Box
                  sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius }}
                  component="fieldset"
                  data-testid={`${item.key}-subgroup-${idx}`}
                >
                  <legend>
                    <Typography variant="h3" fontWeight="bold">
                      {`Group-${idx + 1}`}
                    </Typography>
                  </legend>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '33.33%' }}>
                            <Typography variant="h4" fontWeight="bold">
                              Scopes
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: '33.33%' }}>
                            <Typography variant="h4" fontWeight="bold">
                              Actions
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ ...tableCellStyle }}>
                            <Box sx={{ ...groupWrapperStyle }}>
                              {g.scopes.map((scope) => (
                                <Chip
                                  data-testid={`chip-scope-${scope}`}
                                  key={scope}
                                  label={glossary[scope] || scope}
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ ...tableCellStyle }}>
                            <Box sx={{ ...groupWrapperStyle }}>
                              {g.actions.map((action) => (
                                <Chip
                                  data-testid={`chip-action-${action}`}
                                  key={action}
                                  label={glossary[action] || action}
                                />
                              ))}
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default ProfilePermissions;
