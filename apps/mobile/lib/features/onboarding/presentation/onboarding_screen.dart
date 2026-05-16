import 'package:flutter/material.dart';

import '../../auth/state/app_state.dart';

class OnboardingScreen extends StatefulWidget {
  final AppState appState;

  const OnboardingScreen({super.key, required this.appState});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pages = <_OnboardingItem>[
      const _OnboardingItem(
        icon: Icons.headphones,
        title: 'Listen with focus',
        description: 'A calm interface designed for knowledge workers who want to continue learning on the move.',
      ),
      const _OnboardingItem(
        icon: Icons.bookmark_border,
        title: 'Save what matters',
        description: 'Bookmark important moments and come back to them later without losing context.',
      ),
      const _OnboardingItem(
        icon: Icons.timer_outlined,
        title: 'Resume instantly',
        description: 'Pick up exactly where you left off and keep your learning habit moving forward.',
      ),
    ];

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: widget.appState.completeOnboarding,
                  child: const Text('Skip'),
                ),
              ),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: pages.length,
                  onPageChanged: (index) {
                    setState(() {
                      _currentIndex = index;
                    });
                  },
                  itemBuilder: (context, index) => _OnboardingPage(item: pages[index]),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  pages.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentIndex == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentIndex == index
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.outlineVariant,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: () async {
                  if (_currentIndex < pages.length - 1) {
                    await _pageController.nextPage(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOut,
                    );
                    return;
                  }

                  await widget.appState.completeOnboarding();
                },
                child: Text(_currentIndex < pages.length - 1 ? 'Next' : 'Get started'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingItem {
  final IconData icon;
  final String title;
  final String description;

  const _OnboardingItem({
    required this.icon,
    required this.title,
    required this.description,
  });
}

class _OnboardingPage extends StatelessWidget {
  final _OnboardingItem item;

  const _OnboardingPage({required this.item});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        CircleAvatar(
          radius: 48,
          backgroundColor: Theme.of(context).colorScheme.primaryContainer,
          child: Icon(item.icon, size: 48),
        ),
        const SizedBox(height: 24),
        Text(
          item.title,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Text(
          item.description,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      ],
    );
  }
}

