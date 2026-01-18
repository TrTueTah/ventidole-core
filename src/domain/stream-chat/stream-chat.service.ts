import getStreamChatClient, {
  getStreamChatApiKey,
} from '@core/config/stream-chat.config';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { Role } from 'src/db/prisma/enums';
import { CreateCommunityChannelDto } from './dto/create-community-channel.dto';
import { CreateIdolChannelDto } from './dto/create-idol-channel.dto';
import { CreateStreamUserDto } from './dto/create-user.dto';

@Injectable()
export class StreamChatService {
  private readonly logger = new Logger(StreamChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate authentication token for a user
   */
  async generateToken(userId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const token = streamChatClient.createToken(userId);

      this.logger.log(`Generated token for user: ${userId}`);

      return {
        token,
        apiKey: getStreamChatApiKey(),
        userId,
      };
    } catch (error) {
      this.logger.error(`Error generating token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a user in Stream Chat
   */
  async createOrUpdateUser(data: CreateStreamUserDto) {
    try {
      const streamChatClient = getStreamChatClient();

      // Build user data - only include role if explicitly provided
      const userData: any = {
        id: data.userId,
        name: data.name,
        image: data.image,
      };

      // Only set role if explicitly provided, otherwise use GetStream default
      if (data.role) {
        userData.role = data.role;
      }

      const user = await streamChatClient.upsertUser(userData);

      this.logger.log(`Created/Updated user in Stream Chat: ${data.userId}`);

      return user;
    } catch (error) {
      this.logger.error(`Error creating/updating user ${data.userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a community channel (ADMIN only)
   * Automatically adds all idols from the community with send permission
   */
  async createCommunityChannel(
    adminId: string,
    data: CreateCommunityChannelDto,
  ) {
    try {
      // Verify admin role
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
      });

      if (!admin || admin.role !== Role.ADMIN) {
        throw new ForbiddenException(
          'Only admins can create community channels',
        );
      }

      // Verify community exists
      const community = await this.prisma.community.findUnique({
        where: { id: data.communityId, isDeleted: false },
      });

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      // Get all idols from this community
      const communityIdols = await this.prisma.user.findMany({
        where: {
          communityId: data.communityId,
          role: Role.IDOL,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });

      this.logger.log(
        `Found ${communityIdols.length} idols in community ${data.communityId}`,
      );

      // Generate channel ID
      const channelId = `community_${data.communityId}`;

      // Create channel in GetStream
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId, {
        name: data.name,
        description: data.description,
        image: data.image,
        community_id: data.communityId,
        is_community_channel: true,
        created_by_id: adminId,
      } as Record<string, unknown>);

      await channel.create();

      // Add all idols from the community with send permission (channel_member role)
      if (communityIdols.length > 0) {
        await channel.addMembers(
          communityIdols.map((idol) => ({
            user_id: idol.id,
            channel_role: 'channel_member', // can send messages
          })),
        );
      }

      this.logger.log(
        `Created community channel ${channelId} with ${communityIdols.length} idols`,
      );

      return channel.data;
    } catch (error) {
      this.logger.error(`Error creating community channel:`, error);
      throw error;
    }
  }

  /**
   * Create an idol channel (IDOL only)
   * Creator becomes owner, members join as readonly by default
   */
  async createIdolChannel(idolId: string, data: CreateIdolChannelDto) {
    try {
      // Verify idol role
      const idol = await this.prisma.user.findUnique({
        where: { id: idolId },
      });

      if (!idol || idol.role !== Role.IDOL) {
        throw new ForbiddenException('Only idols can create idol channels');
      }

      // Generate channel ID
      const channelId = `idol_${idolId}`;

      // Create channel in GetStream
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId, {
        name: data.name,
        description: data.description,
        image: data.image,
        is_idol_channel: true,
        created_by_id: idolId,
      } as Record<string, unknown>);

      await channel.create();

      // Add idol as owner with full permissions
      await channel.addMembers([
        { user_id: idolId, role: 'owner', channel_role: 'moderator_member' },
      ]);

      this.logger.log(`Created idol channel ${channelId} for idol ${idolId}`);

      return channel.data;
    } catch (error) {
      this.logger.error(`Error creating idol channel:`, error);
      throw error;
    }
  }

  /**
   * Update idol channel information
   * Only the channel creator can update the channel
   */
  async updateIdolChannel(
    idolId: string,
    channelId: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
    },
  ) {
    try {
      // Verify idol role
      const idol = await this.prisma.user.findUnique({
        where: { id: idolId },
      });

      if (!idol || idol.role !== Role.IDOL) {
        throw new ForbiddenException('Only idols can update idol channels');
      }

      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Check if channel exists and get channel data
      await channel.watch();
      const channelData = channel.data;

      // Verify the idol is the channel creator
      if (channelData.created_by_id !== idolId) {
        throw new ForbiddenException(
          'Only the channel creator can update this channel',
        );
      }

      // Verify it's an idol channel
      if (!channelData.is_idol_channel) {
        throw new ForbiddenException('This is not an idol channel');
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.image !== undefined) updateData.image = data.image;

      // Update channel
      await channel.updatePartial({
        set: updateData,
      });

      this.logger.log(`Updated idol channel ${channelId} by idol ${idolId}`);

      return {
        success: true,
        channelId,
        ...updateData,
      };
    } catch (error) {
      this.logger.error(
        `Error updating idol channel ${channelId}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Grant send message permission to a member
   * For idol channels: Only channel creator can grant
   * For community channels: Any idol in the community can grant
   */
  async grantSendPermission(
    requesterId: string,
    channelId: string,
    memberId: string,
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Fetch channel data
      await channel.watch();
      const channelData = channel.data;

      // Validate requester is authorized
      if (channelData.is_idol_channel) {
        // For idol channels: only creator can grant permission
        if (requesterId !== channelData.created_by_id) {
          throw new ForbiddenException(
            'Only channel creator can grant send permissions',
          );
        }
      } else if (channelData.is_community_channel) {
        // For community channels: any idol in the community can grant permission
        const requester = await this.prisma.user.findUnique({
          where: { id: requesterId },
        });

        if (!requester || requester.role !== Role.IDOL) {
          throw new ForbiddenException('Only idols can grant send permissions');
        }

        if (requester.communityId !== channelData.community_id) {
          throw new ForbiddenException(
            'Only idols from this community can grant permissions',
          );
        }
      } else {
        throw new ForbiddenException('Invalid channel type');
      }

      // Update member role to allow sending messages
      await channel.updatePartial({
        set: {
          [`members.${memberId}.channel_role`]: 'channel_member',
        },
      });

      this.logger.log(
        `Granted send permission to ${memberId} in channel ${channelId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error granting send permission to ${memberId} in channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Revoke send message permission from a member
   * For idol channels: Only channel creator can revoke
   * For community channels: Any idol in the community can revoke
   */
  async revokeSendPermission(
    requesterId: string,
    channelId: string,
    memberId: string,
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Fetch channel data
      await channel.watch();
      const channelData = channel.data;

      // Validate requester is authorized
      if (channelData.is_idol_channel) {
        // For idol channels: only creator can revoke permission
        if (requesterId !== channelData.created_by_id) {
          throw new ForbiddenException(
            'Only channel creator can revoke send permissions',
          );
        }
      } else if (channelData.is_community_channel) {
        // For community channels: any idol in the community can revoke permission
        const requester = await this.prisma.user.findUnique({
          where: { id: requesterId },
        });

        if (!requester || requester.role !== Role.IDOL) {
          throw new ForbiddenException(
            'Only idols can revoke send permissions',
          );
        }

        if (requester.communityId !== channelData.community_id) {
          throw new ForbiddenException(
            'Only idols from this community can revoke permissions',
          );
        }
      } else {
        throw new ForbiddenException('Invalid channel type');
      }

      // Update member role to readonly
      await channel.updatePartial({
        set: {
          [`members.${memberId}.channel_role`]: 'channel_readonly',
        },
      });

      this.logger.log(
        `Revoked send permission from ${memberId} in channel ${channelId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error revoking send permission from ${memberId} in channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get channel information from GetStream
   */
  async getChannelInfo(channelId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Fetch channel data
      await channel.watch();

      const channelData: any = channel.data;

      return {
        id: channelData?.id || channelId,
        name: channelData?.name,
        image: channelData?.image,
        description: channelData?.description,
        memberCount: channelData?.member_count || 0,
        lastMessageAt: channelData?.last_message_at
          ? new Date(channelData.last_message_at)
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Error fetching channel info for ${channelId}:`, error);
      // Return null if channel doesn't exist
      return null;
    }
  }

  /**
   * Get idol's personal channel by querying for is_idol_channel and created_by_id
   * This handles both old channels (with timestamp) and new channels (without timestamp)
   */
  async getIdolChannel(idolId: string) {
    try {
      const streamChatClient = getStreamChatClient();

      // Query for idol channels created by this user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channels = await streamChatClient.queryChannels({
        is_idol_channel: true,
        created_by_id: idolId,
      } as any);

      if (channels.length === 0) {
        this.logger.log(`No idol channel found for idol ${idolId}`);
        return null;
      }

      // Get the first idol channel
      const channel = channels[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channelData = channel.data as Record<string, any>;

      return {
        id: channelData?.id,
        name: channelData?.name,
        image: channelData?.image,
        description: channelData?.description,
        memberCount: channelData?.member_count || 0,
        lastMessageAt: channelData?.last_message_at
          ? new Date(channelData.last_message_at)
          : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching idol channel for ${idolId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Join a chat channel
   * Users will be added with readonly permissions by default (channel_readonly)
   * This is a server-side operation that bypasses client-side permission restrictions
   */
  async joinChannel(userId: string, channelId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Verify channel exists
      await channel.watch();

      // Add user as member with readonly permission by default
      await channel.addMembers([
        {
          user_id: userId,
          channel_role: 'default_member',
        },
      ]);

      this.logger.log(`User ${userId} joined channel ${channelId}`);

      return {
        success: true,
        channelId,
      };
    } catch (error) {
      this.logger.error(
        `Error adding user ${userId} to channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Leave a chat channel
   * Removes the user from the channel members
   */
  async leaveChannel(userId: string, channelId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Verify channel exists
      await channel.watch();

      // Remove user from channel
      await channel.removeMembers([userId]);

      this.logger.log(`User ${userId} left channel ${channelId}`);

      return {
        success: true,
        channelId,
      };
    } catch (error) {
      this.logger.error(
        `Error removing user ${userId} from channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find and add user to their community channel with specified role
   * Used when FAN users are created to automatically add them to their community channel
   */
  async addUserToCommunityChannel(
    userId: string,
    communityId: string,
    channelRole: string = 'channel_moderator',
  ) {
    try {
      const streamChatClient = getStreamChatClient();

      // Query for community channel
      const channels = await streamChatClient.queryChannels({
        community_id: communityId,
        is_community_channel: true,
      });

      if (channels.length === 0) {
        this.logger.warn(
          `No community channel found for community ${communityId}`,
        );
        return null;
      }

      // Get the first (and should be only) community channel
      const channel = channels[0];

      // Add user to the channel with specified role
      await channel.addMembers([
        {
          user_id: userId,
          channel_role: channelRole,
        },
      ]);

      this.logger.log(
        `Added user ${userId} to community channel ${channel.id} with role ${channelRole}`,
      );

      return {
        success: true,
        channelId: channel.id,
        channelRole,
      };
    } catch (error) {
      this.logger.error(
        `Error adding user ${userId} to community ${communityId} channel:`,
        error.message,
      );
      // Return null instead of throwing to make this non-blocking
      return null;
    }
  }

  /**
   * Update community channel information in GetStream
   * Updates channel name, description, and image
   */
  async updateCommunityChannel(
    communityId: string,
    data: {
      name?: string;
      description?: string;
      image?: string;
    },
  ) {
    try {
      const streamChatClient = getStreamChatClient();

      // Find the community channel
      const channelId = `community_${communityId}`;
      const channel = streamChatClient.channel('messaging', channelId);

      // Check if channel exists
      await channel.watch();

      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.image !== undefined) updateData.image = data.image;

      // Update channel
      await channel.updatePartial({
        set: updateData,
      });

      this.logger.log(`Updated community channel ${channelId}`);

      return {
        success: true,
        channelId,
      };
    } catch (error) {
      this.logger.error(
        `Error updating community channel for ${communityId}:`,
        error.message,
      );
      // Return null instead of throwing to make this non-blocking
      return null;
    }
  }

  /**
   * Update member role in a channel
   * Uses assignRoles to change the channel role of a member
   * This is a server-side operation required because client-side role changes are not allowed
   */
  async updateMemberRole(
    requesterId: string,
    channelId: string,
    memberId: string,
    role: string,
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Fetch channel data to verify it exists and check permissions
      await channel.watch();
      const channelData = channel.data;

      // Validate requester is authorized (must be channel creator or idol for idol channels)
      if (channelData.is_idol_channel) {
        // For idol channels: only creator can change roles
        if (requesterId !== channelData.created_by_id) {
          throw new ForbiddenException(
            'Only channel creator can change member roles',
          );
        }
      } else if (channelData.is_community_channel) {
        // For community channels: any idol in the community can change roles
        const requester = await this.prisma.user.findUnique({
          where: { id: requesterId },
        });

        if (!requester || requester.role !== Role.IDOL) {
          throw new ForbiddenException('Only idols can change member roles');
        }

        if (requester.communityId !== channelData.community_id) {
          throw new ForbiddenException(
            'Only idols from this community can change member roles',
          );
        }
      } else {
        throw new ForbiddenException('Invalid channel type');
      }

      // Use assignRoles to update the member's channel role
      await channel.assignRoles([
        {
          user_id: memberId,
          channel_role: role,
        },
      ]);

      this.logger.log(
        `Updated member ${memberId} role to ${role} in channel ${channelId}`,
      );

      return {
        success: true,
        channelId,
        memberId,
        role,
      };
    } catch (error) {
      this.logger.error(
        `Error updating member ${memberId} role in channel ${channelId}:`,
        error.message,
      );
      throw error;
    }
  }
}
