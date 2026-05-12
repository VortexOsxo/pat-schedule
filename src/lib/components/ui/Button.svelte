<script lang="ts">
	import { type HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'ghost' | 'danger' | 'ghost-danger' | 'regen';
		size?: 'sm' | 'md' | 'lg';
		success?: boolean;
		onclick?: (e: MouseEvent) => void;
	}

	let { 
		children, 
		variant = 'primary', 
		size = 'md', 
		success = false, 
		class: className = '',
		onclick,
		...rest 
	}: Props = $props();
</script>

<button 
	class="btn {variant} {size} {className}" 
	class:success 
	{onclick}
	{...rest}
>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border-radius: var(--radius-sm);
		font-weight: 600;
		transition: all var(--transition);
		cursor: pointer;
		border: 1.5px solid transparent;
		letter-spacing: 0.02em;
	}

	/* Sizes */
	.sm { padding: 4px 12px; font-size: 12px; }
	.md { padding: 10px 14px; font-size: 14px; }
	.lg { padding: 12px 24px; font-size: 16px; }

	/* Primary */
	.primary {
		background: var(--accent-grad);
		color: #fff;
		box-shadow: 0 4px 14px rgba(14, 79, 132, 0.25);
		border: none;
	}
	.primary:hover { opacity: 0.9; box-shadow: var(--shadow-glow); transform: translateY(-1px); }
	.primary:active { transform: translateY(0); }
	.primary.success { 
		background: linear-gradient(135deg, #059669, #047857); 
		box-shadow: 0 4px 14px rgba(5,150,105,0.3); 
	}

	/* Ghost */
	.ghost {
		color: var(--text-secondary);
		border-color: var(--border-subtle);
		background: transparent;
	}
	.ghost:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-accent); }

	/* Ghost Danger */
	.ghost-danger {
		color: var(--text-muted);
		background: transparent;
		border-color: transparent;
		font-size: 12px;
	}
	.ghost-danger:hover { color: #dc2626; border-color: rgba(220, 38, 38, 0.3); }

	/* Danger */
	.danger {
		background: rgba(220, 38, 38, 0.1);
		color: #b91c1c;
		border-color: rgba(220, 38, 38, 0.25);
	}
	.danger:hover { background: rgba(220, 38, 38, 0.18); }

	/* Regen (Special variant from positions page) */
	.regen {
		background: var(--bg-elevated);
		border-color: var(--border-subtle);
		color: var(--accent-primary);
		padding: 6px 16px;
		font-size: 13px;
	}
	.regen:hover {
		background: #fff;
		border-color: var(--accent-primary);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
</style>
