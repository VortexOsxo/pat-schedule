// src/lib/stores/schedule.ts
import { writable } from 'svelte/store';

export interface Employee {
	id: string;
	name: string;
	position: string;
	startTime: string;  // HH:mm
	endTime: string;    // HH:mm
	breakTime?: string; // HH:mm  (30-min break starts at this time)
}

function uuid(): string {
	return crypto.randomUUID();
}

function load(): Employee[] {
	if (typeof localStorage === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem('pat-employees') ?? '[]');
	} catch {
		return [];
	}
}

function createStore() {
	const { subscribe, update, set } = writable<Employee[]>(load());

	subscribe((employees) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('pat-employees', JSON.stringify(employees));
		}
	});

	return {
		subscribe,
		add: (emp: Omit<Employee, 'id'>) =>
			update((list) => [...list, { ...emp, id: uuid() }]),
		remove: (id: string) =>
			update((list) => list.filter((e) => e.id !== id)),
		update: (id: string, patch: Partial<Employee>) =>
			update((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
		clear: () => set([]),
	};
}

export const employees = createStore();

// ── Helpers ───────────────────────────────────────────────────────────
/** Given HH:mm strings, returns the total worked minutes (excluding 30-min break) */
export function workedMinutes(start: string, end: string): number {
	const [sh, sm] = start.split(':').map(Number);
	const [eh, em] = end.split(':').map(Number);
	return (eh * 60 + em) - (sh * 60 + sm) - 30;
}

/** Format minutes → "Xh Ym" */
export function fmtDuration(minutes: number): string {
	if (minutes <= 0) return '—';
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Add `n` minutes to an HH:mm string, returns HH:mm */
export function addMinutes(time: string, n: number): string {
	const [h, m] = time.split(':').map(Number);
	const total = h * 60 + m + n;
	return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const POSITIONS = [
	'Patrouilleur',
	'Assistant',
	'Sauveteur',
	"Chef d'équipe",
];
