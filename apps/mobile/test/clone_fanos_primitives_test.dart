import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/app_theme.dart';
import 'package:clone_fanos_mobile/shared/ui/clone_fanos_primitives.dart';

void main() {
  testWidgets('CloneFanos primitives render shared empty, status and cover states', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: buildCloneFanosTheme(),
        home: Scaffold(
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CloneFanosSectionHeader(
                  eyebrow: 'Library',
                  title: 'Shared primitives',
                  subtitle: 'Reusable surface, badge and state widgets',
                ),
                const SizedBox(height: 16),
                const CloneFanosEmptyStateCard(
                  icon: Icons.bookmarks_outlined,
                  title: 'Empty state',
                  description: 'A reusable empty-card shell',
                ),
                const SizedBox(height: 16),
                CloneFanosStateCard(
                  icon: Icons.error_outline,
                  title: 'Error state',
                  description: 'A reusable status card shell',
                  actionLabel: 'Retry',
                  onAction: _noop,
                  errorStyle: true,
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: const [
                    CloneFanosMetaChip(icon: Icons.schedule_outlined, label: '12:34'),
                    CloneFanosStatusChip(label: 'streamable'),
                    CloneFanosPremiumBadge(),
                  ],
                ),
                const SizedBox(height: 16),
                CloneFanosCoverBadge(title: 'Clone Fanos', premiumFlag: true),
              ],
            ),
          ),
        ),
      ),
    );

    expect(find.text('LIBRARY'), findsOneWidget);
    expect(find.text('Empty state'), findsOneWidget);
    expect(find.text('Error state'), findsOneWidget);
    expect(find.byType(CloneFanosStatusChip), findsOneWidget);
    expect(find.byType(CloneFanosPremiumBadge), findsOneWidget);
    expect(find.text('CF'), findsOneWidget);
  });
}

void _noop() {}
