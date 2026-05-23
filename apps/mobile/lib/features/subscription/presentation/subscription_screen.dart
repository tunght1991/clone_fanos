import 'dart:async';

import 'package:flutter/material.dart';

import '../../auth/state/app_state.dart';
import '../domain/subscription_models.dart';

enum _SubscriptionUiPhase {
  loading,
  paywall,
  selectPlan,
  paymentProcessing,
  paymentSuccess,
  paymentFailed,
  verifying,
  pendingVerification,
  unlocked,
}

class SubscriptionScreen extends StatefulWidget {
  final AppState appState;

  const SubscriptionScreen({super.key, required this.appState});

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  _SubscriptionUiPhase _phase = _SubscriptionUiPhase.loading;
  List<SubscriptionPlan> _plans = const [];
  SubscriptionState? _subscription;
  SubscriptionPlan? _selectedPlan;
  SubscriptionCheckoutResult? _checkoutResult;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _phase = _SubscriptionUiPhase.loading;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        widget.appState.subscriptionRepository.getPlans(
          userId: widget.appState.currentUserId,
          accessToken: widget.appState.accessToken,
        ),
        widget.appState.subscriptionRepository.getMySubscription(
          userId: widget.appState.currentUserId,
          accessToken: widget.appState.accessToken,
        ),
      ]);

      final plans = results[0] as List<SubscriptionPlan>;
      final subscription = results[1] as SubscriptionState?;
      final activePlan = plans.isNotEmpty ? plans.first : null;

      if (!mounted) {
        return;
      }

      setState(() {
        _plans = plans;
        _subscription = subscription;
        _selectedPlan = plans.isNotEmpty
            ? plans.firstWhere(
                (plan) => subscription?.plan.id == plan.id,
                orElse: () => activePlan ?? plans.first,
              )
            : null;
        _phase = _resolvePhase(subscription);
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'subscription_viewed',
          payload: {
            'planCount': plans.length,
            'currentFlowState': subscription?.flowState,
            'hasEntitlement': subscription?.entitlement.canAccessPremium ?? false,
          },
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _phase = _SubscriptionUiPhase.paywall;
        _errorMessage = error.toString();
      });
    }
  }

  _SubscriptionUiPhase _resolvePhase(SubscriptionState? subscription) {
    final flowState = subscription?.flowState;

    if (subscription?.entitlement.canAccessPremium ?? false) {
      return _SubscriptionUiPhase.unlocked;
    }

    switch (flowState) {
      case 'PAYMENT_SUCCESS':
        return _SubscriptionUiPhase.paymentSuccess;
      case 'PAYMENT_PROCESSING':
        return _SubscriptionUiPhase.paymentProcessing;
      case 'PAYMENT_FAILED':
        return _SubscriptionUiPhase.paymentFailed;
      case 'VERIFYING_ENTITLEMENT':
        return _SubscriptionUiPhase.verifying;
      case 'PENDING_VERIFICATION':
        return _SubscriptionUiPhase.pendingVerification;
      case 'SELECT_PLAN':
        return _SubscriptionUiPhase.selectPlan;
      case 'PAYWALL':
      case null:
        break;
    }

    if (subscription?.billing.checkoutSessionId != null || subscription?.billing.status == 'INITIATED') {
      return _SubscriptionUiPhase.paymentProcessing;
    }

    return _SubscriptionUiPhase.paywall;
  }

  Future<void> _selectPlan(SubscriptionPlan plan) async {
    setState(() {
      _selectedPlan = plan;
      _phase = _SubscriptionUiPhase.selectPlan;
    });

    unawaited(
      widget.appState.trackAnalyticsEvent(
        'subscription_plan_selected',
        payload: {
          'planId': plan.id,
          'planName': plan.name,
          'planPrice': plan.price,
          'durationDays': plan.durationDays,
        },
      ),
    );
  }

  Future<void> _startPayment() async {
    final selectedPlan = _selectedPlan ?? (_plans.isNotEmpty ? _plans.first : null);
    if (selectedPlan == null) {
      return;
    }

    setState(() {
      _phase = _SubscriptionUiPhase.paymentProcessing;
      _errorMessage = null;
    });

    unawaited(
      widget.appState.trackAnalyticsEvent(
        'subscription_checkout_started',
        payload: {
          'planId': selectedPlan.id,
          'provider': 'WEB_GATEWAY',
          'trialRequested': false,
        },
      ),
    );

    try {
      final checkout = await widget.appState.subscriptionRepository.checkout(
        request: SubscriptionCheckoutRequest(
          planId: selectedPlan.id,
          provider: 'WEB_GATEWAY',
        ),
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _checkoutResult = checkout;
        _phase = _SubscriptionUiPhase.paymentSuccess;
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'subscription_checkout_success',
          payload: {
            'planId': selectedPlan.id,
            'checkoutSessionId': checkout.checkoutSessionId,
            'status': checkout.status,
          },
        ),
      );

      await _verifyEntitlement();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _phase = _SubscriptionUiPhase.paymentFailed;
        _errorMessage = error.toString();
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'subscription_checkout_failed',
          payload: {
            'planId': selectedPlan.id,
            'error': error.toString(),
          },
        ),
      );
    }
  }

  Future<void> _verifyEntitlement() async {
    setState(() {
      _phase = _SubscriptionUiPhase.verifying;
      _errorMessage = null;
    });

    unawaited(
      widget.appState.trackAnalyticsEvent(
        'subscription_verify_started',
        payload: {
          'checkoutSessionId': _checkoutResult?.checkoutSessionId,
          'provider': 'WEB_GATEWAY',
        },
      ),
    );

    try {
      final subscription = await widget.appState.subscriptionRepository.verifySubscription(
        userId: widget.appState.currentUserId,
        accessToken: widget.appState.accessToken,
        request: SubscriptionVerifyRequest(
          provider: 'WEB_GATEWAY',
          checkoutSessionId: _checkoutResult?.checkoutSessionId,
          receiptToken: _checkoutResult?.checkoutSessionId == null
              ? null
              : 'receipt-${_checkoutResult!.checkoutSessionId}',
          platform: 'web',
        ),
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _subscription = subscription;
        if (subscription?.entitlement.canAccessPremium ?? false) {
          _phase = _SubscriptionUiPhase.unlocked;
          unawaited(
            widget.appState.trackAnalyticsEvent(
              'subscription_verify_success',
              payload: {
                'checkoutSessionId': _checkoutResult?.checkoutSessionId,
                'entitlementStatus': subscription?.entitlement.status,
              },
            ),
          );
          unawaited(
            widget.appState.trackAnalyticsEvent(
              'subscription_unlocked',
              payload: {
                'checkoutSessionId': _checkoutResult?.checkoutSessionId,
                'entitlementStatus': subscription?.entitlement.status,
              },
            ),
          );
        } else {
          _phase = _SubscriptionUiPhase.pendingVerification;
          unawaited(
            widget.appState.trackAnalyticsEvent(
              'subscription_verify_pending',
              payload: {
                'checkoutSessionId': _checkoutResult?.checkoutSessionId,
                'entitlementStatus': subscription?.entitlement.status,
              },
            ),
          );
        }
      });
      await widget.appState.refreshSubscription();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _phase = _SubscriptionUiPhase.paymentFailed;
        _errorMessage = error.toString();
      });

      unawaited(
        widget.appState.trackAnalyticsEvent(
          'subscription_verify_failed',
          payload: {
            'checkoutSessionId': _checkoutResult?.checkoutSessionId,
            'error': error.toString(),
          },
        ),
      );
    }
  }

  Future<void> _manualRefresh() async {
    await _load();
  }

  String _phaseLabel() {
    switch (_phase) {
      case _SubscriptionUiPhase.loading:
        return 'Loading';
      case _SubscriptionUiPhase.paywall:
        return 'Paywall';
      case _SubscriptionUiPhase.selectPlan:
        return 'Select Plan';
      case _SubscriptionUiPhase.paymentProcessing:
        return 'Payment';
      case _SubscriptionUiPhase.paymentSuccess:
        return 'Success';
      case _SubscriptionUiPhase.paymentFailed:
        return 'Failed';
      case _SubscriptionUiPhase.verifying:
        return 'Verifying';
      case _SubscriptionUiPhase.pendingVerification:
        return 'Pending Verification';
      case _SubscriptionUiPhase.unlocked:
        return 'Unlocked';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.appState,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: Theme.of(context).colorScheme.background,
          appBar: AppBar(title: const Text('Subscription')),
          bottomNavigationBar: SafeArea(
            minimum: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: _buildActionBar(context),
          ),
          body: Column(
            children: [
              if (widget.appState.subscriptionRefreshError != null)
                _SubscriptionRefreshBanner(
                  message: 'Subscription info needs a refresh.',
                  onDismiss: widget.appState.clearSubscriptionRefreshError,
                  onRetry: () async {
                    try {
                      await widget.appState.refreshSubscription();
                    } catch (_) {
                      // The banner remains visible because the state still carries the error.
                    }
                  },
                ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _manualRefresh,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                    children: [
                      Center(
                        child: ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 760),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildStatusCard(context),
                              const SizedBox(height: 16),
                              _buildPlanCatalog(context),
                              const SizedBox(height: 16),
                              _buildPaymentCard(context),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final canAccessPremium = _subscription?.entitlement.canAccessPremium ?? false;
    final title = canAccessPremium ? 'Premium access enabled' : 'Premium access locked';
    final subtitle = _subscription?.plan.name ?? 'Choose a plan to continue';
    final theme = Theme.of(context);

      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final stacked = constraints.maxWidth < 360;
                  final phaseChip = Chip(
                    label: Text(_phaseLabel()),
                    backgroundColor: theme.colorScheme.surfaceContainerHighest.withOpacity(0.55),
                  );

                  if (stacked) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title, style: theme.textTheme.titleLarge),
                        const SizedBox(height: 8),
                        phaseChip,
                      ],
                    );
                  }

                  return Row(
                    children: [
                      Expanded(
                        child: Text(title, style: theme.textTheme.titleLarge),
                      ),
                      phaseChip,
                    ],
                  );
                },
              ),
            const SizedBox(height: 8),
            Text(subtitle, style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text('Status: ${_subscription?.status ?? 'NONE'}', style: theme.textTheme.bodySmall),
            const SizedBox(height: 4),
            Text('Provider: ${_subscription?.billing.provider ?? 'N/A'}', style: theme.textTheme.bodySmall),
            if (_subscription?.entitlement.expiresAt != null) ...[
              const SizedBox(height: 4),
              Text('Expires: ${_subscription!.entitlement.expiresAt}', style: theme.textTheme.bodySmall),
            ],
            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                style: TextStyle(color: theme.colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCatalog(BuildContext context) {
    final theme = Theme.of(context);
    if (_phase == _SubscriptionUiPhase.loading) {
      return const Center(child: Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: CircularProgressIndicator(),
      ));
    }

    if (_plans.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('No plans available', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              Text('Please refresh to load subscription plans.', style: theme.textTheme.bodyMedium),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Select Plan', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            ..._plans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  key: ValueKey('plan-${plan.id}'),
                  onTap: () => _selectPlan(plan),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _selectedPlan?.id == plan.id
                            ? theme.colorScheme.primary
                            : theme.colorScheme.outlineVariant,
                      ),
                      color: _selectedPlan?.id == plan.id
                          ? theme.colorScheme.primaryContainer.withOpacity(0.35)
                          : theme.colorScheme.surface,
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(plan.name, style: theme.textTheme.titleMedium),
                            ),
                            if (_selectedPlan?.id == plan.id)
                              Icon(Icons.check_circle, color: theme.colorScheme.primary),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('${plan.price} VND / ${plan.durationDays} days', style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 4),
                        Text('Status: ${plan.status}', style: theme.textTheme.bodySmall),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentCard(BuildContext context) {
    final selectedPlan = _selectedPlan ?? (_plans.isNotEmpty ? _plans.first : null);
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment', style: theme.textTheme.titleLarge),
            const SizedBox(height: 12),
            Text(selectedPlan == null ? 'Select a plan first' : 'Selected: ${selectedPlan.name}', style: theme.textTheme.bodyMedium),
            const SizedBox(height: 4),
            Text('Subscription flow: ${_phaseLabel()}', style: theme.textTheme.bodySmall),
            if (_checkoutResult != null) ...[
              const SizedBox(height: 8),
              Text('Checkout session: ${_checkoutResult!.checkoutSessionId}', style: theme.textTheme.bodySmall),
              Text('Checkout status: ${_checkoutResult!.status}', style: theme.textTheme.bodySmall),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionBar(BuildContext context) {
    final selectedPlan = _selectedPlan ?? (_plans.isNotEmpty ? _plans.first : null);
    final canPay = !_isTerminalUnlocked() && selectedPlan != null;
    final paymentButtonLabel = _isTerminalUnlocked()
        ? 'Unlocked'
        : _phase == _SubscriptionUiPhase.paymentFailed
            ? 'Retry payment'
            : 'Continue to payment';

    return LayoutBuilder(
      builder: (context, constraints) {
        final stacked = constraints.maxWidth < 420;

        final verifyButton = SizedBox(
          width: stacked ? double.infinity : null,
          child: FilledButton.tonal(
            onPressed: _checkoutResult == null ? _manualRefresh : _verifyEntitlement,
            child: const Text('Verify receipt'),
          ),
        );

        final paymentButton = SizedBox(
          width: stacked ? double.infinity : null,
          child: FilledButton(
            key: const ValueKey('subscription-payment-button'),
            onPressed: canPay && _phase != _SubscriptionUiPhase.paymentProcessing ? _startPayment : null,
            child: _phase == _SubscriptionUiPhase.paymentProcessing || _phase == _SubscriptionUiPhase.verifying
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(paymentButtonLabel),
          ),
        );

        if (stacked) {
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              verifyButton,
              const SizedBox(height: 12),
              paymentButton,
            ],
          );
        }

        return Row(
          children: [
            Expanded(child: verifyButton),
            const SizedBox(width: 12),
            Expanded(child: paymentButton),
          ],
        );
      },
    );
  }

  bool _isTerminalUnlocked() {
    return _phase == _SubscriptionUiPhase.unlocked || (_subscription?.entitlement.canAccessPremium ?? false);
  }
}

class _SubscriptionRefreshBanner extends StatelessWidget {
  final String message;
  final VoidCallback onDismiss;
  final Future<void> Function() onRetry;

  const _SubscriptionRefreshBanner({
    required this.message,
    required this.onDismiss,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).colorScheme.secondaryContainer.withOpacity(0.55),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Row(
            children: [
              const Icon(Icons.sync_problem_outlined),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
              TextButton(
                onPressed: onDismiss,
                child: const Text('Dismiss'),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () => onRetry(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
