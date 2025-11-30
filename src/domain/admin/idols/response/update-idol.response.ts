import { ApiProperty } from '@nestjs/swagger';
import { IdolDto } from './get-idols.response';

export class UpdateIdolResponse {
  @ApiProperty({ description: 'Updated idol data', type: IdolDto })
  idol: IdolDto;

  constructor(idol: any) {
    this.idol = new IdolDto(idol);
  }
}
