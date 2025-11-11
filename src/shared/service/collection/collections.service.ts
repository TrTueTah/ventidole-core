import { FirebaseCollectionNames } from "src/types/collection.types";

export const getFirebaseCollectionNames = (): FirebaseCollectionNames => {
  return {
    posts: 'posts',
    notifications: 'notifications',
    chatMessages: 'chatMessages',
  };
};
