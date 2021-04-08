import { Item } from './item';

export interface Role {
  uniqueId: number;
  event: Event;
  name: string;
  fonction: string;
  items: Item[];
}
