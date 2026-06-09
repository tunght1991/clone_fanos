import type { DatabaseConnection, DatabaseExecutor } from '../../db/postgres.js';
import type { SubscriptionBillingProvider } from './subscription.types.js';
import type {
  BillingStatus,
  SubscriptionDetailDto,
  SubscriptionPlanStatus,
  SubscriptionStatus,
  SubscriptionWebhookEventType,
} from './subscription.dto.js';

export interface SubscriptionPlanRow {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  status: SubscriptionPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionRow {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startAt: Date;
  endAt: Date;
  provider: string | null;
  providerSubscriptionId: string | null;
  billingProvider: SubscriptionBillingProvider;
  billingStatus: BillingStatus;
  billingReference: string | null;
  checkoutSessionId: string | null;
  lastBillingAt: Date | null;
  nextBillingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionDetailRow {
  id: string;
  status: SubscriptionStatus;
  planId: string;
  planName: string;
  planPrice: string;
  planDurationDays: number;
  planStatus: SubscriptionPlanStatus;
  billingProvider: SubscriptionBillingProvider;
  billingStatus: BillingStatus;
  billingReference: string | null;
  checkoutSessionId: string | null;
  lastBillingAt: Date | null;
  nextBillingAt: Date | null;
  canAccessPremium: boolean;
  expiresAt: Date | null;
  startAt: Date;
  endAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWebhookEventRow {
  id: string;
  provider: SubscriptionBillingProvider;
  eventType: SubscriptionWebhookEventType;
  billingReference: string;
  idempotencyKey: string;
  subscriptionId: string | null;
  checkoutSessionId: string | null;
  payloadJson: Record<string, unknown>;
  occurredAt: Date;
  processedAt: Date | null;
  createdAt: Date;
}

export interface SubscriptionRepository {
  findById(id: string): Promise<SubscriptionRow | null>;
  findPlanById(id: string): Promise<SubscriptionPlanRow | null>;
  findActiveByUserId(userId: string): Promise<SubscriptionRow | null>;
  findLatestByUserId(userId: string): Promise<SubscriptionRow | null>;
  findActiveDetailByUserId(userId: string): Promise<SubscriptionDetailRow | null>;
  findLatestDetailByUserId(userId: string): Promise<SubscriptionDetailRow | null>;
  findByCheckoutSessionId(checkoutSessionId: string): Promise<SubscriptionRow | null>;
  findByBillingReference(billingReference: string): Promise<SubscriptionRow | null>;
  createPendingSubscription(input: {
    userId: string;
    planId: string;
    billingProvider: SubscriptionBillingProvider;
    checkoutSessionId: string;
    startAt: Date;
    endAt: Date;
    provider?: string;
  }): Promise<SubscriptionRow>;
  updateAfterWebhook(input: {
    subscriptionId: string;
    billingProvider: SubscriptionBillingProvider;
    billingStatus: BillingStatus;
    billingReference: string;
    providerSubscriptionId?: string;
    checkoutSessionId?: string;
    lastBillingAt?: Date;
    nextBillingAt?: Date;
    status: SubscriptionStatus;
  }): Promise<SubscriptionRow>;
  recordWebhookEvent(input: {
    provider: SubscriptionBillingProvider;
    eventType: SubscriptionWebhookEventType;
    billingReference: string;
    idempotencyKey: string;
    subscriptionId?: string;
    checkoutSessionId?: string;
    payloadJson: Record<string, unknown>;
    occurredAt: Date;
  }): Promise<boolean>;
  markWebhookProcessed(idempotencyKey: string): Promise<void>;
  recordReceiptVerification(input: {
    userId: string;
    provider: SubscriptionBillingProvider;
    idempotencyKey: string;
    checkoutSessionId?: string;
    receiptToken?: string;
    transactionId?: string;
    orderId?: string;
    payloadJson: Record<string, unknown>;
    occurredAt: Date;
  }): Promise<boolean>;
  markReceiptVerificationProcessed(idempotencyKey: string): Promise<void>;
}

export interface SubscriptionRepositoryBundle {
  subscriptionRepository: SubscriptionRepository;
  subscriptionPlanRepository: {
    findById(id: string): Promise<SubscriptionPlanRow | null>;
    findActivePlans(): Promise<SubscriptionPlanRow[]>;
  };
}

export function createSubscriptionRepositoryBundle(
  database: DatabaseConnection,
): SubscriptionRepositoryBundle {
  const repository = new PostgresSubscriptionRepository(database);

  return {
    subscriptionRepository: repository,
    subscriptionPlanRepository: {
      findById: (id: string) => repository.findPlanById(id),
      findActivePlans: () => repository.findActivePlans(),
    },
  };
}

export class PostgresSubscriptionRepository
  implements SubscriptionRepository
{
  constructor(private readonly database: DatabaseExecutor) {}

  async findById(id: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `SELECT
        id,
        user_id AS "userId",
        plan_id AS "planId",
        upper(status::text) AS status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscriptions
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findPlanById(id: string): Promise<SubscriptionPlanRow | null> {
    const result = await this.database.query<SubscriptionPlanRow>(
      `SELECT
        id,
        name,
        price::text AS "price",
        duration_days AS "durationDays",
        upper(status::text) AS status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscription_plans
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async findActivePlans(): Promise<SubscriptionPlanRow[]> {
    const result = await this.database.query<SubscriptionPlanRow>(
      `SELECT
        id,
        name,
        price::text AS "price",
        duration_days AS "durationDays",
        upper(status::text) AS status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscription_plans
       WHERE status = 'active'
       ORDER BY duration_days ASC, price ASC, id ASC`,
    );

    return result.rows;
  }

  async findActiveByUserId(userId: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `SELECT
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async findLatestByUserId(userId: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `SELECT
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async findActiveDetailByUserId(userId: string): Promise<SubscriptionDetailRow | null> {
    const result = await this.database.query<SubscriptionDetailRow>(
      `SELECT
        subscriptions.id,
        subscriptions.status,
        subscriptions.plan_id AS "planId",
        plans.name AS "planName",
        plans.price::text AS "planPrice",
        plans.duration_days AS "planDurationDays",
        plans.status AS "planStatus",
        subscriptions.billing_provider AS "billingProvider",
        subscriptions.billing_status AS "billingStatus",
        subscriptions.billing_reference AS "billingReference",
        subscriptions.checkout_session_id AS "checkoutSessionId",
        subscriptions.last_billing_at AS "lastBillingAt",
        subscriptions.next_billing_at AS "nextBillingAt",
        subscriptions.status = 'active' AS "canAccessPremium",
        subscriptions.end_at AS "expiresAt",
        subscriptions.start_at AS "startAt",
        subscriptions.end_at AS "endAt",
        subscriptions.created_at AS "createdAt",
        subscriptions.updated_at AS "updatedAt"
       FROM subscriptions
       INNER JOIN subscription_plans AS plans ON plans.id = subscriptions.plan_id
       WHERE subscriptions.user_id = $1 AND subscriptions.status = 'active'
       ORDER BY subscriptions.updated_at DESC
       LIMIT 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async findLatestDetailByUserId(userId: string): Promise<SubscriptionDetailRow | null> {
    const result = await this.database.query<SubscriptionDetailRow>(
      `SELECT
        subscriptions.id,
        subscriptions.status,
        subscriptions.plan_id AS "planId",
        plans.name AS "planName",
        plans.price::text AS "planPrice",
        plans.duration_days AS "planDurationDays",
        plans.status AS "planStatus",
        subscriptions.billing_provider AS "billingProvider",
        subscriptions.billing_status AS "billingStatus",
        subscriptions.billing_reference AS "billingReference",
        subscriptions.checkout_session_id AS "checkoutSessionId",
        subscriptions.last_billing_at AS "lastBillingAt",
        subscriptions.next_billing_at AS "nextBillingAt",
        subscriptions.status = 'active' AS "canAccessPremium",
        subscriptions.end_at AS "expiresAt",
        subscriptions.start_at AS "startAt",
        subscriptions.end_at AS "endAt",
        subscriptions.created_at AS "createdAt",
        subscriptions.updated_at AS "updatedAt"
       FROM subscriptions
       INNER JOIN subscription_plans AS plans ON plans.id = subscriptions.plan_id
       WHERE subscriptions.user_id = $1
       ORDER BY subscriptions.created_at DESC
       LIMIT 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  }

  async findByCheckoutSessionId(checkoutSessionId: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `SELECT
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscriptions
       WHERE checkout_session_id = $1
       LIMIT 1`,
      [checkoutSessionId],
    );

    return result.rows[0] ?? null;
  }

  async findByBillingReference(billingReference: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `SELECT
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
       FROM subscriptions
       WHERE billing_reference = $1
       LIMIT 1`,
      [billingReference],
    );

    return result.rows[0] ?? null;
  }

  async createPendingSubscription(input: {
    userId: string;
    planId: string;
    billingProvider: SubscriptionBillingProvider;
    checkoutSessionId: string;
    startAt: Date;
    endAt: Date;
    provider?: string;
  }): Promise<SubscriptionRow> {
    const result = await this.database.query<SubscriptionRow>(
      `INSERT INTO subscriptions (
        user_id,
        plan_id,
        status,
        start_at,
        end_at,
        provider,
        billing_provider,
        billing_status,
        billing_reference,
        checkout_session_id,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, 'pending', $3, $4, $5, $6, 'initiated', NULL, $7, now(), now()
      )
      RETURNING
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.userId,
        input.planId,
        input.startAt,
        input.endAt,
        input.provider ?? null,
        input.billingProvider,
        input.checkoutSessionId,
      ],
    );

    return result.rows[0] as SubscriptionRow;
  }

  async updateAfterWebhook(input: {
    subscriptionId: string;
    billingProvider: SubscriptionBillingProvider;
    billingStatus: BillingStatus;
    billingReference: string;
    providerSubscriptionId?: string;
    checkoutSessionId?: string;
    lastBillingAt?: Date;
    nextBillingAt?: Date;
    status: SubscriptionStatus;
  }): Promise<SubscriptionRow> {
    const result = await this.database.query<SubscriptionRow>(
      `UPDATE subscriptions
       SET
        billing_provider = $2,
        billing_status = $3,
        billing_reference = $4,
        provider_subscription_id = COALESCE($5, provider_subscription_id),
        checkout_session_id = COALESCE($6, checkout_session_id),
        last_billing_at = COALESCE($7, last_billing_at),
        next_billing_at = COALESCE($8, next_billing_at),
        status = $9,
        updated_at = now()
       WHERE id = $1
       RETURNING
        id,
        user_id AS "userId",
        plan_id AS "planId",
        status,
        start_at AS "startAt",
        end_at AS "endAt",
        provider,
        provider_subscription_id AS "providerSubscriptionId",
        billing_provider AS "billingProvider",
        billing_status AS "billingStatus",
        billing_reference AS "billingReference",
        checkout_session_id AS "checkoutSessionId",
        last_billing_at AS "lastBillingAt",
        next_billing_at AS "nextBillingAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [
        input.subscriptionId,
        input.billingProvider,
        input.billingStatus.toLowerCase(),
        input.billingReference,
        input.providerSubscriptionId ?? null,
        input.checkoutSessionId ?? null,
        input.lastBillingAt ?? null,
        input.nextBillingAt ?? null,
        input.status.toLowerCase(),
      ],
    );

    return result.rows[0] as SubscriptionRow;
  }

  async recordWebhookEvent(input: {
    provider: SubscriptionBillingProvider;
    eventType: SubscriptionWebhookEventType;
    billingReference: string;
    idempotencyKey: string;
    subscriptionId?: string;
    checkoutSessionId?: string;
    payloadJson: Record<string, unknown>;
    occurredAt: Date;
  }): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO subscription_webhook_events (
        provider,
        event_type,
        billing_reference,
        idempotency_key,
        subscription_id,
        checkout_session_id,
        payload_json,
        occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id`,
      [
        input.provider,
        input.eventType,
        input.billingReference,
        input.idempotencyKey,
        input.subscriptionId ?? null,
        input.checkoutSessionId ?? null,
        JSON.stringify(input.payloadJson),
        input.occurredAt,
      ],
    );

    return result.rows.length > 0;
  }

  async markWebhookProcessed(idempotencyKey: string): Promise<void> {
    await this.database.query(
      `UPDATE subscription_webhook_events
       SET processed_at = now()
       WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
  }

  async recordReceiptVerification(input: {
    userId: string;
    provider: SubscriptionBillingProvider;
    idempotencyKey: string;
    checkoutSessionId?: string;
    receiptToken?: string;
    transactionId?: string;
    orderId?: string;
    payloadJson: Record<string, unknown>;
    occurredAt: Date;
  }): Promise<boolean> {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO subscription_receipt_verifications (
        user_id,
        provider,
        idempotency_key,
        checkout_session_id,
        receipt_token,
        transaction_id,
        order_id,
        payload_json,
        occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id`,
      [
        input.userId,
        input.provider,
        input.idempotencyKey,
        input.checkoutSessionId ?? null,
        input.receiptToken ?? null,
        input.transactionId ?? null,
        input.orderId ?? null,
        JSON.stringify(input.payloadJson),
        input.occurredAt,
      ],
    );

    return result.rows.length > 0;
  }

  async markReceiptVerificationProcessed(idempotencyKey: string): Promise<void> {
    await this.database.query(
      `UPDATE subscription_receipt_verifications
       SET processed_at = now()
       WHERE idempotency_key = $1`,
      [idempotencyKey],
    );
  }
}
