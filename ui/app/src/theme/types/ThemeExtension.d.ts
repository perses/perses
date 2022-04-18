// Allows extending Lab types/components also
import type {} from '@mui/lab/themeAugmentation';

// Use Typescript interface augmentation to extend the MUI type definition
declare module '@mui/material' {
  interface Color {
    150: string;
    250: string;
    350: string;
    450: string;
    550: string;
    650: string;
    750: string;
    850: string;
    950: string;
  }
}
