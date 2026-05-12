<script lang="ts">
	import { employees, addMinutes, settings } from '$lib/stores/schedule';

	const roles = [
		{ id: 'bateau', name: 'Bateau', color: '#0e4f84' },
		{ id: 'pied2', name: '2 pied', color: '#0e8a8a' },
		{ id: 'speech', name: 'Speech', color: '#6042b0' }
	];

	const hours = $derived.by(() => {
		const h = [];
		const start = Math.max(0, Math.min($settings.positionsStartH, 23));
		const end = Math.max(start, Math.min($settings.positionsEndH, 23));
		for (let i = start; i <= end; i++) h.push(i);
		return h;
	});

	function getRotation(h: number) {
		const time = `${String(h).padStart(2, '0')}:00`;
		const nextTime = `${String(h).padStart(2, '0')}:30`;
		
		const allWorking = $employees.filter(emp => {
			const s = emp.startTime;
			const e = emp.endTime;
			return time >= s && time < e;
		});

		if (allWorking.length === 0) return { speech: [], pied2: [], bateau: [] };

		// Sort to have a consistent order for rotation
		const sorted = [...allWorking].sort((a, b) => a.id.localeCompare(b.id));
		const offset = h % sorted.length;
		const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];

		// Identify who is on break
		const isEmpOnBreak = (emp: any) => emp.breakTime === time || emp.breakTime === nextTime;

		// We need to pick 2 for Speech and 2 for 2Pied from people NOT on break
		const activePool = rotated.filter(e => !isEmpOnBreak(e));
		const breakPool = rotated.filter(e => isEmpOnBreak(e));

		const speech = activePool.slice(0, 2);
		const pied2 = activePool.slice(2, 4);
		
		// Bateau gets everyone else:
		// 1. People in the activePool who weren't picked for Speech/2Pied
		// 2. Everyone in the breakPool
		const assignedIds = new Set([...speech, ...pied2].map(e => e.id));
		const bateau = rotated.filter(e => !assignedIds.has(e.id));

		const mapEmp = (emp: any) => ({ ...emp, onBreak: isEmpOnBreak(emp) });

		return { 
			speech: speech.map(mapEmp), 
			pied2: pied2.map(mapEmp), 
			bateau: bateau.map(mapEmp) 
		};
	}
</script>

<main class="main-content">
	<div class="controls-bar">
		<div class="range-inputs">
			<div class="range-field">
				<label for="start-h">Début</label>
				<input id="start-h" type="number" min="0" max="23" 
					value={$settings.positionsStartH} 
					oninput={(e) => settings.update(s => ({ ...s, positionsStartH: +e.currentTarget.value }))}
					class="range-input" />
				<span>h</span>
			</div>
			<div class="range-field">
				<label for="end-h">Fin</label>
				<input id="end-h" type="number" min="0" max="23" 
					value={$settings.positionsEndH} 
					oninput={(e) => settings.update(s => ({ ...s, positionsEndH: +e.currentTarget.value }))}
					class="range-input" />
				<span>h</span>
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
			{#each hours as h}
				{@const res = getRotation(h)}
				<div class="hour-row">
					<div class="time-cell">{h}:00</div>
					
					<!-- Bateau Column -->
					<div class="role-cell bateau-cell">
						{#each res.bateau as emp}
							<div class="emp-tag" style="border-left-color: #0e4f84" class:is-on-break={emp.onBreak}>
								<div class="emp-info">
									<span class="emp-name">{emp.name}</span>
								</div>
							</div>
						{:else}
							<span class="empty-label">—</span>
						{/each}
					</div>

					<!-- 2 Pied Column -->
					<div class="role-cell pied-cell">
						{#each res.pied2 as emp}
							<div class="emp-tag" style="border-left-color: #0e8a8a" class:is-on-break={emp.onBreak}>
								<div class="emp-info">
									<span class="emp-name">{emp.name}</span>
								</div>
							</div>
						{:else}
							<span class="empty-label">—</span>
						{/each}
					</div>

					<!-- Speech Column -->
					<div class="role-cell speech-cell">
						{#each res.speech as emp}
							<div class="emp-tag" style="border-left-color: #6042b0" class:is-on-break={emp.onBreak}>
								<div class="emp-info">
									<span class="emp-name">{emp.name}</span>
								</div>
							</div>
						{:else}
							<span class="empty-label">—</span>
						{/each}
					</div>
				</div>
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
	.range-field { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-secondary); }
	.range-input {
		width: 50px;
		padding: 4px 8px;
		border: 1.5px solid var(--border-subtle);
		border-radius: 6px;
		font-weight: 700;
		color: var(--accent-primary);
		text-align: center;
	}

	.rotation-grid {
		background: #fff;
		border-radius: var(--radius-lg);
		border: 1.5px solid var(--border-subtle);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		display: flex;
		flex-direction: column;
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
		min-height: 80px;
	}
	.hour-row:last-child { border-bottom: none; }

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

	.emp-tag {
		background: #fff;
		border: 1px solid var(--border-subtle);
		border-left: 5px solid #94a3b8;
		border-radius: 6px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		box-shadow: var(--shadow-sm);
		width: 100%;
		transition: all 0.2s;
	}
	.emp-info { display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 10px; }
	.emp-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }

	.emp-tag.is-on-break { 
		opacity: 0.75;
		background: #f1f5f9;
		border-color: #e2e8f0;
	}

	.empty-label { font-size: 14px; color: var(--text-muted); align-self: center; margin-top: 12px; }

	@media (max-width: 800px) {
		.controls-bar { flex-direction: column; gap: 16px; align-items: flex-start; padding: 16px; }
		.rotation-grid {
			overflow-x: hidden;
		}
		.role-header-cell { font-size: 10px; padding: 10px 4px; border-top-width: 3px; }
		.time-col, .time-cell { width: 60px; font-size: 11px; padding: 8px 4px; }
		.emp-name { font-size: 11px; }
		.emp-tag { padding: 4px 6px; border-left-width: 3px; }
		.role-cell { padding: 8px 4px; gap: 4px; }
		.hour-row, .grid-header { width: 100%; }
		.emp-info { gap: 4px; }
	}
</style>

