import { initEnvironmentConfig } from '@core/config/env.config';
import { EventModule } from '@core/event/event.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Infrastructure Modules
import { MailModule } from '@infra/mail/mail.module';

// Auth Module
import { AuthModule } from '@application/auth/auth.module';

// User Modules (Phase 2-4)
import { ProfileModule } from '@application/user/profile/profile.module';
import { CommunityModule } from '@application/user/community/community.module';
import { PostModule } from '@application/user/post/post.module';
import { CommentModule } from '@application/user/comment/comment.module';
import { OrderModule } from '@application/user/order/order.module';
import { ProductModule } from '@application/user/product/product.module';
import { ShopModule } from '@application/user/shop/shop.module';
import { CartModule } from '@application/user/cart/cart.module';

// Membership Modules (Phase 7)
import { MembershipTierModule } from '@application/user/membership-tier/membership-tier.module';
import { SubscriptionModule } from '@application/user/subscription/subscription.module';

// Webhook Modules
import { PayOSWebhookModule } from '@application/webhooks/payos-webhook.module';

@Module({
  imports: [
    // Core Modules
    ConfigModule.forRoot(initEnvironmentConfig()),
    EventModule, // Global event bus for domain events
    MailModule, // Global mail service (Phase 11)

    // Authentication
    AuthModule,

    // User Application Modules
    ProfileModule, // User profile and event handlers
    CommunityModule,
    PostModule,
    CommentModule,
    OrderModule,
    ProductModule,
    ShopModule,
    CartModule, // Phase 8

    // Membership Modules
    MembershipTierModule,
    SubscriptionModule,

    // Webhook Modules
    PayOSWebhookModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
