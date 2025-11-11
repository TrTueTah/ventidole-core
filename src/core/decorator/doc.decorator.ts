import { applyDecorators, Type } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { BaseResponse } from '@shared/helper/response';
import { PaginationResponse, PageInfo } from '@shared/dto/pagination-response.dto';

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
              type: 'object',
              nullable: true,
              example: null,
              description: 'No data returned'
            },
        error: {
          type: 'object',
          nullable: true,
          example: null,
          description: 'Error information (null on success)'
        },
        errorCode: {
          type: 'string',
          nullable: true,
          example: null,
          description: 'Error code (null on success)'
        }
      },
      required: ['statusCode', 'message']
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

/**
 * Decorator for paginated response in Swagger documentation
 * Flattens pagination data at the same level as statusCode and message
 * 
 * @param model - The DTO model class for the data items
 * 
 * @example
 * @ApiPaginationResponse(PostDto)
 * async getPosts(@Query() query: PaginationDto) {
 *   // Returns: { statusCode, message, data: [], paging: {}, error, errorCode }
 * }
 */
export function ApiPaginationResponse<TModel extends Type<unknown>>(
  model: TModel,
) {
  return applyDecorators(
    ApiExtraModels(model, PageInfo),
    ApiOkResponse({
      description: 'Successful paginated response',
      schema: {
        type: 'object',
        properties: {
          statusCode: {
            type: 'number',
            example: 200,
            description: 'HTTP status code',
          },
          message: {
            type: 'string',
            example: 'OK',
            description: 'Response message',
          },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
            description: 'Array of data items',
          },
          paging: {
            type: 'object',
            description: 'Pagination metadata',
            properties: {
              total: {
                type: 'number',
                example: 100,
                description: 'Total number of items',
              },
              page: {
                type: 'number',
                example: 1,
                description: 'Current page number',
              },
              limit: {
                type: 'number',
                example: 10,
                description: 'Items per page',
              },
              totalPages: {
                type: 'number',
                example: 10,
                description: 'Total number of pages',
              },
            },
            required: ['total', 'page', 'limit', 'totalPages'],
          },
          error: {
            type: 'object',
            nullable: true,
            example: null,
            description: 'Error information (null on success)',
          },
          errorCode: {
            type: 'string',
            nullable: true,
            example: null,
            description: 'Error code (null on success)',
          },
        },
        required: ['statusCode', 'message', 'data', 'paging'],
      },
    }),
  );
}

