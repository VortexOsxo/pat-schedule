<script lang="ts">
	import { employees, addMinutes, settings } from '$lib/stores/schedule';
	import { get } from 'svelte/store';
	import { Button, Input, Select, Card, EmployeeCard, Dropdown, DropdownItem } from '$lib';
	import { invalidateAll } from '$app/navigation';

	const roles = [
		{ id: 'bateau', name: 'Bateau', color: '#0e4f84' },
		{ id: 'pied2', name: '2 pied', color: '#0e8a8a' },
		{ id: 'speech', name: 'Speech', color: '#6042b0' }
	];

	const slots = $derived.by(() => {
		const s = [];
		const start = Math.max(0, Math.min($settings.positionsStartH, 23));
		const end = Math.max(start, Math.min($settings.positionsEndH, 23));
		// Show 30-min slots if the rotation is 30 mins, otherwise stay hourly
		const showHalf = $settings.rotationInterval <= 0.5;
		for (let h = start; h <= end; h++) {
			s.push(h * 2);
			if (showHalf) s.push(h * 2 + 1);
		}
		return s;
	});

	// ── Balanced Schedule Generation ──────────────────────────────────
	const fullSchedule = $derived.by(() => {
		const sched: Record<number, { speech: string[], pied2: string[], bateau: string[] }> = {};
		const history: Record<string, { speech: number, pied2: number }> = {};
		$employees.forEach(e => history[e.id] = { speech: 0, pied2: 0 });

		const interval = $settings.rotationInterval || 1;
		const intervalInBlocks = interval * 2;
		const seed = $settings.rotationSeed || 0;

		// We calculate block by block to ensure balance
		slots.forEach(idx => {
			const h = Math.floor(idx / 2);
			const m = (idx % 2) * 30;
			const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

			// New rotation period
			if (idx % intervalInBlocks === 0 || !sched[idx - 1]) {
				const availableNow = $employees.filter(e => time >= e.startTime && time < e.endTime);
				const activePool = availableNow.filter(e => e.breakTime !== time);

				// Helper to break ties consistently but allow regeneration
				const tieBreak = (a: any, b: any) => (a.id + seed).localeCompare(b.id + seed);
				const getActiveTotal = (id: string) => history[id].speech + history[id].pied2;

				// 1. Pick for Speech: those who have worked LEAST in TOTAL active positions
				// (and within that, who worked least in Speech specifically)
				const speech = [...activePool]
					.sort((a, b) => 
						getActiveTotal(a.id) - getActiveTotal(b.id) || 
						history[a.id].speech - history[b.id].speech || 
						tieBreak(a, b)
					)
					.slice(0, 2);
				
				const remaining = activePool.filter(e => !speech.find(s => s.id === e.id));

				// 2. Pick for 2 Pied: those who have worked LEAST in TOTAL active positions
				// (and within that, who worked least in 2 Pied specifically)
				const pied2 = [...remaining]
					.sort((a, b) => 
						getActiveTotal(a.id) - getActiveTotal(b.id) || 
						history[a.id].pied2 - history[b.id].pied2 || 
						tieBreak(a, b)
					)
					.slice(0, 2);

				// 3. Everyone else is in Bateau
				const assignedIds = new Set([...speech, ...pied2].map(e => e.id));
				const bateau = availableNow.filter(e => !assignedIds.has(e.id));

				sched[idx] = { 
					speech: speech.map(e => e.id), 
					pied2: pied2.map(e => e.id), 
					bateau: bateau.map(e => e.id) 
				};

				// Update history for the next interval (30-min block)
				speech.forEach(e => history[e.id].speech += 0.5);
				pied2.forEach(e => history[e.id].pied2 += 0.5);
			} else {
				// Continue previous assignment within the same interval
				sched[idx] = sched[idx - 1];
			}
		});
		return sched;
	});

	function getRotation(idx: number) {
		const h = Math.floor(idx / 2);
		const m = (idx % 2) * 30;
		const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

		const res = fullSchedule[idx];
		if (!res) return { speech: [], pied2: [], bateau: [], time };

		const isOnBreak = (emp: any) => emp.breakTime === time;

		const findEmp = (id: string) => {
			const e = $employees.find(emp => emp.id === id);
			return e ? { ...e, onBreak: isOnBreak(e) } : null;
		};

		return {
			speech: res.speech.map(findEmp).filter(Boolean),
			pied2: res.pied2.map(findEmp).filter(Boolean),
			bateau: res.bateau.map(findEmp).filter(Boolean),
			time
		};
	}

	const stats = $derived.by(() => {
		const s: Record<string, { speech: number, pied2: number }> = {};
		$employees.forEach(e => s[e.id] = { speech: 0, pied2: 0 });

		slots.forEach(idx => {
			const res = getRotation(idx);
			// Each slot is 0.5 hour
			const weight = $settings.rotationInterval <= 0.5 ? 0.5 : 1; 
			// Wait, if I show hourly slots, each slot represents 1 hour.
			// If I show 30-min slots, each slot represents 0.5 hour.
			const increment = $settings.rotationInterval <= 0.5 ? 0.5 : 1;

			res.speech.forEach(e => { if (e && s[e.id]) s[e.id].speech += increment; });
			res.pied2.forEach(e => { if (e && s[e.id]) s[e.id].pied2 += increment; });
		});

		return $employees.map(e => ({
			name: e.name,
			speech: s[e.id]?.speech || 0,
			pied2: s[e.id]?.pied2 || 0,
			total: (s[e.id]?.speech || 0) + (s[e.id]?.pied2 || 0)
		})).sort((a, b) => b.total - a.total);
	});
	async function saveSettings(patch: any) {
		const prev = get(settings);
		
		// Optimistic Update
		settings.update(s => ({ ...s, ...patch }));

		const formData = new FormData();
		formData.append('patch', JSON.stringify(patch));
		
		try {
			const response = await fetch('/?/updateSettings', { method: 'POST', body: formData });
			const result = (await response.headers.get('content-type')?.includes('application/json')) 
				? await response.json() 
				: null; // Basic check

			if (response.status >= 400) {
				settings.set(prev);
			}
			await invalidateAll();
		} catch {
			settings.set(prev);
		}
	}
