import { FirebaseCollectionNames } from 'src/types/collection.types';

export const getFirebaseCollectionNames = (): FirebaseCollectionNames => {
  return {
    posts: 'posts',
    postLikes: 'post_like',
    postMedia: 'post_media',
    postComments: 'post_comment',
    notifications: 'notifications',
    chatMessages: 'chatMessages',
    comments: 'comments',
    replies: 'replies',
  };
};
