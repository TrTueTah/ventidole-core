import {
  ApiExtraModelsCustom,
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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderService } from './order.service';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller({ path: 'orders', version: ApiVersion.V1 })
@ApiExtraModelsCustom(ConfirmOrderDto, OrderResponseDto)
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
