import 'package:flutter_test/flutter_test.dart';

import 'package:clone_fanos_mobile/app/clone_fanos_app.dart';

void main() {
  testWidgets('CloneFanosApp boots into onboarding by default', (tester) async {
    await tester.pumpWidget(const CloneFanosApp());
    await tester.pumpAndSettle();

    expect(find.text('Listen with focus'), findsOneWidget);
    expect(find.text('Skip'), findsOneWidget);
  });
}
