<script lang="ts">
	import { employees, addMinutes, settings } from '$lib/stores/schedule';
	import { get } from 'svelte/store';
	import { Input, EmployeeCard, Dropdown, DropdownItem } from '$lib';
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	const slots = $derived.by(() => {
		const s = [];
		const start = Math.max(0, Math.min($settings.breaksStartH, 23));
		const end = Math.max(start, Math.min($settings.breaksEndH, 23));
		for (let h = start; h <= end; h++) {
			const hh = String(h).padStart(2, '0');
			s.push(`${hh}:00`);
			s.push(`${hh}:30`);
		}
		return s;
	});

	const unassigned = $derived($employees.filter(emp => !emp.breakTime));

	function getEmployeesOnBreak(slotStart: string) {
		const slotEnd = addMinutes(slotStart, 30);
		return $employees.filter(emp => {
			const bStart = emp.breakTime;
			if (!bStart) return false;
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

	async function updateBreakTime(id: string, slotTime: string) {
		const prev = get(employees);
		
		// Optimistic Update
		employees.update(id, { breakTime: slotTime });

		const formData = new FormData();
		formData.append('id', id);
		formData.append('fields', JSON.stringify({ breakTime: slotTime }));

		try {
			const response = await fetch('/?/update', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());
			if (result.type !== 'success' && result.type !== 'redirect') {
				employees.set(prev);
			}
			await invalidateAll();
		} catch {
			employees.set(prev);
		}
	}

	function handleDrop(e: DragEvent, slotTime: string) {
		e.preventDefault();
		dragOverSlot = null;
		if (draggedId) {
			updateBreakTime(draggedId, slotTime);
			draggedId = null;
		}
	}

	// ── Auto-scroll logic ──
	let scrollInterval: any = null;
	function checkAutoScroll(y: number) {
		const threshold = 100;
		const speed = 7;
		if (y < threshold) {
			if (!scrollInterval) scrollInterval = setInterval(() => window.scrollBy(0, -speed), 16);
		} else if (y > window.innerHeight - threshold) {
			if (!scrollInterval) scrollInterval = setInterval(() => window.scrollBy(0, speed), 16);
		} else {
			stopAutoScroll();
		}
	}
	function stopAutoScroll() {
		if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
	}

	// ── Mobile Touch Support ──
	function handleTouchStart(id: string) {
		draggedId = id;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!draggedId) return;
		e.preventDefault();
		const touch = e.touches[0];
		checkAutoScroll(touch.clientY);
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
		stopAutoScroll();
		if (draggedId && dragOverSlot) {
			updateBreakTime(draggedId, dragOverSlot);
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
	async function saveSettings(patch: any) {
		const prev = get(settings);
		
		// Optimistic Update
		settings.update(s => ({ ...s, ...patch }));

		const formData = new FormData();
		formData.append('patch', JSON.stringify(patch));
		
		try {
			const response = await fetch('/?/updateSettings', { method: 'POST', body: formData });
			if (response.status >= 400) {
				settings.set(prev);
			}
			await invalidateAll();
		} catch {
			settings.set(prev);
		}
	}
</script>

<svelte:head>
	<title>Horaires des pauses — Voiles en Voiles</title>
</svelte:head>

<main class="main-content">
	<div class="controls-bar">
		<div class="range-inputs">
			<Input 
				id="breaks-start" 
				type="number" 
				min="0" 
				max="23" 
				label="Début"
				variant="range"
				value={$settings.breaksStartH} 
				oninput={(e) => saveSettings({ breaksStartH: +e.currentTarget.value })}
			/>
			<Input 
				id="breaks-end" 
				type="number" 
				min="0" 
				max="23" 
				label="Fin"
				variant="range"
				value={$settings.breaksEndH} 
				oninput={(e) => saveSettings({ breaksEndH: +e.currentTarget.value })}
			/>
		</div>
	</div>

	{#if unassigned.length > 0}
		<div class="unassigned-section">
			<h3 class="section-title">En attente de pause ({unassigned.length})</h3>
			<div class="break-tags unassigned-tags">
				{#each unassigned as emp}
					<EmployeeCard 
						variant="break" 
						name={emp.name} 
						color={posColors[emp.position] || '#94a3b8'} 
						draggable="true"
						isDragging={draggedId === emp.id}
						ondragstart={(e: DragEvent) => handleDragStart(e, emp.id)}
						ontouchstart={() => handleTouchStart(emp.id)}
						ontouchmove={handleTouchMove}
						ontouchend={handleTouchEnd}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<div class="break-grid" role="list">
		{#each slots as time}
			{@const onBreak = getEmployeesOnBreak(time)}
			<div 
				class="time-slot" 
				class:has-breaks={onBreak.length > 0}
				class:drag-over={dragOverSlot === time}
				data-time={time}
				ondragover={(e) => { e.preventDefault(); dragOverSlot = time; checkAutoScroll(e.clientY); }}
				ondragleave={() => { dragOverSlot = null; stopAutoScroll(); }}
				ondrop={(e) => { stopAutoScroll(); handleDrop(e, time); }}
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
								<EmployeeCard 
									variant="break" 
									name={emp.name} 
									color={posColors[emp.position] || '#94a3b8'} 
									draggable="true"
									isDragging={draggedId === emp.id}
									ondragstart={(e: DragEvent) => handleDragStart(e, emp.id)}
									ontouchstart={() => handleTouchStart(emp.id)}
									ontouchmove={handleTouchMove}
									ontouchend={handleTouchEnd}
								/>
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
		width: 100%;
	}

	.unassigned-section {
		margin-bottom: 32px;
		padding: 24px;
		background: rgba(14, 79, 132, 0.03);
		border: 2px dashed var(--border-subtle);
		border-radius: var(--radius-lg);
		width: 100%;
	}
	.section-title { font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
	.unassigned-tags { 
		display: grid !important;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 12px !important;
		align-items: start;
	}

	.range-inputs { display: flex; gap: 20px; }
	
	.break-grid {
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: var(--radius-lg);
		border: 1.5px solid var(--border-subtle);
		overflow: hidden;
		box-shadow: var(--shadow-md);
		width: 100%;
	}

	.time-slot {
		display: flex;
		border-bottom: 1px solid var(--border-subtle);
		min-height: 64px;
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

	@media (max-width: 600px) {
		.slot-time { width: 60px; font-size: 11px; }
	}
</style>

