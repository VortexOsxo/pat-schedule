<script lang="ts">
	import { employees, POSITIONS, workedMinutes, fmtDuration, addMinutes } from '$lib/stores/schedule';


	// ── Form state ───────────────────────────────────────────────
	let names = $state(['']);
	let position = $state('Patrouilleur');
	let startTime = $state('08:00');
	let endTime = $state('16:00');
	let breakTime = $state('12:00');
	let error = $state('');
	let successAnim = $state(false);
	let successCount = $state(0);

	function addNameField() { names = [...names, '']; }
	function removeName(i: number) { names = names.filter((_, idx) => idx !== i); }

	function handleSubmit() {
		const valid = names.map(n => n.trim()).filter(Boolean);
		if (!valid.length) { error = 'Entrez au moins un nom.'; return; }
		if (!validateTimes()) return;
		valid.forEach(n => employees.add({ name: n, position, startTime, endTime, breakTime }));
		successCount = valid.length;
		successAnim = true;
		setTimeout(() => { successAnim = false; successCount = 0; }, 800);
		names = [''];
	}

	function validateTimes(): boolean {
		if (!position) { error = 'Veuillez sélectionner un poste.'; return false; }
		const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
		if (!timeRe.test(startTime) || !timeRe.test(endTime) || !timeRe.test(breakTime)) {
			error = 'Format invalide. Utilisez HH:MM (ex. 08:00, 16:30).'; return false;
		}
		const [sh, sm] = startTime.split(':').map(Number);
		const [eh, em] = endTime.split(':').map(Number);
		const [bh, bm] = breakTime.split(':').map(Number);
		const s = sh * 60 + sm, e = eh * 60 + em, b = bh * 60 + bm;
		if (e <= s) { error = "L'heure de fin doit être après l'heure de début."; return false; }
		if (e - s <= 30) { error = 'Le quart doit durer plus de 30 minutes.'; return false; }
		if (b < s || b + 30 > e) { error = 'La pause doit être à l\'intérieur du quart.'; return false; }
		error = ''; return true;
	}



	// Break time boundary helpers
	const breakMin = $derived(startTime);
	const breakMax = $derived(
		!endTime
			? ''
			: (() => {
					const [h, m] = endTime.split(':').map(Number);
					const total = h * 60 + m - 30;
					return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
				})()
	);

	// Delete with confirmation state
	let pendingDelete = $state<string | null>(null);
	function requestDelete(id: string) { pendingDelete = id; }
	function confirmDelete() {
		if (pendingDelete) { employees.remove(pendingDelete); pendingDelete = null; }
	}
	function cancelDelete() { pendingDelete = null; }

	// Inline break-time editing
	let editingBreakId = $state<string | null>(null);
	let editingBreakValue = $state('');

	function startEditBreak(emp: { id: string; breakTime: string }) {
		editingBreakId = emp.id;
		editingBreakValue = emp.breakTime;
	}

	function commitBreak(id: string, startT: string, endT: string) {
		const [bh, bm] = editingBreakValue.split(':').map(Number);
		const [sh, sm] = startT.split(':').map(Number);
		const [eh, em] = endT.split(':').map(Number);
		const b = bh * 60 + bm, s = sh * 60 + sm, e = eh * 60 + em;
		if (b >= s && b + 30 <= e) {
			employees.update(id, { breakTime: editingBreakValue });
		}
		editingBreakId = null;
	}

	function onBreakKeydown(e: KeyboardEvent, id: string, startT: string, endT: string) {
		if (e.key === 'Enter') commitBreak(id, startT, endT);
		if (e.key === 'Escape') editingBreakId = null;
	}

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

