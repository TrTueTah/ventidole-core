import getStreamChatClient from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateCommunityChannelDto } from './dto/create-community-channel.dto';

@Injectable()
export class AdminChatService {
  private readonly logger = new Logger(AdminChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a channel for a community and add all idols as participants
   */
  async createCommunityChannel(data: CreateCommunityChannelDto) {
    try {
      // Verify community exists
      const community = await this.prisma.community.findUnique({
        where: { id: data.communityId, isDeleted: false },
      });

      if (!community) {
        throw new CustomError(ErrorCode.CommunityNotFound);
      }

      // Get all idols belonging to this community
      const idols = await this.prisma.user.findMany({
        where: {
          communityId: data.communityId,
          role: Role.IDOL,
          isDeleted: false,
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      this.logger.log(
        `Found ${idols.length} idols in community ${data.communityId}`,
      );

      // Create the channel in the database
      const channel = await this.prisma.chatChannel.create({
        data: {
          name: data.name,
          description: data.description,
          communityId: data.communityId,
        },
      });

      // Create participants for all idols
      if (idols.length > 0) {
        await this.prisma.chatParticipant.createMany({
          data: idols.map((idol) => ({
            channelId: channel.id,
            userId: idol.id,
            canSendMessage: true,
          })),
        });

        this.logger.log(
          `Added ${idols.length} idol participants to channel ${channel.id}`,
        );
      }

      // Create channel in GetStream for real-time messaging
      try {
        const streamChatClient = getStreamChatClient();
        const streamChannel = streamChatClient.channel(
          'messaging',
          channel.id,
          {
            name: data.name,
            description: data.description,
            members: idols.map((idol) => idol.id),
            created_by_id: 'system',
          },
        );

        await streamChannel.create();

        this.logger.log(
          `Created GetStream channel for real-time messaging: ${channel.id}`,
        );
      } catch (streamError) {
        this.logger.error(
          `Error creating GetStream channel (channel saved in DB):`,
          streamError,
        );
        // Don't throw error here, channel is already saved in database
      }

      // Return the created channel with participants
      const createdChannel = await this.prisma.chatChannel.findUnique({
        where: { id: channel.id },
        include: {
          participants: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
          community: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      this.logger.log(
        `Successfully created community channel: ${channel.id} for community: ${data.communityId}`,
      );

      return createdChannel;
    } catch (error) {
      this.logger.error(
        `Error creating community channel for ${data.communityId}:`,
        error.message,
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(ErrorCode.ChatChannelCreationFailed);
    }
  }
}
