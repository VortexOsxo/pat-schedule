<script lang="ts">
	import { setContext, getContext } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import { clickOutside } from '$lib/actions/clickOutside';

	interface Props {
		id?: string;
		label?: string;
		align?: 'left' | 'right';
		class?: string;
		triggerClass?: string;
		menuClass?: string;
		children?: import('svelte').Snippet;
		trigger?: import('svelte').Snippet;
	}

	let { 
		id,
		label = 'Select', 
		align = 'left', 
		class: className = '', 
		triggerClass = '',
		menuClass = '',
		children,
		trigger
	}: Props = $props();

	let isOpen = $state(false);

	function toggle() {
		isOpen = !isOpen;
	}

	function close() {
		isOpen = false;
	}
</script>

<div class="dropdown {className}" use:clickOutside={close}>
	<div class="trigger-wrapper">
		{#if trigger}
			{@render trigger()}
		{:else}
			<button 
				{id}
				type="button" 
				class="dropdown-trigger {triggerClass}" 
				onclick={toggle}
				aria-expanded={isOpen}
				aria-haspopup="true"
			>
				<span>{label}</span>
				<svg 
					xmlns="http://www.w3.org/2000/svg" 
					viewBox="0 0 20 20" 
					fill="currentColor" 
					class="chevron"
					class:open={isOpen}
				>
					<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
				</svg>
			</button>
		{/if}
	</div>

	{#if isOpen}
		<div 
			class="dropdown-menu {align} {menuClass}"
			in:scale={{ duration: 150, start: 0.95, opacity: 0 }}
			out:fade={{ duration: 100 }}
			role="menu"
			tabindex="-1"
			onclick={close}
			onkeydown={(e) => { if (e.key === 'Escape') close(); }}
		>
			<div class="menu-content">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.trigger-wrapper {
		display: flex;
		width: 100%;
	}
	
	.dropdown-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 10px 16px;
		background: var(--bg-surface);
		border: 1.5px solid var(--border-subtle);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-weight: 500;
		font-size: 14px;
		transition: all var(--transition);
		box-shadow: var(--shadow-sm);
		width: 100%;
	}

	.dropdown-trigger:hover {
		border-color: var(--accent-primary);
		background: var(--bg-elevated);
		box-shadow: var(--shadow-md);
	}

	.chevron {
		width: 18px;
		height: 18px;
		transition: transform var(--transition);
		color: var(--text-muted);
	}

	.chevron.open {
		transform: rotate(180deg);
		color: var(--accent-primary);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		z-index: 50;
		min-width: 200px;
		background: var(--bg-glass);
		border: 1.5px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		transform-origin: top;
	}

	.dropdown-menu.left { left: 0; }
	.dropdown-menu.right { right: 0; }

	.menu-content {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	/* CSS for children/items is handled by the parent or by another component, 
	   but we can provide some defaults for convenience if they use <a> or <button> */
	:global(.dropdown-item) {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 14px;
		font-weight: 500;
		text-align: left;
		transition: all var(--transition);
		border: none;
		background: transparent;
		cursor: pointer;
	}

	:global(.dropdown-item:hover) {
		background: var(--accent-primary);
		color: white;
	}

	:global(.dropdown-item svg) {
		width: 18px;
		height: 18px;
		opacity: 0.7;
	}

	:global(.dropdown-divider) {
		height: 1px;
		background: var(--border-subtle);
		margin: 6px -6px;
	}
</style>
