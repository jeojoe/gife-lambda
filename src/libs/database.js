import { Client } from 'pg';
import Config from '../../config.js';

export function newDbClient() {
  return new Client(Config.db);
}
