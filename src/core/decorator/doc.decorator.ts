import { applyDecorators, Type } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { BaseResponse } from '@shared/helper/response';

export function ApiExtraModelsCustom(...models: Function[]) {
  return ApiExtraModels(BaseResponse, ...models);
}

export function ApiResponseCustom(ref?: string | Function, isArray = false) {
  return ApiOkResponse({
    description: 'Successful Response',
    schema: {
      type: 'object',
      properties: {
        statusCode: {
          type: 'number',
          example: 200,
          description: 'HTTP status code'
        },
        message: {
          type: 'string',
          example: 'OK',
          description: 'Response message'
        },
        data: ref
          ? isArray
            ? { 
                type: 'array', 
                items: { $ref: getSchemaPath(ref) },
                description: 'Response data array'
              }
            : { 
                $ref: getSchemaPath(ref),
                description: 'Response data'
              }
          : { 
              type: 'null',
              example: null,
              description: 'No data returned'
            },
        error: {
          type: 'null',
          example: null,
          description: 'Error information (null on success)'
        },
        errorCode: {
          type: 'string',
          description: 'Error code (optional)'
        }
      },
      required: ['statusCode', 'message', 'data']
    },
  });
}

export function ApiBodyCustom<TModel extends Type<unknown>>(
  model: TModel,
  isArray = false,
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiBody({
      schema: isArray
        ? {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          }
        : {
            $ref: getSchemaPath(model),
          },
    }),
  );
}

