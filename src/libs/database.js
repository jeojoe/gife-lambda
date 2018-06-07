import { Client } from 'pg';
import Config from '../../config';

export function newDbClient() {
  return new Client(Config.db);
}
