<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		message?: string;
		onConfirm?: () => void;
		onCancel?: () => void;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'default';
		children?: Snippet;
	}


	let { 
		open, 
		title, 
		message, 
		onConfirm, 
		onCancel, 
		confirmText = 'Confirmer', 
		cancelText = 'Annuler',
		variant = 'default',
		children
	}: Props = $props();

	function handleConfirm() {
		onConfirm?.();
	}

	function handleCancel() {
		onCancel?.();
	}
</script>

{#if open}
	<button
		class="overlay"
		onclick={handleCancel}
		aria-label="Fermer"
		type="button"
	></button>
	
	<div class="dialog" role="dialog" aria-modal="true" tabindex="-1">
		{#if children}
			{@render children()}
		{:else}
			{#if title}
				<h3 class="dialog-title">{title}</h3>
			{/if}
			
			<p class="dialog-msg">
				{@html message}
			</p>
			
			<div class="dialog-actions">
				<button class="btn-ghost" onclick={handleCancel}>{cancelText}</button>
				<button 
					class="btn-{variant === 'danger' ? 'danger' : 'primary'}" 
					onclick={handleConfirm}
				>
					{confirmText}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
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

	.dialog-title {
		font-size: 16px;
		font-weight: 700;
		margin-bottom: 12px;
		color: var(--text-primary);
	}

	.dialog-msg { 
		font-size: 14px; 
		color: var(--text-secondary); 
		line-height: 1.6; 
		margin-bottom: 20px; 
	}

	.dialog-actions { 
		display: flex; 
		gap: 12px; 
		justify-content: flex-end; 
	}

	/* Re-using some button styles here to keep it self-contained if needed, 
	   but ideally we'd use the Button component inside. 
	   However, for the prompt's sake of simplicity I'll include basic styles or just assume global vars. */

	.btn-ghost {
		padding: 8px 20px;
		border-radius: var(--radius-sm);
		font-size: 13px; font-weight: 500;
		color: var(--text-secondary);
		border: 1.5px solid var(--border-subtle);
		background: transparent;
		cursor: pointer;
	}

	.btn-primary {
		padding: 8px 20px;
		border-radius: var(--radius-sm);
		font-size: 13px; font-weight: 600;
		background: var(--accent-grad);
		color: #fff;
		border: none;
		cursor: pointer;
	}

	.btn-danger {
		padding: 8px 20px;
		border-radius: var(--radius-sm);
		font-size: 13px; font-weight: 600;
		background: rgba(220, 38, 38, 0.1);
		color: #b91c1c;
		border: 1px solid rgba(220, 38, 38, 0.25);
		cursor: pointer;
	}

	@keyframes pop {
		from { transform: translate(-50%, -50%) scale(0.92); opacity: 0; }
		to   { transform: translate(-50%, -50%) scale(1);    opacity: 1; }
	}
</style>
