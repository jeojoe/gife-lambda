import { Client } from 'pg';
import Config from '../../config';

const client = new Client(Config.db);

export default client;
