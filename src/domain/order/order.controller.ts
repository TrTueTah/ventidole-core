import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderDetailDto, OrderListDto } from './dto/order-list.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderService } from './order.service';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller({ path: 'orders', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  ConfirmOrderDto,
  OrderResponseDto,
  OrderListDto,
  OrderDetailDto,
  GetOrdersDto,
)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponseCustom(OrderResponseDto)
  @ApiOperation({
    summary: 'Confirm order and create payment',
    description:
      'Entry point for order creation. Creates order with PENDING_PAYMENT (CREDIT) or CONFIRMED (COD) status. For CREDIT, returns PayOS payment link.',
  })
  async confirmOrder(
    @Req() req: IRequest,
    @Body() dto: ConfirmOrderDto,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.confirmOrder(req.user.id, dto);
    return BaseResponse.of(result);
  }

  @Post(':orderId/retry-payment')
  @HttpCode(HttpStatus.OK)
  @ApiResponseCustom(OrderResponseDto)
  @ApiOperation({
    summary: 'Retry payment for PENDING_PAYMENT order',
    description:
      'Creates a new payment transaction with new orderCode and PayOS link. Only works for CREDIT orders in PENDING_PAYMENT status.',
  })
  async retryPayment(
    @Req() req: IRequest,
    @Param('orderId') orderId: string,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.retryPayment(req.user.id, orderId);
    return BaseResponse.of(result);
  }

  @Get()
  @ApiPaginationResponse(OrderListDto)
  @ApiOperation({
    summary: 'Get user orders',
    description:
      'Returns paginated list of user orders with optional status filter. Ordered by creation date (newest first).',
  })
  async getUserOrders(
    @Req() req: IRequest,
    @Query() dto: GetOrdersDto,
  ): Promise<PaginationResponse<OrderListDto>> {
    const result = await this.orderService.getUserOrders(req.user.id, dto);
    return result;
  }

  @Get(':orderId/details')
  @ApiResponseCustom(OrderDetailDto)
  @ApiOperation({
    summary: 'Get order details',
    description:
      'Returns detailed order information including all items, shipping address, and payment status.',
  })
  async getOrderDetails(
    @Req() req: IRequest,
    @Param('orderId') orderId: string,
  ): Promise<BaseResponse<OrderDetailDto>> {
    const result = await this.orderService.getOrderDetails(
      req.user.id,
      orderId,
    );
    return BaseResponse.of(result);
  }

  @Get(':orderId')
  @ApiResponseCustom(OrderResponseDto)
  @ApiOperation({
    summary: 'Get order status',
    description:
      'Frontend polling endpoint to check order payment status. Returns current order status and payment info if applicable.',
  })
  async getOrderStatus(
    @Req() req: IRequest,
    @Param('orderId') orderId: string,
  ): Promise<BaseResponse<OrderResponseDto>> {
    const result = await this.orderService.getOrderStatus(req.user.id, orderId);
    return BaseResponse.of(result);
  }
}
