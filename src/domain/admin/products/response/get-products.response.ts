import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '@shared/dto/pagination-response.dto';
import { ProductDto } from './get-product.response';

export class GetProductsResponse {
  @ApiProperty({
    description: 'Array of products',
    type: [ProductDto],
  })
  data: ProductDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PageInfo,
  })
  paging: PageInfo;
}