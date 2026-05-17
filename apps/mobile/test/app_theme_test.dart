import 'package:clone_fanos_mobile/app/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Clone Fanos theme maps the DESIGN.md token surface', () {
    final theme = buildCloneFanosTheme();

    expect(theme.colorScheme.primary, CloneFanosTokens.primary);
    expect(theme.colorScheme.secondary, CloneFanosTokens.secondary);
    expect(theme.colorScheme.surface, CloneFanosTokens.surface);
    expect(theme.scaffoldBackgroundColor, CloneFanosTokens.background);
    expect(theme.textTheme.headlineMedium?.fontFamily, 'Montserrat');
    expect(theme.textTheme.bodyMedium?.fontFamily, 'Inter');

    final cardShape = theme.cardTheme.shape;
    expect(cardShape, isA<RoundedRectangleBorder>());
    expect((cardShape as RoundedRectangleBorder).borderRadius, BorderRadius.circular(16));
  });
}
