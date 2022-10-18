import { PaletteMode, PaletteOptions } from '@mui/material';
// import { blue, green, grey, orange, purple, red } from './colors';
// import { action } from './action';
import { background } from './background';
// import { error } from './error';
// import { greyOption } from './grey';
// import { inputBorder } from './input-border';
// import { primary } from './primary';
// import { secondary } from './secondary';
// import { text } from './text';
// import { warning } from './warning';
// import { alternate } from './alternate';
// import { info } from './info';
// import { success } from './success';

/**
 * Returns the MUI PaletteOptions for the given mode.
 */
export function getPaletteOptions(mode: PaletteMode): PaletteOptions {
  // Palette options should be split out into their own files with functions
  // for creating the option values based on light/dark mode
  return {
    mode,
    common: {
      white: '#FFFFFF',
      black: '#000000',
    },
    // primary: primary(mode),
    // secondary: secondary(mode),
    // grey: greyOption(mode),
    background: background(mode),
    // action: action(mode),
    // text: text(mode),
    // error: error(mode),
    // warning: warning(mode),
    // info: info(mode),
    // success: success(mode),

    // Custom colors
    // designSystem: {
    //   blue,
    //   green,
    //   grey,
    //   orange,
    //   purple,
    //   red,
    // },
  };
}
