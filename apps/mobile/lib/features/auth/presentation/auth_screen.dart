import 'dart:async';

import 'package:flutter/material.dart';

import '../state/app_state.dart';
import '../../../app/app_theme.dart';

class AuthScreen extends StatefulWidget {
  final AppState appState;

  const AuthScreen({super.key, required this.appState});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();
  final _loginEmailController = TextEditingController(text: 'admin@fonos.test');
  final _loginPasswordController = TextEditingController(text: 'Secret123!');
  final _registerNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    unawaited(
      widget.appState.trackAnalyticsEvent(
        'auth_viewed',
        payload: {'initialTab': 'login'},
      ),
    );
  }

  @override
  void dispose() {
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerNameController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: AnimatedBuilder(
          animation: widget.appState,
          builder: (context, _) {
            return Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Stack(
                  children: [
                    ListView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                      children: [
                        const _AuthHeroCard(
                          title: 'Welcome back',
                          subtitle:
                              'Continue your learning habit with a polished audiobook experience built around focus and premium access.',
                          accentText: 'Paywall • Verify • Unlock',
                        ),
                        const SizedBox(height: 20),
                        SegmentedButton<int>(
                          segments: const [
                            ButtonSegment(value: 0, label: Text('Login')),
                            ButtonSegment(value: 1, label: Text('Register')),
                          ],
                          selected: <int>{_tabIndex},
                          onSelectionChanged: (selection) {
                            setState(() {
                              _tabIndex = selection.first;
                            });
                            widget.appState.clearError();
                          },
                        ),
                        const SizedBox(height: 20),
                        if (_tabIndex == 0)
                          _LoginForm(
                            formKey: _loginFormKey,
                            emailController: _loginEmailController,
                            passwordController: _loginPasswordController,
                            isBusy: widget.appState.isBusy,
                            errorMessage: widget.appState.errorMessage,
                            onSubmit: _submitLogin,
                            onClearError: widget.appState.clearError,
                          )
                        else
                          _RegisterForm(
                            formKey: _registerFormKey,
                            nameController: _registerNameController,
                            emailController: _registerEmailController,
                            passwordController: _registerPasswordController,
                            isBusy: widget.appState.isBusy,
                            errorMessage: widget.appState.errorMessage,
                            onSubmit: _submitRegister,
                            onClearError: widget.appState.clearError,
                          ),
                      ],
                    ),
                    if (widget.appState.isBusy)
                      const Positioned.fill(
                        child: IgnorePointer(
                          child: ColoredBox(
                            color: Color(0x33FFFFFF),
                            child: Center(child: CircularProgressIndicator()),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _submitLogin() async {
    if (!_loginFormKey.currentState!.validate()) {
      return;
    }

    await _submitAuth(
      submittedEventName: 'auth_login_submitted',
      successEventName: 'auth_login_success',
      failureEventName: 'auth_login_failed',
      payload: {'method': 'email'},
      action: () => widget.appState.login(
        email: _loginEmailController.text,
        password: _loginPasswordController.text,
      ),
    );
  }

  Future<void> _submitRegister() async {
    if (!_registerFormKey.currentState!.validate()) {
      return;
    }

    await _submitAuth(
      submittedEventName: 'auth_register_submitted',
      successEventName: 'auth_register_success',
      failureEventName: 'auth_register_failed',
      payload: {'method': 'email'},
      action: () => widget.appState.register(
        displayName: _registerNameController.text,
        email: _registerEmailController.text,
        password: _registerPasswordController.text,
      ),
    );
  }

  Future<void> _submitAuth({
    required String submittedEventName,
    required String successEventName,
    required String failureEventName,
    required Map<String, Object?> payload,
    required Future<void> Function() action,
  }) async {
    unawaited(
      widget.appState.trackAnalyticsEvent(
        submittedEventName,
        payload: payload,
      ),
    );

    await action();

    if (widget.appState.phase == AppPhase.authenticated) {
      unawaited(
        widget.appState.trackAnalyticsEvent(
          successEventName,
          payload: payload,
        ),
      );
      return;
    }

    unawaited(
      widget.appState.trackAnalyticsEvent(
        failureEventName,
        payload: {
          ...payload,
          'error': widget.appState.errorMessage,
        },
      ),
    );
  }
}

class _AuthHeroCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String accentText;

  const _AuthHeroCard({
    required this.title,
    required this.subtitle,
    required this.accentText,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              CloneFanosTokens.primary.withValues(alpha: 0.08),
              CloneFanosTokens.secondary.withValues(alpha: 0.10),
              theme.colorScheme.surface,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: CloneFanosTokens.primary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  alignment: Alignment.center,
                  child: const Text(
                    'CF',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.04,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Clone Fanos',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: CloneFanosTokens.primary,
                          letterSpacing: 0.08,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        accentText,
                        style: theme.textTheme.labelMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(title, style: theme.textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(subtitle, style: theme.textTheme.bodyMedium),
          ],
        ),
      ),
    );
  }
}

class _LoginForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool isBusy;
  final String? errorMessage;
  final VoidCallback onClearError;
  final Future<void> Function() onSubmit;

  const _LoginForm({
    required this.formKey,
    required this.emailController,
    required this.passwordController,
    required this.isBusy,
    required this.errorMessage,
    required this.onClearError,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return _AuthFormSection(
      formKey: formKey,
      isBusy: isBusy,
      errorMessage: errorMessage,
      onClearError: onClearError,
      onSubmit: onSubmit,
      submitLabel: 'Login',
      children: [
        TextFormField(
          controller: emailController,
          decoration: const InputDecoration(labelText: 'Email'),
          validator: _validateEmail,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: passwordController,
          decoration: const InputDecoration(labelText: 'Password'),
          obscureText: true,
          validator: _validatePassword,
        ),
      ],
    );
  }
}

class _RegisterForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameController;
  final TextEditingController emailController;
  final TextEditingController passwordController;
  final bool isBusy;
  final String? errorMessage;
  final VoidCallback onClearError;
  final Future<void> Function() onSubmit;

  const _RegisterForm({
    required this.formKey,
    required this.nameController,
    required this.emailController,
    required this.passwordController,
    required this.isBusy,
    required this.errorMessage,
    required this.onClearError,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return _AuthFormSection(
      formKey: formKey,
      isBusy: isBusy,
      errorMessage: errorMessage,
      onClearError: onClearError,
      onSubmit: onSubmit,
      submitLabel: 'Create account',
      children: [
        TextFormField(
          controller: nameController,
          decoration: const InputDecoration(labelText: 'Display name'),
          validator: _validateDisplayName,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: emailController,
          decoration: const InputDecoration(labelText: 'Email'),
          validator: _validateEmail,
        ),
        const SizedBox(height: 12),
        TextFormField(
          controller: passwordController,
          decoration: const InputDecoration(labelText: 'Password'),
          obscureText: true,
          validator: _validatePassword,
        ),
      ],
    );
  }
}

class _AuthFormSection extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final bool isBusy;
  final String? errorMessage;
  final VoidCallback onClearError;
  final Future<void> Function() onSubmit;
  final String submitLabel;
  final List<Widget> children;

  const _AuthFormSection({
    required this.formKey,
    required this.isBusy,
    required this.errorMessage,
    required this.onClearError,
    required this.onSubmit,
    required this.submitLabel,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMessage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _ErrorBanner(
                message: errorMessage!,
                onDismissed: onClearError,
              ),
            ),
          ...children,
          const SizedBox(height: 20),
          FilledButton(
            onPressed: isBusy
                ? null
                : () async {
                    await onSubmit();
                  },
            child: Text(submitLabel),
          ),
        ],
      ),
    );
  }
}

String? _validateEmail(String? value) {
  return value == null || !value.contains('@') ? 'Enter a valid email' : null;
}

String? _validatePassword(String? value) {
  return value == null || value.length < 8 ? 'Password must be at least 8 chars' : null;
}

String? _validateDisplayName(String? value) {
  return value == null || value.trim().isEmpty ? 'Display name is required' : null;
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismissed;

  const _ErrorBanner({
    required this.message,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.errorContainer,
      borderRadius: BorderRadius.circular(12),
      child: ListTile(
        title: Text(message),
        trailing: IconButton(
          onPressed: onDismissed,
          icon: const Icon(Icons.close),
        ),
      ),
    );
  }
}
