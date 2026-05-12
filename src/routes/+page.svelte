<script lang="ts">
	import { employees, POSITIONS, workedMinutes, fmtDuration, addMinutes } from '$lib/stores/schedule';
	import { get } from 'svelte/store';
	import { Card, Input, Select, Button, EmployeeCard, Dialog, Dropdown, DropdownItem } from '$lib';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	// ── Form state ───────────────────────────────────────────────
	let name = $state('');
	let position = $state('Patrouilleur');
	let startTime = $state('08:00');
	let endTime = $state('16:00');
	let error = $state('');
	let nameInput = $state<HTMLInputElement>();
	let focusKey = $state(0);

	import { tick } from 'svelte';

	// Reactive focus manager
	$effect(() => {
		if (focusKey > 0) {
			nameInput?.focus();
			requestAnimationFrame(() => nameInput?.focus());
			const t = setTimeout(() => nameInput?.focus(), 50);
			return () => clearTimeout(t);
		}
	});

	function handleEnhance({ formData }: any) {
		const currentName = name.trim();
		if (!currentName) return;
		const prev = get(employees);
		employees.add({ name: currentName, position, startTime, endTime });
		name = '';
		focusKey++;
		return async ({ result, update }: { result: ActionResult, update: any }) => {
			if (result.type !== 'success' && result.type !== 'redirect') employees.set(prev);
			await update({ reset: false });
			await tick();
			focusKey++;
		};
	}

	function validateTimes(): boolean {
		if (!position) { error = 'Veuillez sélectionner un poste.'; return false; }
		const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
		if (!timeRe.test(startTime) || !timeRe.test(endTime)) {
			error = 'Format invalide. Utilisez HH:MM (ex. 08:00, 16:30).'; return false;
		}
		const [sh, sm] = startTime.split(':').map(Number);
		const [eh, em] = endTime.split(':').map(Number);
		const s = sh * 60 + sm, e = eh * 60 + em;
		if (e <= s) { error = "L'heure de fin doit être après l'heure de début."; return false; }
		if (e - s <= 30) { error = 'Le quart doit durer plus de 30 minutes.'; return false; }
		error = ''; return true;
	}





	// Delete with confirmation state
	let pendingDelete = $state<string | null>(null);
	function requestDelete(id: string) { pendingDelete = id; }
	function confirmDelete() {
		if (pendingDelete) { employees.remove(pendingDelete); pendingDelete = null; }
	}
	function cancelDelete() { pendingDelete = null; }



	// Position badge colors
	const posColors: Record<string, string> = {
		Patrouilleur: '#fde047',
		Assistant: '#1d4ed8',
		Sauveteur: '#16a34a',
		"Chef d'équipe": '#6042b0',
	};
	function posColor(pos: string): string {
		return posColors[pos] ?? '#94a3b8';
	}


	// Svelte action: focus element on mount
	function focusOnMount(node: HTMLElement) {
		node.focus();
	}
</script>

<svelte:head>
	<title>Planificateur de quarts — Voiles en Voiles</title>
	<meta name="description" content="Outil superviseur pour assigner les quarts de travail et les pauses des employés d'été." />
