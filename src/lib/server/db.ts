import { MongoClient } from 'mongodb';
import { MONGODB_URI, DB_NAME } from '$env/static/private';

if (!MONGODB_URI) {
	throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const client = new MongoClient(MONGODB_URI);

export async function connect() {
	await client.connect();
	return client.db(DB_NAME);
}

export default client;
