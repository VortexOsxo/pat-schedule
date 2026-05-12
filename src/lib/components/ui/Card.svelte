<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: string;
		children?: Snippet;
		footer?: Snippet;
		class?: string;
		variant?: 'default' | 'elevated' | 'stats';
	}

	let { title, children, footer, class: className = '', variant = 'default' }: Props = $props();
</script>


<section class="card {variant} {className}">
	{#if title}
		<h2 class="card-title">{title}</h2>
	{/if}
	
	<div class="card-content">
		{@render children?.()}
	</div>

	{#if footer}
		<footer class="card-footer">
			{@render footer()}
		</footer>
	{/if}
</section>

<style>
	.card {
		background: var(--bg-surface);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		padding: 28px;
		box-shadow: var(--shadow-md);
	}

	.card-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border-subtle);
	}

	/* Elevated variant (used in positions stats) */
	.elevated {
		background: var(--bg-elevated);
		padding: 16px;
		border-radius: 12px;
	}

	/* Stats specific styling if needed */
	.stats {
		padding: 16px;
		background: var(--bg-elevated);
		border: 1px solid var(--border-subtle);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.card-footer {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--border-subtle);
		display: flex;
		justify-content: flex-end;
	}

	:global(.stats .card-title) {
		font-weight: 800;
		font-size: 14px;
		color: var(--text-primary);
		border-bottom: 1.5px solid var(--border-subtle);
		padding-bottom: 8px;
		margin-bottom: 12px;
	}
</style>
