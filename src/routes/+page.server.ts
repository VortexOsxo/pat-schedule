import { connect } from '$lib/server/db';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	add: async ({ request }) => {
		const formData = await request.formData();
		const names = formData.getAll('names[]') as string[];
		const position = formData.get('position') as string;
		const startTime = formData.get('startTime') as string;
		const endTime = formData.get('endTime') as string;

		if (!names.length || !position || !startTime || !endTime) {
			return fail(400, { message: 'Missing fields' });
		}

		const db = await connect();
		const collection = db.collection('employees');

		const newEmployees = names
			.map(n => n.trim())
			.filter(Boolean)
			.map(name => ({
				name,
				position,
				startTime,
				endTime,
				createdAt: new Date()
			}));

		if (newEmployees.length > 0) {
			await collection.insertMany(newEmployees);
		}

		return { success: true };
	},

	remove: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) return fail(400, { message: 'Missing ID' });

		const db = await connect();
		const collection = db.collection('employees');
		
		const { ObjectId } = await import('mongodb');
		await collection.deleteOne({ _id: new ObjectId(id) });

		return { success: true };
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const fields = JSON.parse(formData.get('fields') as string);

		if (!id || !fields) return fail(400, { message: 'Missing data' });

		const db = await connect();
		const collection = db.collection('employees');
		
		const { ObjectId } = await import('mongodb');
		await collection.updateOne(
			{ _id: new ObjectId(id) },
			{ $set: { ...fields, updatedAt: new Date() } }
		);

		return { success: true };
	},

	updateSettings: async ({ request }) => {
		const formData = await request.formData();
		const patch = JSON.parse(formData.get('patch') as string);

		if (!patch) return fail(400, { message: 'Missing data' });

		const db = await connect();
		const collection = db.collection('settings');
		
		await collection.updateOne(
			{ id: 'global' },
			{ $set: { ...patch, updatedAt: new Date() } },
			{ upsert: true }
		);

		return { success: true };
	},

	clear: async () => {
		const db = await connect();
		const collection = db.collection('employees');
		await collection.deleteMany({});
		return { success: true };
	}
};
