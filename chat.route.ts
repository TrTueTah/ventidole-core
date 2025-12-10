import express, { Request, Response, NextFunction } from 'express';
import { operations, components } from '@invited-only/invited-only-api';
import { BadRequestException, InternalServerErrorException } from '../../exceptions/exceptions';
// import createChatFlow from '../../flows/chat/createChatFlow'; // Placeholder for flow function
import getChatsForUserFlow from '../../flows/chat/getChatsForUserFlow'; // Import the new flow
import getChatsForEventFlow from '../../flows/chat/getChatsForEventFlow';
import { createMessageFlow } from '../../flows/chat/createMessageFlow';
import { getMessagesFlow } from '../../flows/chat/getMessagesFlow';
import { markChatAsSeenFlow } from '../../flows/chat/markChatAsSeenFlow'; // <-- Import the new flow
import { getChatsForGuestFlow } from '../../flows/chat/getChatesForGuestFlow';
import deleteChats from '../../flows/chat/deleteChats';
import getChatByIdFlow from '../../flows/chat/getChatByIdFlow';
import { getEventData } from '../../flows/eventAttendees/updateEventAttend/utils';
import getUserById from '../../flows/users/getUserById';
import { db } from '../../db/firebaseApp.config';
import { triggerEventMessageWorkflow } from '../../services/knock/eventMessageWorkflow';

// Define types based on OpenAPI operations
type CreateChatRequest = Request<
  {},
  operations['createChat']['responses']['200']['content']['application/json'],
  operations['createChat']['requestBody']['content']['application/json']
>;

type GetChatForGuest = Request<operations['getChatsForGuest']['parameters']['path']>;
type GetChatsForUserRequest = Request<operations['getChatsForUser']['parameters']['path']>;
type GetChatsForEventRequest = Request<operations['getChatsForEvent']['parameters']['path']>;
type CreateMessageRequest = Request<
  operations['createMessage']['parameters']['path'],
  operations['createMessage']['requestBody']['content']['application/json']
>;
type GetMessagesRequest = Request<operations['getMessages']['parameters']['path']>;
type MarkChatAsSeenRequest = Request<
  operations['markChatAsSeen']['parameters']['path']>;
type GetChatByIdRequest = Request<operations['getChatById']['parameters']['path']>;
interface TriggerMessageNotificationBody {
  senderId: string;
  recipientId: string;
  eventId: string;
  message: string;
}
type TriggerMessageNotificationRequest = Request<
  {},
  { success: true },
  TriggerMessageNotificationBody
>;

const router = express.Router();
const MESSAGE_PUSH_BACKUP_COLLECTION = 'eventMessageNotifications';

// POST /chat - Create a new chat
router.post(
  '/',
  async (
    req: CreateChatRequest,
    res: Response<components['schemas']['Chat'] | string>,
    next: NextFunction
  ) => {

    try {
      // TODO: Implement and call createChatFlow
      // const newChat = await createChatFlow({ chatData: req.body });
      // res.status(200).json(newChat);
      res.status(501).send('Chat creation flow not implemented yet.'); // Placeholder response
    } catch (error) {
      console.error('Error in POST /chat route:', error);
      if (error instanceof BadRequestException) {
        next(error);
      } else {
        next(new InternalServerErrorException('Failed to create chat'));
      }
    }
  }
);

// GET /chat/{userId} - Get chats for a user  
router.get(
  '/user/:userId',
  async (
    req: GetChatsForUserRequest,
    res: Response<components['schemas']['GetChatForUserResponse'] | string>,
    next: NextFunction
  ) => {
    const { userId } = req.params;

    try {
      const userChats = await getChatsForUserFlow({ userId });
      res.status(200).json(userChats);
    } catch (error) {
      console.error(`Error in GET /chat/user/${userId} route:`, error);
      next(new InternalServerErrorException('Failed to retrieve chats'));
    }
  }
);

