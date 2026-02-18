export const colors = {
  primary: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1565C0',
    800: '#0D47A1',
    900: '#0D47A1',
  },
  error: { light: '#EF5350', main: '#D32F2F', dark: '#C62828' },
  warning: { light: '#FFB74D', main: '#F57C00', dark: '#E65100' },
  success: { light: '#81C784', main: '#388E3C', dark: '#1B5E20' },
  info: { light: '#64B5F6', main: '#1976D2', dark: '#0D47A1' },
  grey: {
    50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0',
    400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161',
    800: '#424242', 900: '#212121',
  },
  white: '#FFFFFF',
  black: '#000000',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: { primary: '#212121', secondary: '#757575', disabled: '#BDBDBD', inverse: '#FFFFFF' },
  border: '#E0E0E0',
  divider: '#EEEEEE',
  // Status-specific colors
  status: {
    submitted: '#2196F3',
    under_review: '#FF9800',
    processing: '#FF9800',
    in_progress: '#9C27B0',
    for_approval: '#673AB7',
    approved: '#4CAF50',
    for_release: '#00BCD4',
    released: '#388E3C',
    resolved: '#388E3C',
    rejected: '#D32F2F',
  },
  priority: {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336',
    urgent: '#D32F2F',
  },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const borderRadius = {
  sm: 4, md: 8, lg: 12, xl: 16, full: 9999,
} as const;

export const fontSize = {
  xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
} as const;
