import 'package:flutter/material.dart';

class CloneFanosTokens {
  static const Color primary = Color(0xFF2E3192);
  static const Color secondary = Color(0xFFF7931E);
  static const Color tertiary = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF7F8FC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color outline = Color(0xFFD7DDEA);
  static const Color muted = Color(0xFF667085);
  static const Color text = Color(0xFF101828);
}

ThemeData buildCloneFanosTheme() {
  final colorScheme = ColorScheme.light(
    primary: CloneFanosTokens.primary,
    onPrimary: Colors.white,
    primaryContainer: const Color(0xFFDDE0FF),
    onPrimaryContainer: CloneFanosTokens.primary,
    secondary: CloneFanosTokens.secondary,
    onSecondary: Colors.white,
    secondaryContainer: const Color(0xFFFFE4C2),
    onSecondaryContainer: const Color(0xFF7A3F00),
    tertiary: CloneFanosTokens.tertiary,
    onTertiary: CloneFanosTokens.primary,
    tertiaryContainer: const Color(0xFFF2F4F7),
    onTertiaryContainer: CloneFanosTokens.text,
    error: const Color(0xFFB42318),
    onError: Colors.white,
    surface: CloneFanosTokens.surface,
    onSurface: CloneFanosTokens.text,
    background: CloneFanosTokens.background,
    onBackground: CloneFanosTokens.text,
    surfaceTint: CloneFanosTokens.primary,
    outline: CloneFanosTokens.outline,
    outlineVariant: CloneFanosTokens.outline,
  ).copyWith(
    outline: CloneFanosTokens.outline,
    outlineVariant: CloneFanosTokens.outline,
    onSurface: CloneFanosTokens.text,
    onSurfaceVariant: CloneFanosTokens.muted,
  );

  final baseTextTheme = ThemeData.light().textTheme.apply(
        fontFamily: 'Inter',
        bodyColor: CloneFanosTokens.text,
        displayColor: CloneFanosTokens.text,
      );

  final headlineTheme = baseTextTheme.copyWith(
    displayLarge: baseTextTheme.displayLarge?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w700,
      letterSpacing: -0.02,
      height: 1.2,
    ),
    displayMedium: baseTextTheme.displayMedium?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w700,
      letterSpacing: -0.01,
      height: 1.2,
    ),
    displaySmall: baseTextTheme.displaySmall?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w600,
      height: 1.25,
    ),
    headlineMedium: baseTextTheme.headlineMedium?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w600,
      height: 1.3,
    ),
    headlineSmall: baseTextTheme.headlineSmall?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w600,
      height: 1.35,
    ),
    titleLarge: baseTextTheme.titleLarge?.copyWith(
      fontFamily: 'Montserrat',
      fontWeight: FontWeight.w600,
      height: 1.35,
    ),
    titleMedium: baseTextTheme.titleMedium?.copyWith(
      fontFamily: 'Inter',
      fontWeight: FontWeight.w600,
      height: 1.3,
    ),
    bodyLarge: baseTextTheme.bodyLarge?.copyWith(
      fontFamily: 'Inter',
      fontWeight: FontWeight.w400,
      height: 1.6,
    ),
    bodyMedium: baseTextTheme.bodyMedium?.copyWith(
      fontFamily: 'Inter',
      fontWeight: FontWeight.w400,
      height: 1.6,
    ),
    labelLarge: baseTextTheme.labelLarge?.copyWith(
      fontFamily: 'Inter',
      fontWeight: FontWeight.w600,
      height: 1.2,
      letterSpacing: 0.01,
    ),
    labelSmall: baseTextTheme.labelSmall?.copyWith(
      fontFamily: 'Inter',
      fontWeight: FontWeight.w600,
      height: 1.2,
    ),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CloneFanosTokens.background,
    fontFamily: 'Inter',
    textTheme: headlineTheme,
    splashFactory: InkSparkle.splashFactory,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    visualDensity: VisualDensity.standard,
    focusColor: colorScheme.primary.withOpacity(0.12),
    highlightColor: colorScheme.primary.withOpacity(0.08),
    hoverColor: colorScheme.primary.withOpacity(0.06),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: CloneFanosTokens.text,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: headlineTheme.titleLarge?.copyWith(
        color: CloneFanosTokens.text,
        fontWeight: FontWeight.w600,
      ),
    ),
    cardTheme: CardThemeData(
      color: CloneFanosTokens.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: colorScheme.outlineVariant),
      ),
    ),
    dividerTheme: DividerThemeData(
      color: colorScheme.outlineVariant,
      thickness: 1,
      space: 1,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: colorScheme.surfaceContainerHighest.withOpacity(0.45),
      selectedColor: colorScheme.primaryContainer,
      labelStyle: headlineTheme.labelMedium?.copyWith(color: colorScheme.onSurface),
      secondarySelectedColor: colorScheme.secondaryContainer,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      side: BorderSide(color: colorScheme.outlineVariant),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      showCheckmark: false,
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: CloneFanosTokens.surface,
      indicatorColor: colorScheme.primaryContainer,
      labelTextStyle: MaterialStateProperty.resolveWith(
        (states) => headlineTheme.labelSmall?.copyWith(
          color: states.contains(MaterialState.selected)
              ? colorScheme.primary
              : colorScheme.onSurfaceVariant,
        ),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        shape: MaterialStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        side: MaterialStatePropertyAll(BorderSide(color: colorScheme.outlineVariant)),
        padding: const MaterialStatePropertyAll(EdgeInsets.symmetric(horizontal: 12, vertical: 14)),
        overlayColor: MaterialStateProperty.resolveWith(
          (states) => states.contains(MaterialState.selected)
              ? colorScheme.primary.withOpacity(0.12)
              : colorScheme.primary.withOpacity(0.06),
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: colorScheme.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: colorScheme.error, width: 1.5),
      ),
      labelStyle: headlineTheme.labelMedium?.copyWith(color: colorScheme.onSurfaceVariant),
      hintStyle: headlineTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: headlineTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: headlineTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        side: BorderSide(color: colorScheme.outlineVariant),
        textStyle: headlineTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
      ),
    ),
  );
}
