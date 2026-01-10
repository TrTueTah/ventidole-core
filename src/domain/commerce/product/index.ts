/**
 * Product Domain Exports
 */

export { ProductAggregate } from './product.aggregate';
export { ProductRepository } from './product.repository';
export { ProductVariant } from './entities/product-variant.entity';
export { ProductName } from './value-objects/product-name.vo';
export { Stock } from './value-objects/stock.vo';
export { CanViewProductPolicy } from './policies/can-view-product.policy';
export { CanManageProductPolicy } from './policies/can-manage-product.policy';
export { ProductCreatedEvent } from './events/product-created.event';
export { ProductUpdatedEvent } from './events/product-updated.event';
export { ProductStockUpdatedEvent } from './events/product-stock-updated.event';
export { ProductDeletedEvent } from './events/product-deleted.event';
