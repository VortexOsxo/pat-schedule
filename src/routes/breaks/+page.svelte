<script lang="ts">
	import { employees, addMinutes } from '$lib/stores/schedule';

	let startRange = $state(11);
	let endRange = $state(15);

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

	let draggedId = $state<string | null>(null);
	let dragOverSlot = $state<string | null>(null);

	function handleDragStart(e: DragEvent, id: string) {
		draggedId = id;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDrop(e: DragEvent, slotTime: string) {
		e.preventDefault();
		dragOverSlot = null;
		if (draggedId) {
			employees.update(draggedId, { breakTime: slotTime });
			draggedId = null;
		}
	}

	// ── Mobile Touch Support ──
	function handleTouchStart(id: string) {
		draggedId = id;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!draggedId) return;
		e.preventDefault();
		const touch = e.touches[0];
		const target = document.elementFromPoint(touch.clientX, touch.clientY);
		const slot = target?.closest('.time-slot');
		if (slot) {
			const time = slot.getAttribute('data-time');
			if (time) dragOverSlot = time;
		} else {
			dragOverSlot = null;
		}
	}

	function handleTouchEnd() {
		if (draggedId && dragOverSlot) {
			employees.update(draggedId, { breakTime: dragOverSlot });
		}
		draggedId = null;
		dragOverSlot = null;
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
	</div>

	<div class="break-grid" role="list">
		{#each slots as time}
			{@const onBreak = getEmployeesOnBreak(time)}
			<div 
				class="time-slot" 
				class:has-breaks={onBreak.length > 0}
				class:drag-over={dragOverSlot === time}
				data-time={time}
				ondragover={(e) => { e.preventDefault(); dragOverSlot = time; }}
				ondragleave={() => dragOverSlot = null}
				ondrop={(e) => handleDrop(e, time)}
				role="listitem"
				aria-label="Créneau de {time}"
			>
				<div class="slot-time">{time}</div>
				<div class="slot-content">
					{#if onBreak.length === 0}
						<span class="empty-slot">—</span>
					{:else}
						<div class="break-tags">
							{#each onBreak as emp}
								<div 
									class="break-tag" 
									style="border-left-color: {posColors[emp.position] || '#94a3b8'}"
									draggable="true"
									ondragstart={(e) => handleDragStart(e, emp.id)}
									ontouchstart={() => handleTouchStart(emp.id)}
									ontouchmove={handleTouchMove}
									ontouchend={handleTouchEnd}
									class:is-dragging={draggedId === emp.id}
									role="button"
									tabindex="0"
									aria-label="Déplacer {emp.name}"
								>
									<div class="break-tag-main">
										<span class="tag-name">{emp.name}</span>
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
	.time-slot.drag-over { background: rgba(14, 79, 132, 0.08); border-right: 2px dashed var(--accent-primary); }

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
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}

	.break-tag {
		background: #fff;
		border: 1px solid var(--border-subtle);
		border-left: 4px solid #94a3b8;
		border-radius: 6px;
		padding: 8px 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: var(--shadow-sm);
		width: fit-content;
		min-width: 160px;
		cursor: grab;
		transition: transform 0.1s, opacity 0.1s;
		touch-action: none;
	}
	.break-tag:active { cursor: grabbing; }
	.break-tag.is-dragging { 
		opacity: 0.4; 
		transform: scale(0.95); 
		touch-action: none;
	}

	.break-tag-main { display: flex; flex-direction: column; flex: 1; }
	.tag-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }

	@media (max-width: 600px) {
		.break-tag { min-width: 0; flex: 1; }
		.slot-time { width: 60px; font-size: 11px; }
	}
</style>
