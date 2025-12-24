import { ENVIRONMENT } from '@core/config/env.config';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import axios, { AxiosInstance } from 'axios';
import { RecommendationResponseDto } from 'src/domain/user/post/dto/recommendation-response.dto';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: ENVIRONMENT.RECOMMENDATION_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get personalized post recommendations for a user
   * @param userId User ID to get recommendations for
   * @param limit Number of recommendations per page (default: 20, max: 100)
   * @param offset Pagination offset (default: 0)
   * @returns Recommendation response with post IDs and scores
   */
  async getUserRecommendations(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<RecommendationResponseDto> {
    try {
      this.logger.log(
        `Fetching recommendations for user ${userId} (limit: ${limit}, offset: ${offset})`,
      );

      const response = await this.axiosInstance.get<RecommendationResponseDto>(
        `/recommendations/${userId}`,
        {
          params: { limit, offset },
        },
      );

      this.logger.log(
        `Successfully fetched ${response.data.recommendations.length} recommendations for user ${userId}`,
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(
          `User ${userId} not found in recommendation system: ${error.response?.data?.detail || error.message}`,
        );
        throw new CustomError(ErrorCode.UserNotFoundInRecommendationSystem);
      }

      this.logger.error(
        `Failed to fetch recommendations for user ${userId}: ${error.message}`,
        {
          status: error.response?.status,
          data: error.response?.data,
        },
      );

      throw new CustomError(ErrorCode.RecommendationServiceError);
    }
  }

  /**
   * Check health of the recommendation service
   * @returns Health status
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/health');
      return response.data;
    } catch (error) {
      this.logger.error(
        `Recommendation service health check failed: ${error.message}`,
      );
      throw new CustomError(ErrorCode.RecommendationServiceError);
    }
  }
}
