export const COLORS = {
  primary: '#4f46e5', // Helsinki Indigo
  primaryLight: '#6366f1', // Indigo 500
  secondary: '#a855f7', // Vivid Violet
  success: '#10b981', // Emerald Green
  warning: '#f59e0b', // Amber Gold
  danger: '#ef4444', // Coral Red
  background: '#f8fafc', // Light slate off-white
  cardBg: '#ffffff', // Pure White
  text: '#0f172a', // Dark charcoal/slate-900
  textMuted: '#64748b', // Slate Gray 500
  border: '#e2e8f0', // Light Border Slate 200
  streak: '#ff6b00', // Neon Orange for Streak Flame
};

export const SHADOWS = {
  default: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

export const GRADIENTS = {
  primary: ['#4f46e5', '#7c3aed'],
  secondary: ['#a855f7', '#ec4899'],
  success: ['#10b981', '#059669'],
  darkCard: ['#ffffff', '#f1f5f9'],
};

export const STYLES = {
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.default,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: COLORS.text,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    fontFamily: 'System',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 10,
    ...SHADOWS.glow,
  },
  buttonText: {
    color: '#ffffff', // Always white on primary button
    fontWeight: 'bold' as const,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 6,
  },
};
