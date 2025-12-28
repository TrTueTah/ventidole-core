import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { AdminOrderService } from './admin-order.service';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderDto } from './dto/order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiBearerAuth()
@ApiTags('Admin Order Management')
@Controller({ path: 'admin/order', version: ApiVersion.V1 })
@ApiExtraModelsCustom(OrderDto, OrderDetailDto, CreateOrderDto, UpdateOrderDto)
export class AdminOrderController {
  constructor(private readonly adminOrderService: AdminOrderService) {}

  @Get()
  @ApiPaginationResponse(OrderDto)
  async getAllOrders(
    @Query() filters: GetOrdersDto,
  ): Promise<PaginationResponse<OrderDto>> {
    const result = await this.adminOrderService.getAllOrders(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(OrderDetailDto)
  async getOrderById(
    @Param('id') id: string,
  ): Promise<BaseResponse<OrderDetailDto>> {
    const result = await this.adminOrderService.getOrderById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(OrderDto)
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<BaseResponse<OrderDto>> {
    const result = await this.adminOrderService.createOrder(createOrderDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(OrderDto)
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<BaseResponse<OrderDto>> {
    const result = await this.adminOrderService.updateOrder(id, updateOrderDto);
    return BaseResponse.of(result);
  }

  @Patch(':id/status')
  @ApiResponseCustom(OrderDto)
  async changeOrderStatus(
    @Param('id') id: string,
    @Body() changeOrderStatusDto: ChangeOrderStatusDto,
  ): Promise<BaseResponse<OrderDto>> {
    const result = await this.adminOrderService.changeOrderStatus(
      id,
      changeOrderStatusDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteOrder(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminOrderService.deleteOrder(id);
    return BaseResponse.ok();
  }
}
