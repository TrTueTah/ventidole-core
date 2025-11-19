import { FirebaseCollectionNames } from "src/types/collection.types";

export const getFirebaseCollectionNames = (): FirebaseCollectionNames => {
  return {
    posts: 'posts',
    notifications: 'notifications',
    chatMessages: 'chat_messages',
    comments: 'comments',
    replies: 'replies',
  };
};
