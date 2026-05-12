import { connect } from '$lib/server/db';
import type { Employee, Settings } from '$lib/stores/schedule';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const db = await connect();

	const employees = await db.collection('employees').find({}).toArray();
	const settings = await db.collection('settings').findOne({ id: 'global' });
	
	return {
		employees: employees.map(e => ({
			...e,
			id: e._id.toString(),
			_id: undefined
		})) as any as Employee[],
		settings: settings ? { ...settings, _id: undefined, id: undefined } as any as Settings : null
	};
};