</svelte:head>

	<main class="main-grid">
		<!-- ── Entry Form ─────────────────────────────────── -->
		<Card title="Ajouter un quart" class="form-card">
			<form class="form" method="POST" action="?/add" use:enhance={handleEnhance}>
				<!-- Name input -->
				<div class="field">
					<label class="label" for="emp-name">Employé</label>
					<div class="name-input">
						{#key focusKey}
							<Input
								id="emp-name"
								name="name"
								type="text"
								placeholder="Nom de l'employé"
								bind:value={name}
								bind:ref={nameInput}
								autocomplete="off"
								required
								autofocus
							/>
						{/key}
					</div>
				</div>

				<!-- Position -->
				<div class="field">
					<label class="label" for="emp-position">Poste</label>
					<input type="hidden" name="position" value={position} />
					<Dropdown 
						id="emp-position"
						label={position || 'Choisir un poste…'} 
						class="w-full"
						triggerClass="w-full"
					>
						{#each POSITIONS as pos}
							<DropdownItem onclick={() => position = pos}>
								{pos}
							</DropdownItem>
						{/each}
					</Dropdown>
				</div>

				<!-- Times row -->
				<div class="time-row">
					<Input id="emp-start" name="startTime" label="Début" variant="time" placeholder="HH:MM" maxlength={5} bind:value={startTime} />
					<Input id="emp-end" name="endTime" label="Fin" variant="time" placeholder="HH:MM" maxlength={5} bind:value={endTime} />
				</div>

				{#if error}
					<p class="error-msg" role="alert">{error}</p>
				{/if}

				<Button 
					id="add-employee-btn" 
					type="submit"
				>
					Ajouter l'employé
				</Button>
			</form>
		</Card>

		<!-- ── Employee List ──────────────────────────────── -->
		<Card title="Employés aujourd'hui" class="list-card">
			{#if $employees.length === 0}
				<div class="empty-state">
					<p>Aucun employé ajouté pour l'instant.</p>
					<p class="empty-hint">Utilisez le formulaire pour ajouter un premier quart.</p>
				</div>
			{:else}
				<ul class="emp-list">
					{#each $employees as emp (emp.id)}
						<li>
							<EmployeeCard 
								name={emp.name} 
								position={emp.position} 
								startTime={emp.startTime} 
								endTime={emp.endTime} 
								color={posColor(emp.position)} 
								onDelete={() => requestDelete(emp.id)} 
							/>
						</li>
					{/each}
				</ul>

				{#if $employees.length > 0}
					<div class="list-footer">
						<Button variant="ghost-danger" onclick={() => requestDelete('__all__')}>
							Tout effacer
						</Button>
					</div>
				{/if}
			{/if}
		</Card>
	</main>


<!-- Delete confirmation dialog -->
<Dialog 
	open={!!pendingDelete} 
	variant="danger"
	confirmText="Retirer"
	onCancel={cancelDelete}
>
	<p class="dialog-msg">
		{#if pendingDelete === '__all__'}
			Retirer <strong>tous les employés</strong> de la liste d'aujourd'hui ?
		{:else}
			Retirer <strong>{$employees.find(e => e.id === pendingDelete)?.name}</strong> de la liste ?
		{/if}
	</p>
	<div class="dialog-actions">
		<Button variant="ghost" onclick={cancelDelete}>Annuler</Button>
		<form method="POST" action={pendingDelete === '__all__' ? '?/clear' : '?/remove'} use:enhance={({ formData }) => {
			const prev = get(employees);
			const idToDelete = formData.get('id') as string;
			
			// Optimistic Update
			if (pendingDelete === '__all__') employees.clear();
			else if (idToDelete) employees.remove(idToDelete);
			
			pendingDelete = null;

			return async ({ result, update }) => {
				if (result.type !== 'success' && result.type !== 'redirect') {
					employees.set(prev);
				}
				await update();
			};
		}}>
			{#if pendingDelete !== '__all__'}
				<input type="hidden" name="id" value={pendingDelete} />
			{/if}
			<Button variant="danger" type="submit">Retirer</Button>
		</form>
	</div>
</Dialog>




<style>
/* ── Grid ───────────────────────────────────────────────────────────── */
.main-grid {
	max-width: 1600px;
	width: 95%;
	margin: 32px auto;
	padding: 0 24px 48px;
	display: grid;
	grid-template-columns: 420px 1fr;
	gap: 24px;
	align-items: start;
}
@media (max-width: 820px) {
	.main-grid { grid-template-columns: 1fr; }
}


/* ── Form ───────────────────────────────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label {
	font-size: 12px; font-weight: 600;
	color: var(--text-secondary);
	letter-spacing: 0.05em;
	text-transform: uppercase;
}
.time-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	align-items: end;
}

:global(.w-full) { width: 100% !important; }

/* ── Error ──────────────────────────────────────────────────────────── */
.error-msg {
	font-size: 12px;
	color: #b91c1c;
	background: rgba(220, 38, 38, 0.06);
	border: 1px solid rgba(220, 38, 38, 0.25);
	border-radius: var(--radius-sm);
	padding: 10px 14px;
}

/* ── Employee list ──────────────────────────────────────────────────── */
.empty-state {
	text-align: center;
	padding: 48px 0;
	color: var(--text-muted);
}
.empty-hint { font-size: 12px; margin-top: 4px; }

.emp-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

.list-footer {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px solid var(--border-subtle);
	display: flex;
	justify-content: flex-end;
}

.dialog-msg { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.dialog-msg strong { color: var(--text-primary); }
.dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
</style>

