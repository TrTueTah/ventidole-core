import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
  ApiPaginationResponse,
} from '@core/decorator/doc.decorator';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import { BaseResponse } from '@core/response/base-response';
import { PaginationDto } from '@application/shared/dto/pagination.dto';
import { OrderApplicationService } from './order.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderItemResponseDto,
  ShippingAddressResponseDto,
  MarkOrderAsPaidDto,
  ShipOrderDto,
  CancelOrderDto,
} from './dto';

/**
 * Order Controller
 *
 * HTTP endpoints for order management.
 *
 * Pattern:
 * 1. Validate input (DTOs)
 * 2. Call application service
 * 3. Map to response DTO
 */
@ApiTags('Order')
@ApiExtraModelsCustom(OrderResponseDto, OrderItemResponseDto, ShippingAddressResponseDto)
@Controller('user/order')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(
    private readonly orderService: OrderApplicationService,
  ) {}

  /**
   * Create new order
   */
  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponseCustom(OrderResponseDto)
  async createOrder(
    @CurrentUser('id') customerId: string,
    @Body() dto: CreateOrderDto,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.createOrder(customerId, dto);
    return BaseResponse.of(result);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponseCustom(OrderResponseDto)
  async getOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.getOrder(userId, orderId);
    return BaseResponse.of(result);
  }

  /**
   * Confirm order (shop accepts)
   */
  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirm order (shop owner)' })
  @ApiResponseCustom(OrderResponseDto)
  async confirmOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.confirmOrder(userId, orderId);
    return BaseResponse.of(result);
  }

  /**
   * Mark order as paid
   */
  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark order as paid (payment confirmation)' })
  @ApiResponseCustom(OrderResponseDto)
  async markOrderAsPaid(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: MarkOrderAsPaidDto,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.markOrderAsPaid(
      userId,
      orderId,
      dto.paymentId,
    );
    return BaseResponse.of(result);
  }

  /**
   * Ship order
   */
  @Patch(':id/ship')
  @ApiOperation({ summary: 'Ship order (shop owner)' })
  @ApiResponseCustom(OrderResponseDto)
  async shipOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: ShipOrderDto,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.shipOrder(
      userId,
      orderId,
      dto.trackingNumber,
    );
    return BaseResponse.of(result);
  }

  /**
   * Mark order as delivered
   */
  @Patch(':id/deliver')
  @ApiOperation({ summary: 'Mark order as delivered (shop owner)' })
  @ApiResponseCustom(OrderResponseDto)
  async deliverOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.deliverOrder(userId, orderId);
    return BaseResponse.of(result);
  }

  /**
   * Cancel order
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponseCustom(OrderResponseDto)
  async cancelOrder(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.cancelOrder(
      userId,
      orderId,
      dto.reason,
    );
    return BaseResponse.of(result);
  }

  /**
   * Get orders by customer
   */
  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer' })
  @ApiPaginationResponse(OrderResponseDto)
  async getOrdersByCustomer(
    @Param('customerId') customerId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ): Promise<BaseResponse<any>> {
    const result = await this.orderService.getOrdersByCustomer(
      customerId,
      pagination.page,
      pagination.limit,
      status,
    );
    return BaseResponse.of(result);
  }

  /**
   * Get orders by shop
   */
  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get orders by shop' })
  @ApiPaginationResponse(OrderResponseDto)
  async getOrdersByShop(
    @Param('shopId') shopId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ): Promise<BaseResponse<any>> {
    const result = await this.orderService.getOrdersByShop(
      shopId,
      pagination.page,
      pagination.limit,
      status,
    );
    return BaseResponse.of(result);
  }
}
