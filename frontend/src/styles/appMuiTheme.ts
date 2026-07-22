import { createTheme } from '@mui/material/styles';
import placeholderIcon from '../assets/placeholders/PlaceholderIcon.svg';

const fontStack = (...families: string[]): string =>
  [...families, 'Arial', 'sans-serif']
    .map((family) =>
      family.includes(' ') ? `"${family}"` : family,
    )
    .join(',');

const bodyFontStack = fontStack('Trebuchet MS');
const titleFontStack = fontStack('Arial Narrow', 'Arial');
const emphasisFontStack = fontStack('Arial');

const brandColors = {
  red: '#FF595A',
  darkOak: '#30261D',
  white: '#FFFFFF',
  blueDark: '#00A0DF',
  blueLight: '#97CAEB',
  greenDark: '#61A60E',
  greenLight: '#A2D45E',
  turquoiseDark: '#00AFAA',
  turquoiseLight: '#99D9D9',
  purpleDark: '#B14FC5',
  purpleLight: '#CB8BDA',
  orange: '#FF8300',
  yellowDark: '#F5A800',
  yellowLight: '#FFC600',
} as const;

const keywordShadows = {
  yellow: '#EBB600',
  purple: '#B97FC7',
  turquoise: '#8EC9C9',
  green: '#94C256',
  blue: '#88B6D4',
  orange: '#F07B00',
} as const;

declare module '@mui/material/styles' {
  interface Palette {
    brand: {
      red: string;
      darkOak: string;
      white: string;
      blueDark: string;
      blueLight: string;
      greenDark: string;
      greenLight: string;
      turquoiseDark: string;
      turquoiseLight: string;
      purpleDark: string;
      purpleLight: string;
      orange: string;
      yellowDark: string;
      yellowLight: string;
      backgroundsWithText: {
        blue: string;
        green: string;
        turquoise: string;
        purple: string;
        yellow: string;
      };
      keywordFills: {
        yellow: string;
        purple: string;
        turquoise: string;
        green: string;
        blue: string;
        orange: string;
      };
      keywordShadows: {
        yellow: string;
        purple: string;
        turquoise: string;
        green: string;
        blue: string;
        orange: string;
      };
      shapeFills: {
        lightBlue: string;
        darkBlue: string;
        lightGreen: string;
        darkGreen: string;
        lightTurquoise: string;
        darkTurquoise: string;
        lightPurple: string;
        darkPurple: string;
        orange: string;
        lightYellow: string;
        darkYellow: string;
      };
    };
  }

  interface PaletteOptions {
    brand?: Partial<Palette['brand']>;
  }

  interface Theme {
    appBrand: {
      assets: {
        logos: {
          primary: string;
          mark: string;
        };
      };
      fonts: {
        body: string;
        title: string;
        emphasis: string;
        light: string;
      };
      page: {
        maxWidth: number;
        sectionPaddingX: {
          xs: number;
          md: number;
        };
        sectionPaddingY: {
          xs: number;
          md: number;
        };
      };
    };
  }

  interface ThemeOptions {
    appBrand?: Partial<Theme['appBrand']>;
  }
}

export const appBrandAssets = {
  logos: {
    primary: placeholderIcon,
    mark: placeholderIcon,
  },
} as const;