</script>

<main class="main-content">
	<div class="controls-bar">
		<div class="range-inputs">
			<Input 
				id="pos-start" 
				type="number" 
				min="0" 
				max="23" 
				label="Début"
				variant="range"
				value={$settings.positionsStartH} 
				oninput={(e) => saveSettings({ positionsStartH: +e.currentTarget.value })}
			/>
			<Input 
				id="pos-end" 
				type="number" 
				min="0" 
				max="23" 
				label="Fin"
				variant="range"
				value={$settings.positionsEndH} 
				oninput={(e) => saveSettings({ positionsEndH: +e.currentTarget.value })}
			/>
		</div>

		<div class="extra-controls">
			<div class="field">
				<label class="label" for="rot-interval">Rotation</label>
				<Dropdown 
					id="rot-interval"
					label={[
						{ value: 0.5, label: 'Chaque 30 minutes' },
						{ value: 1, label: 'Chaque heure' },
						{ value: 2, label: 'Chaque 2 heures' },
						{ value: 3, label: 'Chaque 3 heures' },
						{ value: 4, label: 'Chaque 4 heures' }
					].find(o => o.value === $settings.rotationInterval)?.label || 'Intervalle'}
					align="right"
				>
					{#each [
						{ value: 0.5, label: 'Chaque 30 minutes' },
						{ value: 1, label: 'Chaque heure' },
						{ value: 2, label: 'Chaque 2 heures' },
						{ value: 3, label: 'Chaque 3 heures' },
						{ value: 4, label: 'Chaque 4 heures' }
					] as opt}
						<DropdownItem onclick={() => saveSettings({ rotationInterval: opt.value })}>
							{opt.label}
						</DropdownItem>
					{/each}
				</Dropdown>
			</div>
		</div>
	</div>


	<div class="rotation-grid">
		<div class="grid-header">
			<div class="time-col">Heure</div>
			<div class="role-header-cell" style="border-top-color: #0e4f84">Bateau</div>
			<div class="role-header-cell" style="border-top-color: #0e8a8a">2 Pied</div>
			<div class="role-header-cell" style="border-top-color: #6042b0">Speech</div>
		</div>

		<div class="grid-body">
			{#each slots as idx}
				{@const res = getRotation(idx)}
				<div class="hour-row" class:half-hour={res.time.endsWith(':30')}>
					<div class="time-cell">{res.time}</div>
					
					<!-- Bateau Column -->
					<div class="role-cell bateau-cell">
 						{#each res.bateau as emp}
 							{#if emp}
								<EmployeeCard 
									variant="grid" 
									name={emp.name} 
									color="#0e4f84" 
									onBreak={emp.onBreak} 
								/>
 							{/if}
 						{:else}
 							<span class="empty-label">—</span>
 						{/each}
 					</div>
 
 					<!-- 2 Pied Column -->
 					<div class="role-cell pied-cell">
 						{#each res.pied2 as emp}
 							{#if emp}
								<EmployeeCard 
									variant="grid" 
									name={emp.name} 
									color="#0e8a8a" 
									onBreak={emp.onBreak} 
								/>
 							{/if}
 						{:else}
 							<span class="empty-label">—</span>
 						{/each}
 					</div>
 
 					<!-- Speech Column -->
 					<div class="role-cell speech-cell">
 						{#each res.speech as emp}
 							{#if emp}
								<EmployeeCard 
									variant="grid" 
									name={emp.name} 
									color="#6042b0" 
									onBreak={emp.onBreak} 
								/>
 							{/if}
 						{:else}
 							<span class="empty-label">—</span>
 						{/each}
 					</div>
 				</div>
 			{/each}
 		</div>
 	</div>
 
	<div class="actions-bar">
		<Button onclick={() => saveSettings({ rotationSeed: ($settings.rotationSeed || 0) + 1 })}>
			Regénérer l'horaire
		</Button>
	</div>


 	<div class="stats-section">
 		<h2 class="stats-title">Sommaire des positions (heures)</h2>
 		<div class="stats-grid">
 			{#each stats as s}
				<Card variant="stats" title={s.name}>
					<div class="stats-values">
						<div class="stat-item">
							<span class="stat-label">Speech</span>
							<span class="stat-val" style="color: #6042b0">{s.speech}h</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">2 Pied</span>
							<span class="stat-val" style="color: #0e8a8a">{s.pied2}h</span>
						</div>
						<div class="stat-item total">
							<span class="stat-label">Total</span>
							<span class="stat-val">{s.total}h</span>
						</div>
					</div>
				</Card>
 			{/each}
 		</div>
 	</div>

</main>

<style>
	.main-content {
		max-width: 1600px;
		width: 95%;
		margin: 20px auto;
		padding: 0 16px;
	}

	.controls-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
		background: #fff;
		padding: 16px 24px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
	}

	.range-inputs { display: flex; gap: 20px; }

	.extra-controls {
		display: flex;
		align-items: center;
		gap: 24px;
	}

	.rotation-grid {
		background: #fff;
		border-radius: var(--radius-lg);
		border: 1.5px solid var(--border-subtle);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
		margin-bottom: 40px;
	}

	.stats-section {
		background: #fff;
		padding: 24px;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
	}

	.stats-title {
		font-size: 15px;
		font-weight: 700;
		color: var(--text-secondary);
		margin-bottom: 20px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 16px;
	}

	.stats-values {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
	}

	.stat-label {
		color: var(--text-muted);
		font-weight: 600;
	}

	.stat-val {
		font-weight: 800;
		color: var(--text-primary);
	}

	.stat-item.total {
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px dashed var(--border-subtle);
	}

	@media (max-width: 800px) {
		.stats-grid { grid-template-columns: 1fr; }
	}

	.grid-header {
		display: flex;
		background: var(--bg-elevated);
		border-bottom: 2px solid #cbd5e1;
	}

	.time-col {
		width: 100px;
		padding: 16px;
		font-weight: 800;
		color: var(--text-secondary);
		text-align: center;
		border-right: 2px solid #e2e8f0;
	}

	.role-header-cell {
		flex: 1 1 0;
		min-width: 0;
		padding: 16px;
		text-align: center;
		font-size: 14px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-top: 5px solid #94a3b8;
		border-right: 2px solid #e2e8f0;
	}
	.role-header-cell:last-child { border-right: none; }

	.hour-row {
		display: flex;
		border-bottom: 2px solid #e2e8f0;
		min-height: 60px;
	}
	.hour-row:last-child { border-bottom: none; }

	.hour-row.half-hour {
		background: #f9fafb;
		border-bottom: 1px dashed #e2e8f0;
	}

	.time-cell {
		width: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 800;
		color: var(--text-secondary);
		border-right: 2px solid #e2e8f0;
		background: var(--bg-elevated);
		font-variant-numeric: tabular-nums;
	}

	.hour-row.half-hour .time-cell {
		font-weight: 600;
		font-size: 13px;
		opacity: 0.8;
	}

	.role-cell {
		flex: 1 1 0;
		min-width: 0;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-right: 2px solid #e2e8f0;
	}
	.role-cell:last-child { border-right: none; }

	.empty-label { font-size: 14px; color: var(--text-muted); align-self: center; margin-top: 12px; }

	.actions-bar {
		display: flex;
		justify-content: center;
		margin-bottom: 40px;
	}

	@media (max-width: 800px) {
		.controls-bar { flex-direction: column; gap: 16px; align-items: flex-start; padding: 16px; }
		.rotation-grid {
			overflow-x: hidden;
		}
		.role-header-cell { font-size: 10px; padding: 10px 4px; border-top-width: 3px; }
		.time-col, .time-cell { width: 60px; font-size: 11px; padding: 8px 4px; }
		.role-cell { padding: 8px 4px; gap: 4px; }
		.hour-row, .grid-header { width: 100%; }
	}
</style>


