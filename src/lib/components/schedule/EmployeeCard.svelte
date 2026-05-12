<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		name: string;
		position?: string;
		startTime?: string;
		endTime?: string;
		color?: string;
		onBreak?: boolean;
		isDragging?: boolean;
		onDelete?: () => void;
		variant?: 'list' | 'grid' | 'break';
		class?: string;
	}

	let { 
		name, 
		position, 
		startTime, 
		endTime, 
		color = '#94a3b8', 
		onBreak = false, 
		isDragging = false,
		onDelete, 
		variant = 'list',
		class: className = '',
		...rest
	}: Props = $props();
</script>

<div 
	class="emp-card {variant} {className}" 
	style="border-left-color: {color}"
	class:is-on-break={onBreak}
	class:is-dragging={isDragging}
	{...rest}
>

	<div class="emp-info">
		<span class="emp-name">{name}</span>
		{#if position && variant === 'list'}
			<span class="emp-pos" style="color: {color}">{position}</span>
		{/if}
		
		{#if variant === 'list'}
			<div class="emp-spacer"></div>
			{#if startTime && endTime}
				<div class="emp-times">
					<span class="time-chip">{startTime} – {endTime}</span>
				</div>
			{/if}
		{/if}
	</div>

	{#if onDelete && variant === 'list'}
		<button
			class="delete-btn"
			title="Retirer {name}"
			onclick={onDelete}
			aria-label="Retirer {name}"
		>×</button>
	{/if}
</div>

<style>
	.emp-card {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--bg-elevated);
		border: 1.5px solid var(--border-subtle);
		border-left: 4px solid transparent;
		border-radius: var(--radius-md);
		padding: 6px 12px;
		transition: border-color var(--transition), box-shadow var(--transition);
		width: 100%;
	}

	.emp-card:hover {
		border-color: var(--border-accent);
		box-shadow: 0 4px 16px rgba(14, 79, 132, 0.10);
	}

	.emp-info {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.emp-name {
		font-weight: 600;
		font-size: 13.5px;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.emp-pos {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.04em;
		white-space: nowrap;
	}

	.emp-spacer { flex: 1; }

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

	.delete-btn {
		opacity: 0;
		font-size: 15px;
		padding: 5px 8px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		transition: opacity var(--transition), color var(--transition), background var(--transition);
		flex-shrink: 0;
		border: none;
		background: transparent;
		cursor: pointer;
	}

	.emp-card:hover .delete-btn { opacity: 1; }
	.delete-btn:hover { color: #dc2626; background: rgba(220, 38, 38, 0.08); }

	/* Grid variant specific (used in positions) */
	.grid {
		background: #fff;
		border-radius: 6px;
		padding: 8px 12px;
		box-shadow: var(--shadow-sm);
	}

	.grid .emp-name {
		font-size: 14px;
		font-weight: 700;
	}

	.is-on-break {
		background: #f1f5f9;
		border-color: #cbd5e1;
		opacity: 0.7;
	}

	.is-dragging { 
		opacity: 0.4; 
		transform: scale(0.95); 
		touch-action: none;
	}

	/* Break variant (draggable tags in breaks page) */
	.break {
		background: #fff;
		border: 1px solid var(--border-subtle);
		border-left: 4px solid #94a3b8;
		border-radius: 6px;
		padding: 6px 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: var(--shadow-sm);
		width: fit-content;
		min-width: 160px;
		max-width: 240px;
		flex-shrink: 0;
		cursor: grab;
		transition: transform 0.1s, opacity 0.1s;
		touch-action: none;
	}
	.break:active { cursor: grabbing; }

	.break .emp-name {
		font-size: 14px;
		font-weight: 700;
	}

	@media (max-width: 600px) {
		.list .emp-name { max-width: 120px; }
		.list .emp-spacer { display: none; }
		.list .emp-info { gap: 6px; }
		
		.grid { padding: 4px 6px; border-left-width: 3px; }
		.grid .emp-name { font-size: 11px; }

		.break { min-width: 0; flex: 1; }
	}
</style>

