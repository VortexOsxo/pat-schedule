<script lang="ts">
	import { employees, addMinutes } from '$lib/stores/schedule';

	let startRange = $state(8);
	let endRange = $state(20);

	const slots = $derived.by(() => {
		const s = [];
		const start = Math.max(0, Math.min(startRange, 23));
		const end = Math.max(start, Math.min(endRange, 23));
		for (let h = start; h <= end; h++) {
			const hh = String(h).padStart(2, '0');
			s.push(`${hh}:00`);
			s.push(`${hh}:30`);
		}
		return s;
	});

	function getEmployeesOnBreak(slotStart: string) {
		const slotEnd = addMinutes(slotStart, 30);
		return $employees.filter(emp => {
			const bStart = emp.breakTime;
			// Show employee if their break STARTS within this 30-min slot
			return bStart >= slotStart && bStart < slotEnd;
		});
	}

	let editingId = $state<string | null>(null);
	let editingValue = $state('');

	function startEdit(emp: any) {
		editingId = emp.id;
		editingValue = emp.breakTime;
	}

	function saveEdit(id: string) {
		if (/^([01]\d|2[0-3]):[0-5]\d$/.test(editingValue)) {
			employees.update(id, { breakTime: editingValue });
		}
		editingId = null;
	}

	const posColors: Record<string, string> = {
		Patrouilleur: '#fde047',
		Assistant: '#1d4ed8',
		Sauveteur: '#16a34a',
		"Chef d'équipe": '#6042b0',
	};
</script>

<svelte:head>
	<title>Horaires des pauses — Voiles en Voiles</title>
</svelte:head>

<main class="main-content">
	<div class="controls-bar">
		<div class="range-inputs">
			<div class="range-field">
				<label for="start-h">Début</label>
				<input id="start-h" type="number" min="0" max="23" bind:value={startRange} class="range-input" />
				<span>h</span>
			</div>
			<div class="range-field">
				<label for="end-h">Fin</label>
				<input id="end-h" type="number" min="0" max="23" bind:value={endRange} class="range-input" />
				<span>h</span>
			</div>
		</div>
		<p class="controls-hint">Affichage des créneaux de {startRange}h à {endRange}h:30</p>
	</div>

	<div class="break-grid">
		{#each slots as time}
			{@const onBreak = getEmployeesOnBreak(time)}
			<div class="time-slot" class:has-breaks={onBreak.length > 0}>
				<div class="slot-time">{time}</div>
				<div class="slot-content">
					{#if onBreak.length === 0}
						<span class="empty-slot">—</span>
					{:else}
						<div class="break-tags">
							{#each onBreak as emp}
								<div class="break-tag" style="border-left-color: {posColors[emp.position] || '#94a3b8'}">
									<div class="break-tag-main">
										<span class="tag-name">{emp.name}</span>
										<span class="tag-pos" style="color: {posColors[emp.position]}">{emp.position}</span>
									</div>
									<div class="break-tag-action">
										{#if editingId === emp.id}
											<input 
												type="text" 
												class="tag-input" 
												bind:value={editingValue} 
												onblur={() => saveEdit(emp.id)}
												onkeydown={e => e.key === 'Enter' && saveEdit(emp.id)}
												autofocus
											/>
										{:else}
											<button class="tag-edit-btn" onclick={() => startEdit(emp)}>
												{emp.breakTime}
											</button>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</main>

<style>
	.main-content {
		max-width: 900px;
		margin: 20px auto;
		padding: 0 16px;
	}

	.controls-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
		background: #fff;
		padding: 12px 20px;
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
	.range-input:focus { border-color: var(--accent-primary); outline: none; box-shadow: 0 0 0 3px var(--accent-glow); }
	
	.controls-hint { font-size: 12px; color: var(--text-muted); font-style: italic; }

	.break-grid {
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: var(--radius-lg);
		border: 1.5px solid var(--border-subtle);
		overflow: hidden;
		box-shadow: var(--shadow-md);
	}

	.time-slot {
		display: flex;
		border-bottom: 1px solid var(--border-subtle);
		min-height: 48px;
	}
	.time-slot:last-child { border-bottom: none; }
	.time-slot.has-breaks { background: #fcfdfe; }

	.slot-time {
		width: 80px;
		padding: 12px;
		font-size: 13px; font-weight: 700;
		color: var(--text-secondary);
		background: var(--bg-elevated);
		border-right: 1px solid var(--border-subtle);
		display: flex; align-items: center; justify-content: center;
		font-variant-numeric: tabular-nums;
	}

	.slot-content {
		flex: 1;
		padding: 8px 16px;
		display: flex; align-items: center;
	}

	.empty-slot { color: var(--text-muted); font-size: 14px; }

	.break-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		width: 100%;
	}

	.break-tag {
		background: #fff;
		border: 1px solid var(--border-subtle);
		border-left: 3px solid #94a3b8;
		border-radius: 6px;
		padding: 6px 10px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: var(--shadow-sm);
		min-width: 200px;
	}

	.break-tag-main { display: flex; flex-direction: column; flex: 1; }
	.tag-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
	.tag-pos { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; }

	.tag-edit-btn {
		font-size: 11px; font-weight: 700;
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		padding: 2px 6px;
		border-radius: 4px;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.tag-edit-btn:hover { border-color: var(--accent-primary); color: var(--accent-primary); }

	.tag-input {
		width: 60px;
		font-size: 11px;
		padding: 2px 4px;
		border: 1px solid var(--accent-primary);
		border-radius: 4px;
		text-align: center;
	}

	@media (max-width: 600px) {
		.break-tag { min-width: 0; flex: 1; }
		.slot-time { width: 60px; font-size: 11px; }
	}
</style>