<div class="app">
	<!-- Header -->
	<header class="app-header">
		<div class="header-inner">
			<div class="brand">

				<div>
					<h1 class="brand-title">Planificateur de quarts</h1>
					<p class="brand-sub">Voiles en Voiles — Vue superviseur</p>
				</div>
			</div>
			<div class="header-stat">
				<span class="stat-num">{$employees.length}</span>
				<span class="stat-label">employé{$employees.length !== 1 ? 's' : ''}</span>
			</div>
		</div>
	</header>

	<main class="main-grid">
		<!-- ── Entry Form ─────────────────────────────────── -->
		<section class="card form-card" aria-label="Ajouter un quart">
			<h2 class="card-title">Ajouter un quart</h2>

			<form class="form" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Name list -->
				<div class="field">
					<label class="label" for="emp-name-0">Employé{names.length > 1 ? 's' : ''}</label>
					<div class="name-list">
						{#each names as _, i}
							<div class="name-row">
								<span class="name-num">{i + 1}</span>
								<input
									id="emp-name-{i}"
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
				<div class="field">
					<label class="label" for="emp-position">Poste</label>
					<select id="emp-position" class="input select" bind:value={position}>
						<option value="" disabled selected>Choisir un poste…</option>
						{#each POSITIONS as pos}
							<option value={pos}>{pos}</option>
						{/each}
					</select>
				</div>

				<!-- Times row -->
				<div class="time-row">
					<div class="field">
						<label class="label" for="emp-start">Début</label>
						<input id="emp-start" class="input time-input" type="text" placeholder="HH:MM" maxlength="5" bind:value={startTime} />
					</div>
					<div class="field">
						<label class="label" for="emp-end">Fin</label>
						<input id="emp-end" class="input time-input" type="text" placeholder="HH:MM" maxlength="5" bind:value={endTime} />
					</div>
					<div class="field">
						<label class="label" for="emp-break">Pause</label>
						<input id="emp-break" class="input time-input" type="text" placeholder="HH:MM" maxlength="5" bind:value={breakTime} />
					</div>
				</div>

				{#if error}
					<p class="error-msg" role="alert">{error}</p>
				{/if}

				<button id="add-employee-btn" class="btn-primary" class:success={successAnim} type="submit">
					{#if successAnim}
						{successCount > 1 ? `✓ ${successCount} ajoutés !` : '✓ Ajouté !'}
					{:else}
						{names.filter(n => n.trim()).length > 1 ? 'Ajouter les employés' : "Ajouter l'employé"}
					{/if}
				</button>
			</form>
		</section>

		<!-- ── Employee List ──────────────────────────────── -->
		<section class="card list-card" aria-label="Employés aujourd'hui">
			<h2 class="card-title">Employés aujourd'hui</h2>

			{#if $employees.length === 0}
				<div class="empty-state">

					<p>Aucun employé ajouté pour l'instant.</p>
					<p class="empty-hint">Utilisez le formulaire pour ajouter un premier quart.</p>
				</div>
			{:else}
				<ul class="emp-list">
					{#each $employees as emp (emp.id)}
						<li class="emp-card" style="border-left-color:{posColor(emp.position)}">


							<div class="emp-info">
								<span class="emp-name">{emp.name}</span>
								<span class="emp-pos" style="color:{posColor(emp.position)}">{emp.position}</span>
								<div class="emp-spacer"></div>
								<div class="emp-times">
									<span class="time-chip">{emp.startTime} – {emp.endTime}</span>
									{#if editingBreakId === emp.id}
										<div class="break-edit-row">
											<input
												class="input time-input break-edit"
												type="text"
												placeholder="HH:MM"
												maxlength="5"
												bind:value={editingBreakValue}
												onblur={() => commitBreak(emp.id, emp.startTime, emp.endTime)}
												onkeydown={(e) => onBreakKeydown(e, emp.id, emp.startTime, emp.endTime)}
												use:focusOnMount
											/>
										</div>
									{:else}
										<button
											class="time-chip time-chip-btn"
											title="Modifier la pause"
											onclick={() => startEditBreak(emp)}
										>Pause {emp.breakTime}</button>
									{/if}
								</div>
							</div>

							<button
								class="delete-btn"
								title="Retirer {emp.name}"
								onclick={() => requestDelete(emp.id)}
								aria-label="Retirer {emp.name}"
							>×</button>
						</li>
					{/each}
				</ul>

				{#if $employees.length > 0}
					<div class="list-footer">
						<button class="btn-ghost-danger" onclick={() => requestDelete('__all__')}>
							Tout effacer
						</button>
					</div>
				{/if}
			{/if}
		</section>
	</main>
</div>

<!-- Delete confirmation dialog -->
{#if pendingDelete}
	<button
		class="overlay"
		onclick={cancelDelete}
		aria-label="Fermer"
		type="button"
	></button>
	<div class="dialog" role="dialog" aria-modal="true" tabindex="-1">
		<p class="dialog-msg">
			{#if pendingDelete === '__all__'}
				Retirer <strong>tous les employés</strong> de la liste d'aujourd'hui ?
			{:else}
				Retirer <strong>{$employees.find(e => e.id === pendingDelete)?.name}</strong> de la liste ?
			{/if}
		</p>
		<div class="dialog-actions">
			<button class="btn-ghost" onclick={cancelDelete}>Annuler</button>
			<button class="btn-danger" onclick={() => {
				if (pendingDelete === '__all__') { employees.clear(); pendingDelete = null; }
				else confirmDelete();
			}}>Retirer</button>
		</div>
	</div>
{/if}



<style>
/* ── Layout ─────────────────────────────────────────────────────────── */
.app {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: var(--bg-base);
}

/* ── Header ─────────────────────────────────────────────────────────── */
.app-header {
	background: var(--bg-glass);
	backdrop-filter: blur(20px);
	border-bottom: 1px solid var(--border-subtle);
	box-shadow: var(--shadow-sm);
	position: sticky; top: 0; z-index: 50;
}
.header-inner {
	max-width: 1100px;
	margin: 0 auto;
	padding: 16px 24px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.brand { display: flex; align-items: center; gap: 14px; }
.brand-title {
	font-size: 18px; font-weight: 700;
	background: var(--accent-grad);
	-webkit-background-clip: text; -webkit-text-fill-color: transparent;
	background-clip: text;
}
.brand-sub { font-size: 12px; color: var(--text-muted); margin-top: 1px; }
.header-stat { text-align: right; }
.stat-num {
	display: block;
	font-size: 28px; font-weight: 700;
	color: var(--accent-primary);
	line-height: 1;
}
.stat-label { font-size: 11px; color: var(--text-muted); }

/* ── Grid ───────────────────────────────────────────────────────────── */
.main-grid {
	max-width: 1100px;
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

/* ── Card ───────────────────────────────────────────────────────────── */
.card {
	background: var(--bg-surface);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	padding: 28px;
	box-shadow: var(--shadow-md);
}
.card-title {
	font-size: 15px; font-weight: 600;
	color: var(--text-primary);
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--border-subtle);
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
}
.name-remove:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
.add-name-btn {
	margin-top: 6px;
	font-size: 12px; font-weight: 600;
	color: var(--accent-primary);
	padding: 4px 0;
	text-align: left;
	transition: opacity var(--transition);
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
.select { appearance: none; cursor: pointer; background-color: var(--bg-elevated); }
.select option { background: #fff; }


.time-row {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 12px;
	align-items: end;
}
.time-input { text-align: center; font-variant-numeric: tabular-nums; }



/* ── Error ──────────────────────────────────────────────────────────── */
.error-msg {
	font-size: 12px;
	color: #b91c1c;
	background: rgba(220, 38, 38, 0.06);
	border: 1px solid rgba(220, 38, 38, 0.25);
	border-radius: var(--radius-sm);
	padding: 10px 14px;
}

/* ── Buttons ─────────────────────────────────────────────────────────  */
.btn-primary {
	width: 100%;
	padding: 12px;
	border-radius: var(--radius-sm);
	font-size: 14px; font-weight: 600;
	background: var(--accent-grad);
	color: #fff;
	transition: opacity var(--transition), transform var(--transition), box-shadow var(--transition);
	box-shadow: 0 4px 14px rgba(14, 79, 132, 0.25);
	letter-spacing: 0.02em;
}
.btn-primary:hover { opacity: 0.9; box-shadow: var(--shadow-glow); transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
.btn-primary.success { background: linear-gradient(135deg, #059669, #047857); box-shadow: 0 4px 14px rgba(5,150,105,0.3); }

.btn-ghost {
	padding: 8px 20px;
	border-radius: var(--radius-sm);
	font-size: 13px; font-weight: 500;
	color: var(--text-secondary);
	border: 1.5px solid var(--border-subtle);
	transition: background var(--transition), color var(--transition), border-color var(--transition);
}
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-accent); }

.btn-ghost-danger {
	padding: 8px 16px;
	border-radius: var(--radius-sm);
	font-size: 12px; font-weight: 500;
	color: var(--text-muted);
	border: 1px solid transparent;
	transition: color var(--transition), border-color var(--transition);
}
.btn-ghost-danger:hover { color: #dc2626; border-color: rgba(220, 38, 38, 0.3); }

.btn-danger {
	padding: 8px 20px;
	border-radius: var(--radius-sm);
	font-size: 13px; font-weight: 600;
	background: rgba(220, 38, 38, 0.1);
	color: #b91c1c;
	border: 1px solid rgba(220, 38, 38, 0.25);
	transition: background var(--transition);
}
.btn-danger:hover { background: rgba(220, 38, 38, 0.18); }

/* ── Employee list ──────────────────────────────────────────────────── */
.empty-state {
	text-align: center;
	padding: 48px 0;
	color: var(--text-muted);
}
.empty-hint { font-size: 12px; margin-top: 4px; }

.emp-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

.emp-card {
	display: flex; align-items: center; gap: 8px;
	background: var(--bg-elevated);
	border: 1.5px solid var(--border-subtle);
	border-left: 4px solid transparent;
	border-radius: var(--radius-md);
	padding: 6px 12px;
	transition: border-color var(--transition), box-shadow var(--transition);
}
.emp-card:hover {
	border-color: var(--border-accent);
	box-shadow: 0 4px 16px rgba(14, 79, 132, 0.10);
}



.emp-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.emp-name { font-weight: 600; font-size: 13.5px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.emp-pos {
	font-size: 10.5px; font-weight: 700;
	letter-spacing: 0.04em;
	white-space: nowrap;
}
.emp-spacer { flex: 1; }

@media (max-width: 600px) {
	.emp-name { max-width: 120px; }
	.emp-spacer { display: none; }
	.emp-info { gap: 6px; }
}

.emp-times { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.time-chip {
	font-size: 10px;
	color: var(--text-secondary);
	background: #f1f5f9;
	border: 1px solid #e2e8f0;
	padding: 2px 7px;
	border-radius: 999px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}


.time-chip-btn {
	cursor: pointer;
	transition: background var(--transition), border-color var(--transition), color var(--transition);
}
.time-chip-btn:hover {
	background: rgba(14, 79, 132, 0.1);
	border-color: var(--accent-primary);
	color: var(--accent-primary);
}

.break-edit-row { flex-basis: 100%; display: flex; }
.break-edit {
	padding: 2px 10px;
	height: 26px;
	font-size: 11px;
	border-radius: 999px;
	width: 120px;
}

.delete-btn {
	opacity: 0;
	font-size: 15px;
	padding: 5px 8px;
	border-radius: var(--radius-sm);
	color: var(--text-muted);
	transition: opacity var(--transition), color var(--transition), background var(--transition);
	flex-shrink: 0;
}
.emp-card:hover .delete-btn { opacity: 1; }
.delete-btn:hover { color: #dc2626; background: rgba(220, 38, 38, 0.08); }

.list-footer {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px solid var(--border-subtle);
	display: flex;
	justify-content: flex-end;
}

/* ── Dialog / Overlay ───────────────────────────────────────────────── */
.overlay {
	position: fixed; inset: 0; z-index: 100;
	background: rgba(15, 23, 42, 0.4);
	backdrop-filter: blur(4px);
	border: none;
	width: 100%; height: 100%;
	cursor: default;
}
.dialog {
	position: fixed;
	top: 50%; left: 50%;
	transform: translate(-50%, -50%);
	z-index: 101;
	background: var(--bg-surface);
	border: 1px solid var(--border-subtle);
	border-radius: var(--radius-lg);
	padding: 28px;
	max-width: 380px; width: 90%;
	box-shadow: var(--shadow-lg);
	animation: pop 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
.dialog-msg { font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.dialog-msg strong { color: var(--text-primary); }
.dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }

@keyframes pop {
	from { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }
	to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
}
</style>
