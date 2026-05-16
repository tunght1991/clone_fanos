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

      await _verifyEntitlement();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _phase = _SubscriptionUiPhase.paymentFailed;
        _errorMessage = error.toString();
      });
    }
  }

  Future<void> _verifyEntitlement() async {
    setState(() {
      _phase = _SubscriptionUiPhase.verifying;
      _errorMessage = null;
    });

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
        } else {
          _phase = _SubscriptionUiPhase.pendingVerification;
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
    return Scaffold(
      appBar: AppBar(title: const Text('Subscription')),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: _buildActionBar(context),
      ),
      body: RefreshIndicator(
        onRefresh: _manualRefresh,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _buildStatusCard(context),
            const SizedBox(height: 16),
            _buildPlanCatalog(context),
            const SizedBox(height: 16),
            _buildPaymentCard(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final canAccessPremium = _subscription?.entitlement.canAccessPremium ?? false;
    final title = canAccessPremium ? 'Premium access enabled' : 'Premium access locked';
    final subtitle = _subscription?.plan.name ?? 'Choose a plan to continue';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(title, style: Theme.of(context).textTheme.titleLarge),
                ),
                Chip(label: Text(_phaseLabel())),
              ],
            ),
            const SizedBox(height: 8),
            Text(subtitle),
            const SizedBox(height: 4),
            Text('Status: ${_subscription?.status ?? 'NONE'}'),
            const SizedBox(height: 4),
            Text('Provider: ${_subscription?.billing.provider ?? 'N/A'}'),
            if (_subscription?.entitlement.expiresAt != null) ...[
              const SizedBox(height: 4),
              Text('Expires: ${_subscription!.entitlement.expiresAt}'),
            ],
            if (_errorMessage != null) ...[
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCatalog(BuildContext context) {
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
              Text('No plans available', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              const Text('Please refresh to load subscription plans.'),
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
            Text('Select Plan', style: Theme.of(context).textTheme.titleLarge),
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
                            ? Theme.of(context).colorScheme.primary
                            : Theme.of(context).dividerColor,
                      ),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(plan.name, style: Theme.of(context).textTheme.titleMedium),
                            ),
                            if (_selectedPlan?.id == plan.id) const Icon(Icons.check_circle),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text('${plan.price} VND / ${plan.durationDays} days'),
                        const SizedBox(height: 4),
                        Text('Status: ${plan.status}'),
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            Text(selectedPlan == null ? 'Select a plan first' : 'Selected: ${selectedPlan.name}'),
            const SizedBox(height: 4),
            Text('Subscription flow: ${_phaseLabel()}'),
            if (_checkoutResult != null) ...[
              const SizedBox(height: 8),
              Text('Checkout session: ${_checkoutResult!.checkoutSessionId}'),
              Text('Checkout status: ${_checkoutResult!.status}'),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionBar(BuildContext context) {
    final selectedPlan = _selectedPlan ?? (_plans.isNotEmpty ? _plans.first : null);
    final canPay = !_isTerminalUnlocked() && selectedPlan != null;

    return Row(
      children: [
        Expanded(
          child: FilledButton.tonal(
            onPressed: _checkoutResult == null ? _manualRefresh : _verifyEntitlement,
            child: const Text('Verify receipt'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FilledButton(
            key: const ValueKey('subscription-payment-button'),
            onPressed: canPay && _phase != _SubscriptionUiPhase.paymentProcessing ? _startPayment : null,
            child: _phase == _SubscriptionUiPhase.paymentProcessing || _phase == _SubscriptionUiPhase.verifying
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(_isTerminalUnlocked() ? 'Unlocked' : 'Continue to payment'),
          ),
        ),
      ],
    );
  }

  bool _isTerminalUnlocked() {
    return _phase == _SubscriptionUiPhase.unlocked || (_subscription?.entitlement.canAccessPremium ?? false);
  }
}
