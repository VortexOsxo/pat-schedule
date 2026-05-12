<script lang="ts">
	import { employees, addMinutes, settings } from '$lib/stores/schedule';

	const roles = [
		{ id: 'bateau', name: 'Bateau', color: '#0e4f84' },
		{ id: 'pied2', name: '2 pied', color: '#0e8a8a' },
		{ id: 'speech', name: 'Speech', color: '#6042b0' }
	];

	const slots = $derived.by(() => {
		const s = [];
		const start = Math.max(0, Math.min($settings.startH, 23));
		const end = Math.max(start, Math.min($settings.endH, 23));
		for (let i = start; i <= end; i++) {
			const hh = String(i).padStart(2, '0');
			s.push(`${hh}:00`);
			s.push(`${hh}:30`);
		}
		return s;
	});

	function getRotation(time: string) {
		const available = $employees.filter(emp => {
			const s = emp.startTime;
			const e = emp.endTime;
			const b = emp.breakTime;
			const isWorking = time >= s && time < e;
			const isOnBreak = b && (time >= b && time < addMinutes(b, 30));
			return isWorking && !isOnBreak;
		});

		if (available.length === 0) return { speech: [], pied2: [], bateau: [] };

		// Deterministic rotation: we use the hour + 0.5 for the offset
		const [h, m] = time.split(':').map(Number);
		const rotationValue = h + (m === 30 ? 0.5 : 0);
		
		const sorted = [...available].sort((a, b) => a.id.localeCompare(b.id));
		// We multiply by 2 to get a unique integer offset for each 30-min slot
		const offset = Math.floor(rotationValue * 2) % sorted.length;
		const rotated = [...sorted.slice(offset), ...sorted.slice(0, offset)];

		const speech = rotated.slice(0, 2);
		const pied2 = rotated.slice(2, 4);
		const bateau = rotated.slice(4);

		return { speech, pied2, bateau };
	}
</script>

<main class="main-content">
	<div class="controls-bar">
		<div class="range-inputs">
			<div class="range-field">
				<label for="start-h">Début</label>
				<input id="start-h" type="number" min="0" max="23" 
					value={$settings.startH} 
					oninput={(e) => settings.update(s => ({ ...s, startH: +e.currentTarget.value }))}
					class="range-input" />
				<span>h</span>
			</div>
			<div class="range-field">
				<label for="end-h">Fin</label>
				<input id="end-h" type="number" min="0" max="23" 
					value={$settings.endH} 
					oninput={(e) => settings.update(s => ({ ...s, endH: +e.currentTarget.value }))}
					class="range-input" />
				<span>h</span>
			</div>
		</div>
	</div>

	<div class="rotation-grid">
		<div class="grid-header">
			<div class="time-col">Heure</div>
			<div class="role-header-cell" style="border-top-color: #0e4f84">Bateau</div>
			<div class="role-header-cell" style="border-top-color: #0e8a8a">2 Pied (2)</div>
			<div class="role-header-cell" style="border-top-color: #6042b0">Speech (2)</div>
		</div>

		<div class="grid-body">
			{#each slots as time}
				{@const res = getRotation(time)}
				<div class="hour-row">
					<div class="time-cell">{time}</div>
					
					<!-- Bateau Column -->
					<div class="role-cell bateau-cell">
						{#each res.bateau as emp}
							<div class="emp-tag" style="border-left-color: #0e4f84">
								<span class="emp-name">{emp.name}</span>
							</div>
						{:else}
							<span class="empty-label">—</span>
						{/each}
					</div>

					<!-- 2 Pied Column -->
					<div class="role-cell pied-cell">
						{#each res.pied2 as emp}
							<div class="emp-tag" style="border-left-color: #0e8a8a">
								<span class="emp-name">{emp.name}</span>
							</div>
						{:else}
							<span class="empty-label">—</span>
						{/each}
					</div>

					<!-- Speech Column -->
					<div class="role-cell speech-cell">
						{#each res.speech as emp}
							<div class="emp-tag" style="border-left-color: #6042b0">
								<span class="emp-name">{emp.name}</span>
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
		max-width: 1400px;
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
		border-bottom: 2px solid var(--border-subtle);
	}

	.time-col {
		width: 100px;
		padding: 16px;
		font-weight: 800;
		color: var(--text-secondary);
		text-align: center;
		border-right: 1.5px solid var(--border-subtle);
	}

	.role-header-cell {
		flex: 1;
		padding: 16px;
		text-align: center;
		font-size: 14px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-top: 5px solid #94a3b8;
		border-right: 1.5px solid var(--border-subtle);
	}
	.role-header-cell:last-child { border-right: none; }

	.hour-row {
		display: flex;
		border-bottom: 1.5px solid var(--border-subtle);
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
		border-right: 1.5px solid var(--border-subtle);
		background: var(--bg-elevated);
		font-variant-numeric: tabular-nums;
	}

	.role-cell {
		flex: 1;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		border-right: 1.5px solid var(--border-subtle);
	}
	.role-cell:last-child { border-right: none; }

	.emp-tag {
		background: #fff;
		border: 1px solid var(--border-subtle);
		border-left: 4px solid #94a3b8;
		border-radius: 6px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		box-shadow: var(--shadow-sm);
		width: 100%;
		max-width: 240px;
	}
	.emp-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }

	.empty-label { font-size: 14px; color: var(--text-muted); align-self: center; margin-top: 12px; }

	@media (max-width: 800px) {
		.role-header-cell { font-size: 11px; padding: 12px 4px; }
		.time-col, .time-cell { width: 70px; font-size: 12px; }
		.emp-name { font-size: 12px; }
		.emp-tag { padding: 6px 10px; }
	}
</style>

