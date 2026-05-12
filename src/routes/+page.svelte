<script lang="ts">
	import { employees, POSITIONS, workedMinutes, fmtDuration, addMinutes } from '$lib/stores/schedule';
	import { get } from 'svelte/store';
	import { Card, Input, Select, Button, EmployeeCard, Dialog } from '$lib';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	// ── Form state ───────────────────────────────────────────────
	let names = $state(['']);
	let position = $state('Patrouilleur');
	let startTime = $state('08:00');
	let endTime = $state('16:00');
	let error = $state('');
	let successAnim = $state(false);
	let successCount = $state(0);

	function addNameField() { names = [...names, '']; }
	function removeName(i: number) { names = names.filter((_, idx) => idx !== i); }

	function handleEnhance({ formData }: any) {
		// Optimistic Update
		const prev = get(employees);
		const newNames = (formData.getAll('names[]') as string[]).map(n => n.trim()).filter(Boolean);
		newNames.forEach(n => employees.add({ name: n, position, startTime, endTime }));

		// Local UI feedback
		successCount = newNames.length;
		successAnim = true;
		setTimeout(() => { successAnim = false; successCount = 0; }, 800);
		names = [''];

		return async ({ result, update }: { result: ActionResult, update: any }) => {
			if (result.type !== 'success' && result.type !== 'redirect') {
				// Rollback on error
				employees.set(prev);
			}
			await update();
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
				<!-- Name list -->
				<div class="field">
					<label class="label" for="emp-name-0">Employé{names.length > 1 ? 's' : ''}</label>
					<div class="name-list">
						{#each names as _, i}
							<div class="name-row">
								<span class="name-num">{i + 1}</span>
								<input
									id="emp-name-{i}"
									name="names[]"
									class="input name-input"
									type="text"
									placeholder="Nom de l'employé"
									bind:value={names[i]}
									autocomplete="off"
								/>
								{#if names.length > 1}
									<button type="button" class="name-remove" onclick={() => removeName(i)} aria-label="Retirer">×</button>
								{/if}
							</div>
						{/each}
					</div>
					<button type="button" class="add-name-btn" onclick={addNameField}>+ Ajouter un employé</button>
				</div>

				<!-- Position -->
				<Select 
					id="emp-position" 
					name="position"
					label="Poste" 
					bind:value={position}
					options={[
						{ value: '', label: 'Choisir un poste…' },
						...POSITIONS.map(pos => ({ value: pos, label: pos }))
					]}
				/>

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
					success={successAnim} 
					type="submit"
				>
					{#if successAnim}
						{successCount > 1 ? `✓ ${successCount} ajoutés !` : '✓ Ajouté !'}
					{:else}
						{names.filter(n => n.trim()).length > 1 ? 'Ajouter les employés' : "Ajouter l'employé"}
					{/if}
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

/* ── Name list ──────────────────────────────────────────────────────── */
.name-list { display: flex; flex-direction: column; gap: 6px; }
.name-row {
	display: flex; align-items: center; gap: 8px;
}
.name-num {
	font-size: 11px; font-weight: 700;
	color: var(--text-muted);
	min-width: 16px; text-align: right;
	flex-shrink: 0;
}
.name-input { flex: 1; }
.name-remove {
	font-size: 15px;
	color: var(--text-muted);
	padding: 4px 6px;
	border-radius: var(--radius-sm);
	transition: color var(--transition), background var(--transition);
	flex-shrink: 0;
	border: none;
	background: transparent;
	cursor: pointer;
}
.name-remove:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
.add-name-btn {
	margin-top: 6px;
	font-size: 12px; font-weight: 600;
	color: var(--accent-primary);
	padding: 4px 0;
	text-align: left;
	transition: opacity var(--transition);
	background: transparent;
	border: none;
	cursor: pointer;
}
.add-name-btn:hover { opacity: 0.75; }

/* ── Form ───────────────────────────────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label {
	font-size: 12px; font-weight: 600;
	color: var(--text-secondary);
	letter-spacing: 0.05em;
	text-transform: uppercase;
}
.input {
	background: var(--bg-elevated);
	border: 1.5px solid var(--border-subtle);
	border-radius: var(--radius-sm);
	color: var(--text-primary);
	padding: 10px 14px;
	font-size: 14px;
	transition: border-color var(--transition), box-shadow var(--transition);
	outline: none;
	width: 100%;
}
.input::placeholder { color: var(--text-muted); }
.input:focus {
	border-color: var(--accent-primary);
	box-shadow: 0 0 0 3px var(--accent-glow);
	background: #fff;
}

.time-row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
	align-items: end;
}

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

