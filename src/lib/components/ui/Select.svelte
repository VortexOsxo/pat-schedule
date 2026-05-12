<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends HTMLSelectAttributes {
		label?: string;
		options: { value: string | number; label: string }[];
		class?: string;
		containerClass?: string;
		variant?: 'default' | 'compact';
		value?: string | number;
	}

	let { 
		label, 
		options, 
		class: className = '', 
		containerClass = '', 
		variant = 'default',
		value = $bindable(),
		...rest 
	}: Props = $props();
</script>

<div class="field {variant} {containerClass}">
	{#if label}
		<label class="label" for={rest.id}>{label}</label>
	{/if}
	
	<select 
		class="select {variant} {className}" 
		bind:value={value}
		{...rest}
	>

		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.select {
		background: var(--bg-elevated);
		border: 1.5px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		padding: 10px 14px;
		font-size: 14px;
		transition: border-color var(--transition), box-shadow var(--transition);
		outline: none;
		width: 100%;
		appearance: none;
		cursor: pointer;
	}

	.select:focus {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 3px var(--accent-glow);
		background: #fff;
	}

	.compact .select {
		padding: 4px 12px;
		font-weight: 700;
		color: var(--accent-primary);
		background: #fff;
		width: auto;
	}

	.compact .label {
		text-transform: none;
		letter-spacing: normal;
		font-size: 13px;
	}

	option { background: #fff; }
</style>
