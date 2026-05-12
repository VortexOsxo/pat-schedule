<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		class?: string;
		containerClass?: string;
		variant?: 'default' | 'range' | 'time';
		value?: string | number;
	}

	let { 
		label, 
		error, 
		class: className = '', 
		containerClass = '', 
		variant = 'default',
		value = $bindable(),
		...rest 
	}: Props = $props();

	function handleBlur(e: FocusEvent) {
		if (variant === 'time' && typeof value === 'string') {
			let val = value.trim();
			if (!val) return;

			// Smart format: 17 -> 17:00
			if (/^\d{1,2}$/.test(val)) {
				let h = parseInt(val);
				if (h >= 0 && h <= 23) {
					value = `${h.toString().padStart(2, '0')}:00`;
				}
			}
			// Smart format: 1730 -> 17:30
			else if (/^\d{3,4}$/.test(val)) {
				let h = parseInt(val.slice(0, val.length - 2));
				let m = parseInt(val.slice(val.length - 2));
				if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
					value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
				}
			}
		}
		// Call original onblur if provided
		if (rest.onblur) {
			(rest.onblur as any)(e);
		}
	}
</script>


<div class="field {variant} {containerClass}">
	{#if label}
		<label class="label" for={rest.id}>{label}</label>
	{/if}
	
	<div class="input-wrapper">
		<input 
			class="input {variant} {className}" 
			bind:value={value}
			onblur={handleBlur}
			{...rest}
		/>

		{#if variant === 'range'}
			<span class="suffix">h</span>
		{/if}
	</div>

	{#if error}
		<p class="error-msg" role="alert">{error}</p>
	{/if}
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

	.input-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.input {
		background: #fff;
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

	/* Variants */
	.range .input {
		width: 50px;
		padding: 4px 8px;
		font-weight: 700;
		color: var(--accent-primary);
		text-align: center;
	}

	.range .label {
		text-transform: none;
		letter-spacing: normal;
		font-size: 13px;
	}

	.range .suffix {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.time .input {
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	.error-msg {
		font-size: 12px;
		color: #b91c1c;
		background: rgba(220, 38, 38, 0.06);
		border: 1px solid rgba(220, 38, 38, 0.25);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
	}
</style>
