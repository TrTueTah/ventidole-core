import { getFirebaseCollectionNames } from "@shared/service/collection/collections.service";

export const getCollection = () =>
  getFirebaseCollectionNames();