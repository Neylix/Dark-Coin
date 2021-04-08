import { Item } from './item';
import { Role } from './role';

export interface Event {
  uniqueId: number;
  companyId: number;
  name: string;
  beginingDate: Date;
  endingDate: Date;
  items: Item[];
  roles: Role[];
}
