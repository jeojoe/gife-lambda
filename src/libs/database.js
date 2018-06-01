import { Client } from 'pg';
import Config from '../../config';

const client = new Client({
  user: Config.db.user,
  host: Config.db.host,
  database: Config.db.database,
  password: Config.db.password,
});

export default client;
