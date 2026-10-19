export const Theme = {
  colors: {
    // Pure White & Light Canvas Backgrounds
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceCard: '#FFFFFF',
    surfaceSubtle: '#F1F4F9',
    surfaceBorder: '#E5E9F0',
    surfaceHighlight: '#EBF1F8',

    // Accents & Buttons
    primary: '#111827', // Crisp Obsidian / Black for active pills (as in luxury EV UI)
    primaryHover: '#1F2937',
    primaryMuted: '#E5E7EB',

    electricBlue: '#0284C7',
    electricBlueMuted: 'rgba(2, 132, 199, 0.08)',

    success: '#10B981',
    successMuted: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.25)',

    warning: '#F59E0B',
    warningMuted: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.25)',

    danger: '#EF4444',
    dangerMuted: 'rgba(239, 68, 68, 0.1)',
    dangerBorder: 'rgba(239, 68, 68, 0.25)',

    purple: '#8B5CF6',
    purpleMuted: 'rgba(139, 92, 246, 0.1)',

    // Typography
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textHighlight: '#0F172A',
    textInverse: '#FFFFFF',

    // Terminal / Log elements
    terminalBg: '#F8FAFC',
    terminalBorder: '#E2E8F0',
    txColor: '#0284C7',
    rxColor: '#10B981',
    systemColor: '#8B5CF6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    card: 24,
    full: 9999,
  },
  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
    floating: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 6,
    },
    subtle: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
  },
  typography: {
    fontMono: 'SpaceMono',
  },
};

export default Theme;
