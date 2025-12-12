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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HTTPDatasourceSpec } from '@perses-dev/core';
import { FormProvider, useForm } from 'react-hook-form';
import { ReactElement } from 'react';
import { HTTPSettingsEditor } from './HTTPSettingsEditor';

describe('HTTPSettingsEditor - Request Headers', () => {
  const initialSpecDirect: HTTPDatasourceSpec = {
    directUrl: '',
  };

  const initialSpecProxy: HTTPDatasourceSpec = {
    proxy: {
      kind: 'HTTPProxy',
      spec: {
        url: '',
      },
    },
  };

  const renderComponent = (value: HTTPDatasourceSpec, onChange = jest.fn()): ReturnType<typeof render> => {
    const Wrapper = (): ReactElement => {
      const methods = useForm();
      return (
        <FormProvider {...methods}>
          <HTTPSettingsEditor
            value={value}
            onChange={onChange}
            initialSpecDirect={initialSpecDirect}
            initialSpecProxy={initialSpecProxy}
          />
        </FormProvider>
      );
    };
    return render(<Wrapper />);
  };

  describe('Adding headers', () => {
    it('should add a new empty header when clicking the add button', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
          },
        },
      };

      renderComponent(value, onChange);

      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1];
      expect(addButton).toBeInTheDocument();

      await userEvent.click(addButton!);

      // Should show header name and value fields
      await waitFor(() => {
        expect(screen.getByLabelText(/Header name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Header value/i)).toBeInTheDocument();
      });
    });

    it('should allow adding multiple headers', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
          },
        },
      };

      renderComponent(value, onChange);

      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1];
      expect(addButton).toBeDefined();

      // Add first header
      await userEvent.click(addButton!);
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Header name/i)).toHaveLength(1);
      });

      // Add second header
      await userEvent.click(addButton!);
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Header name/i)).toHaveLength(2);
      });
    });
  });

  describe('Editing headers', () => {
    it('should update header name', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      const nameInput = screen.getByLabelText(/Header name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Authorization');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall.proxy?.spec.headers).toHaveProperty('Authorization');
      });
    });

    it('should update header value', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      const valueInput = screen.getByLabelText(/Header value/i);
      await userEvent.clear(valueInput);
      await userEvent.type(valueInput, 'Bearer token123');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
        expect(lastCall.proxy?.spec.headers?.['X-Custom']).toBe('Bearer token123');
      });
    });

    it('should initialize with existing headers', () => {
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom-1': 'value1',
              'X-Custom-2': 'value2',
            },
          },
        },
      };

      renderComponent(value);

      const nameInputs = screen.getAllByLabelText(/Header name/i);
      const valueInputs = screen.getAllByLabelText(/Header value/i);

      expect(nameInputs).toHaveLength(2);
      expect(valueInputs).toHaveLength(2);
    });
  });

  describe('Removing headers', () => {
    it('should remove a header when clicking the remove button', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      // Wait for the component to render and find the remove button by its aria-label
      const removeButton = await screen.findByLabelText('Remove header X-Custom');
      expect(removeButton).toBeInTheDocument();

      await userEvent.click(removeButton);

      // Give React time to process the state update and trigger onChange
      await waitFor(
        () => {
          expect(onChange).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
      expect(lastCall.proxy?.spec.headers).toBeUndefined();
    });

    it('should sync removed headers to parent immediately', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              Authorization: 'Bearer token',
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      // Find and click the remove button for X-Custom header
      const removeButton = await screen.findByLabelText('Remove header X-Custom');
      await userEvent.click(removeButton);

      // onChange should be called with only Authorization header remaining
      await waitFor(
        () => {
          expect(onChange).toHaveBeenCalled();
          const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
          expect(lastCall.proxy?.spec.headers).toEqual({ Authorization: 'Bearer token' });
          expect(lastCall.proxy?.spec.headers).not.toHaveProperty('X-Custom');
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Duplicate header detection', () => {
    it('should show warning when duplicate header names exist', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      // Add a second header
      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1]!;
      await userEvent.click(addButton);

      // Type the same header name
      const nameInputs = screen.getAllByLabelText(/Header name/i);
      await userEvent.type(nameInputs[1]!, 'X-Custom');

      // Should show duplicate warning
      await waitFor(() => {
        expect(screen.getByText(/Duplicate header names detected/i)).toBeInTheDocument();
      });
    });

    it('should highlight duplicate header names with error state', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      renderComponent(value, onChange);

      // Add a second header
      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1];
      expect(addButton).toBeDefined();
      await userEvent.click(addButton!);

      // Type the same header name
      const nameInputs = screen.getAllByLabelText(/Header name/i);
      expect(nameInputs[1]).toBeDefined();
      await userEvent.type(nameInputs[1]!, 'X-Custom');

      // Both inputs with duplicate names should have error state
      await waitFor(() => {
        const nameInputsAfter = screen.getAllByLabelText(/Header name/i);
        // Check if any of the inputs has error styling
        const hasError = nameInputsAfter.some((input) => {
          const container = input.closest('.MuiFormControl-root');
          return (
            container?.classList.contains('Mui-error') ||
            input.getAttribute('aria-invalid') === 'true' ||
            container?.querySelector('.Mui-error') !== null
          );
        });
        expect(hasError).toBe(true);
      });
    });

    it('should preserve order when header names start with numbers', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'Z-Header': 'last',
            },
          },
        },
      };

      renderComponent(value, onChange);

      // Add a header starting with a number
      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1];
      expect(addButton).toBeDefined();
      await userEvent.click(addButton!);

      const nameInputs = screen.getAllByLabelText(/Header name/i);
      expect(nameInputs[1]).toBeDefined();
      await userEvent.type(nameInputs[1]!, '1-First-Header');

      // Headers should maintain insertion order, not be reordered
      await waitFor(() => {
        const currentNameInputs = screen.getAllByLabelText(/Header name/i);
        expect((currentNameInputs[0] as HTMLInputElement).value).toBe('Z-Header');
        expect((currentNameInputs[1] as HTMLInputElement).value).toBe('1-First-Header');
      });
    });
  });

  describe('Empty headers', () => {
    it('should show "None" when no headers exist', () => {
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
          },
        },
      };

      renderComponent(value);

      // "None" appears in both Allowed endpoints and Request Headers sections
      const noneElements = screen.getAllByText(/None/i);
      expect(noneElements.length).toBeGreaterThan(0);
      expect(noneElements[noneElements.length - 1]).toBeInTheDocument();
    });

    it('should not sync empty headers to parent', async () => {
      const onChange = jest.fn();
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
          },
        },
      };

      renderComponent(value, onChange);

      // Add an empty header
      const addButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
      const addButton = addButtons[addButtons.length - 1];
      expect(addButton).toBeDefined();
      await userEvent.click(addButton!);

      // Adding empty header should not trigger onChange
      expect(onChange).not.toHaveBeenCalled();

      // Verify the header inputs are present
      await waitFor(() => {
        expect(screen.getByLabelText(/Header name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Readonly mode', () => {
    it('should disable inputs in readonly mode', () => {
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      const Wrapper = (): ReactElement => {
        const methods = useForm();
        return (
          <FormProvider {...methods}>
            <HTTPSettingsEditor
              value={value}
              onChange={jest.fn()}
              isReadonly={true}
              initialSpecDirect={initialSpecDirect}
              initialSpecProxy={initialSpecProxy}
            />
          </FormProvider>
        );
      };
      render(<Wrapper />);

      const nameInput = screen.getByLabelText(/Header name/i);
      const valueInput = screen.getByLabelText(/Header value/i);

      expect(nameInput).toHaveAttribute('readonly');
      expect(valueInput).toHaveAttribute('readonly');
    });

    it('should disable add/remove buttons in readonly mode', () => {
      const value: HTTPDatasourceSpec = {
        proxy: {
          kind: 'HTTPProxy',
          spec: {
            url: 'http://localhost:9090',
            headers: {
              'X-Custom': 'value1',
            },
          },
        },
      };

      const Wrapper = (): ReactElement => {
        const methods = useForm();
        return (
          <FormProvider {...methods}>
            <HTTPSettingsEditor
              value={value}
              onChange={jest.fn()}
              isReadonly={true}
              initialSpecDirect={initialSpecDirect}
              initialSpecProxy={initialSpecProxy}
            />
          </FormProvider>
        );
      };
      render(<Wrapper />);

      const buttons = screen.getAllByRole('button');
      const iconButtons = buttons.filter((btn) => btn.querySelector('svg'));

      iconButtons.forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });
  });
});
