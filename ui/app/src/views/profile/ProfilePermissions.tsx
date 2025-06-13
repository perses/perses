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

import { Accordion, AccordionDetails, Chip, AccordionSummary, Box, Divider, Typography } from '@mui/material';

import { ReactElement } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ShieldAccount from 'mdi-material-ui/ShieldAccount';
import Archive from 'mdi-material-ui/Archive';
import { useUserPermissions } from '../../model/user-client';
import { useAuthorizationContext } from '../../context/Authorization';

const ProfilePermissions = (): ReactElement => {
  const { username } = useAuthorizationContext();
  const { data: permissions } = useUserPermissions(username);
  const permissionsFlat = Object.keys(permissions || {}).map((key) => ({
    key,
    permissions: permissions?.[key] || [],
  }));

  const glossary: Record<string, string> = {
    '*': 'Global',
  };

  const tableCellStyle = {
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.key !== '*' && <Archive sx={{ fontSize: 24 }} />}
                <Typography variant="h2">{glossary[item.key] || item.key}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <Typography variant="h4" fontWeight="bold">
                          Actions
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h4" fontWeight="bold">
                          Scopes
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(item.permissions || []).map((permission, index) => (
                      <TableRow
                        key={`permission-${index}`}
                        sx={{
                          borderBottom: `${index !== item.permissions.length - 1 ? '1px solid' : 'none'}`,
                          borderColor: 'divider',
                        }}
                      >
                        <TableCell sx={tableCellStyle}>
                          {!permission.actions.includes('*') ? (
                            permission.actions.map((a) => (
                              <Chip
                                data-testid={`permission-${index}-action-${a}`}
                                key={`permission-${index}-${a}`}
                                label={glossary[a] || a}
                              />
                            ))
                          ) : (
                            <Chip
                              data-testid={`permission-${index}-action-all`}
                              key={`permission-${index}-all`}
                              label="All Actions"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={tableCellStyle}>
                          {!permission.scopes.includes('*') ? (
                            permission.scopes.map((s) => (
                              <Chip
                                data-testid={`permission-${index}-scope-${s}`}
                                key={`permission-${index}-${s}`}
                                label={glossary[s] || s}
                              />
                            ))
                          ) : (
                            <Chip
                              data-testid={`permission-${index}-scope-all`}
                              key={`permission-${index}-all`}
                              label="All Resources"
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default ProfilePermissions;