const theme = createTheme({
  appBrand: {
    assets: appBrandAssets,
    fonts: {
      body: 'Trebuchet MS',
      title: 'Arial Narrow',
      emphasis: 'Arial',
      light: 'Arial',
    },
    page: {
      maxWidth: 1180,
      sectionPaddingX: {
        xs: 3,
        md: 6,
      },
      sectionPaddingY: {
        xs: 5,
        md: 8,
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.red,
      contrastText: brandColors.white,
    },
    secondary: {
      main: brandColors.blueDark,
      contrastText: brandColors.white,
    },
    error: {
      main: brandColors.red,
    },
    warning: {
      main: brandColors.yellowDark,
      contrastText: brandColors.darkOak,
    },
    success: {
      main: brandColors.greenDark,
      contrastText: brandColors.white,
    },
    info: {
      main: brandColors.turquoiseDark,
      contrastText: brandColors.white,
    },
    text: {
      primary: brandColors.darkOak,
      secondary: 'rgba(48, 38, 29, 0.72)',
      disabled: 'rgba(48, 38, 29, 0.48)',
    },
    background: {
      default: brandColors.white,
      paper: brandColors.white,
    },
    divider: 'rgba(48, 38, 29, 0.14)',
    brand: {
      ...brandColors,
      backgroundsWithText: {
        blue: brandColors.blueDark,
        green: brandColors.greenDark,
        turquoise: brandColors.turquoiseDark,
        purple: brandColors.purpleDark,
        yellow: brandColors.yellowDark,
      },
      keywordFills: {
        yellow: brandColors.yellowLight,
        purple: brandColors.purpleLight,
        turquoise: brandColors.turquoiseLight,
        green: brandColors.greenLight,
        blue: brandColors.blueLight,
        orange: brandColors.orange,
      },
      keywordShadows,
      shapeFills: {
        lightBlue: brandColors.blueLight,
        darkBlue: brandColors.blueDark,
        lightGreen: brandColors.greenLight,
        darkGreen: brandColors.greenDark,
        lightTurquoise: brandColors.turquoiseLight,
        darkTurquoise: brandColors.turquoiseDark,
        lightPurple: brandColors.purpleLight,
        darkPurple: brandColors.purpleDark,
        orange: brandColors.orange,
        lightYellow: brandColors.yellowLight,
        darkYellow: brandColors.yellowDark,
      },
    },
  },
  typography: {
    htmlFontSize: 16,
    fontFamily: bodyFontStack,
    h1: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 0.98,
      letterSpacing: 0,
    },
    h2: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.05,
      letterSpacing: 0,
    },
    h3: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.08,
      letterSpacing: 0,
    },
    h4: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.12,
      letterSpacing: 0,
    },
    h5: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.15,
      letterSpacing: 0,
    },
    h6: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: 0,
    },
    subtitle1: {
      fontFamily: emphasisFontStack,
      fontWeight: 700,
      fontSize: '1.125rem',
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    subtitle2: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '1rem',
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    body1: {
      fontFamily: bodyFontStack,
      fontWeight: 400,
      fontSize: '1.0625rem',
      lineHeight: 1.55,
      letterSpacing: 0,
    },
    body2: {
      fontFamily: bodyFontStack,
      fontWeight: 400,
      fontSize: '0.9375rem',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    button: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '0.95rem',
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: 'none',
    },
    caption: {
      fontFamily: bodyFontStack,
      fontWeight: 400,
      fontSize: '0.75rem',
      lineHeight: 1.35,
      letterSpacing: 0,
    },
    overline: {
      fontFamily: titleFontStack,
      fontWeight: 700,
      fontSize: '0.75rem',
      lineHeight: 1.35,
      letterSpacing: 0,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        :root {
          --app-red: ${brandColors.red};
          --app-dark-oak: ${brandColors.darkOak};
          --app-white: ${brandColors.white};
          --app-blue-dark: ${brandColors.blueDark};
          --app-blue-light: ${brandColors.blueLight};
          --app-green-dark: ${brandColors.greenDark};
          --app-green-light: ${brandColors.greenLight};
          --app-turquoise-dark: ${brandColors.turquoiseDark};
          --app-turquoise-light: ${brandColors.turquoiseLight};
          --app-purple-dark: ${brandColors.purpleDark};
          --app-purple-light: ${brandColors.purpleLight};
          --app-orange: ${brandColors.orange};
          --app-yellow-dark: ${brandColors.yellowDark};
          --app-yellow-light: ${brandColors.yellowLight};
        }

        body {
          min-width: 320px;
          background: ${brandColors.white};
          color: ${brandColors.darkOak};
          scrollbar-gutter: stable;
        }

        img {
          max-width: 100%;
        }

        ::selection {
          background: ${brandColors.yellowLight};
          color: ${brandColors.darkOak};
        }
      `,
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: brandColors.red,
            color: brandColors.white,
            '&:hover': {
              backgroundColor: '#E94B4C',
            },
          },
        },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: {
            backgroundColor: brandColors.blueDark,
            color: brandColors.white,
            '&:hover': {
              backgroundColor: '#008ECA',
            },
          },
        },
        {
          props: { variant: 'outlined' },
          style: {
            borderColor: 'currentColor',
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          },
        },
      ],
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 22,
          paddingBlock: 11,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: titleFontStack,
          fontWeight: 700,
        },
        filled: {
          backgroundColor: brandColors.yellowLight,
          color: brandColors.darkOak,
          boxShadow: `4px 4px 0 ${keywordShadows.yellow}`,
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'lg',
      },
      styleOverrides: {
        root: {
          width: '100%',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: 'inherit',
          fontFamily: emphasisFontStack,
          fontWeight: 700,
          textDecorationColor: 'currentColor',
          textUnderlineOffset: 3,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export const appBrandGuidelines = {
  useAccentColorAsMainKeyVisualBackgroundOnly: true,
  useDarkShadeBackgroundsWhenPagesContainText: true,
  keywordTextColor: brandColors.darkOak,
  keywordFillColors: Object.values({
    yellow: brandColors.yellowLight,
    purple: brandColors.purpleLight,
    turquoise: brandColors.turquoiseLight,
    green: brandColors.greenLight,
    blue: brandColors.blueLight,
    orange: brandColors.orange,
  }),
  shapeForbiddenColors: [brandColors.red, brandColors.darkOak, brandColors.white],
  logoUsage: {
    onColorBackgrounds: 'light mark',
    onLightBackgrounds: 'dark mark when available',
  },
} as const;

export default theme;
