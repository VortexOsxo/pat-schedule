<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		class?: string;
		children?: import('svelte').Snippet;
		icon?: import('svelte').Snippet;
		danger?: boolean;
	}

	let { 
		class: className = '', 
		children, 
		icon,
		danger = false,
		...rest 
	}: Props = $props();
</script>

<button 
	type="button" 
	class="dropdown-item {danger ? 'danger' : ''} {className}" 
	{...rest}
>
	{#if icon}
		<span class="icon">{@render icon()}</span>
	{/if}
	<span class="label">{@render children?.()}</span>
</button>

<style>
	.dropdown-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: 500;
		text-align: left;
		transition: all var(--transition);
		border: none;
		background: transparent;
		cursor: pointer;
		white-space: nowrap;
	}

	.dropdown-item:hover {
		background: var(--bg-hover);
		color: var(--accent-primary);
		transform: translateX(4px);
	}

	.dropdown-item.danger {
		color: var(--color-danger);
	}

	.dropdown-item.danger:hover {
		background: rgba(220, 38, 38, 0.08);
		color: var(--color-danger);
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	:global(.icon svg) {
		width: 100%;
		height: 100%;
	}
</style>