// GET /chat/event/{eventId} - Get chats for an event
router.get(
  '/event/:eventId',
  async (
    req: GetChatsForEventRequest,
    res: Response<components['schemas']['Chat'][] | string>,
    next: NextFunction
  ) => {
    const { eventId } = req.params;
    const startTime = Date.now();

    try {
      const eventChats = await getChatsForEventFlow({ eventId });

      const responseTime = Date.now() - startTime;
      console.log(`GET /chat/event/${eventId} completed in ${responseTime}ms`);

      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.status(200).json(eventChats);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Error in GET /chat/event/${eventId} route (${responseTime}ms):`, error);
      next(new InternalServerErrorException('Failed to retrieve chats'));
    }
  }
);

router.post(
  '/message/notify',
  async (
    req: TriggerMessageNotificationRequest,
    res: Response<{ success: true } | string>,
    next: NextFunction
  ) => {
    const { senderId, recipientId, eventId, message } = req.body ?? {};

    if (!senderId || !recipientId || !eventId || !message) {
      return next(
        new BadRequestException('senderId, recipientId, eventId and message are required')
      );
    }

    try {
      const [eventData, senderUser, recipientUser] = await Promise.all([
        getEventData(eventId).catch(() => null),
        getUserById({ userId: senderId }).catch(() => null),
        getUserById({ userId: recipientId }).catch(() => null),
      ]);

      await triggerEventMessageWorkflow({
        eventId,
        eventName: (eventData as any)?.name,
        eventCoverImage: (eventData as any)?.photos?.[0]?.image,
        senderId,
        senderName: senderUser?.name,
        senderAvatar: senderUser?.photos?.[0]?.image,
        recipientId,
        message,
      });

      await db.collection(MESSAGE_PUSH_BACKUP_COLLECTION).add({
        senderId,
        recipientId,
        eventId,
        message,
        createdAt: new Date().toISOString(),
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in POST /chat/message/notify route:', error);
      next(new InternalServerErrorException('Failed to trigger message notification'));
    }
  }
);


router.post(
  '/message/:chatId',
  async (
    req: CreateMessageRequest,
    res: Response<components['schemas']['ChatMessage'] | string>,
    next: NextFunction
  ) => {
    const { chatId } = req.params;

    try {
      const newMessage = await createMessageFlow({ chatId, messageData: req.body });
      res.status(200).json(newMessage);
    } catch (error) {
      console.error(`Error in POST /chat/message/${chatId} route:`, error);
      next(new InternalServerErrorException('Failed to create message'));
    }
  }
);



// GET /chat/message/{chatId} - Get messages for a chat
router.get(
  '/message/:chatId',
  async (
    req: GetMessagesRequest,
    res: Response<components['schemas']['ChatMessage'][] | string>,
    next: NextFunction
  ) => {
    const { chatId } = req.params;
    try {
      const messages = await getMessagesFlow({ chatId });
      res.status(200).json(messages);
    } catch (error) {
      console.error(`Error in GET /chat/message/${chatId} route:`, error);
      next(new InternalServerErrorException('Failed to retrieve messages'));
    }
  }
);

router.patch(
  '/:chatId/seen',
  async (
    req: MarkChatAsSeenRequest,
    res: Response<string | void>, // Typically returns 204 No Content
    next: NextFunction
  ) => {
    const { chatId } = req.params;
    const { userId } = req.body; // Get userId from request body



    if (!userId) {
      // Send specific error if userId is missing from body
      return next(new BadRequestException('User ID must be provided in the request body.'));
    }

    try {
      // Call the implemented flow function
      await markChatAsSeenFlow({ chatId, userId });
      res.status(204).send(); // Send 204 No Content on success
    } catch (error) {
      console.error(`Error in PATCH /chat/${chatId}/seen route:`, error);
      // Pass the error to the central error handler
      next(error);
    }
  }
);

router.get(
  '/user/guest/:guestId/',
  async (req: GetChatForGuest, res: Response<components['schemas']['Chat'][] | string>, next: NextFunction) => {
    const { guestId } = req.params;
    try {
      const chats = await getChatsForGuestFlow({ guestId });
      res.status(200).json(chats);
    } catch (error) {
      console.error(`Error in GET /chat/user/guest/${guestId} route:`, error);
      next(new InternalServerErrorException('Failed to retrieve chats'));
    }
  }
);

router.delete(
  '/',
  async (req: Request, res: Response<{ message: string } | void>, next: NextFunction) => {
    const { hostId, guestId, eventId } = req.body;
    try {
      await deleteChats({ hostId, guestId, eventId });
      res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
      console.error(`Error in DELETE /chat route:`, error);
      next(new InternalServerErrorException('Failed to delete chat'));
    }
  }
);

router.get(
  '/:chatId',
  async (req: GetChatByIdRequest, res: Response<components['schemas']['Chat'] | string>, next: NextFunction) => {
    const { chatId } = req.params;
    try {
      const chat = await getChatByIdFlow({ chatId });
      res.status(200).json(chat);
    } catch (error) {
      console.error(`Error in GET /chat/${chatId} route:`, error);
      next(new InternalServerErrorException('Failed to retrieve chat'));
    }
  }
);

export default router;
