<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { employees } from '$lib/stores/schedule';

	let { children } = $props();
</script>

<div class="app">
	<header class="app-header">
		<div class="header-inner">
			<div class="brand">
				<div>
					<h1 class="brand-title">Planificateur de quarts</h1>
					<p class="brand-sub">Voiles en Voiles — Vue superviseur</p>
				</div>
			</div>
			
			<nav class="nav">
				<a href="/" class="nav-link" class:active={page.url.pathname === '/'}>Saisie</a>
				<a href="/breaks" class="nav-link" class:active={page.url.pathname === '/breaks'}>Pauses</a>
			</nav>

			<div class="header-stat">
				<span class="stat-num">{$employees.length}</span>
				<span class="stat-label">employé{$employees.length !== 1 ? 's' : ''}</span>
			</div>
		</div>
	</header>

	{@render children()}
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-base);
	}

	.app-header {
		background: var(--bg-glass);
		backdrop-filter: blur(20px);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-sm);
		position: sticky; top: 0; z-index: 100;
	}

	.header-inner {
		max-width: 1400px;
		margin: 0 auto;
		padding: 12px 24px;
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
	.brand-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

	.nav { 
		display: flex; 
		gap: 6px; 
		margin: 0 32px; 
		background: rgba(14, 79, 132, 0.05);
		padding: 4px;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-subtle);
	}
	.nav-link {
		font-size: 13px; font-weight: 600;
		color: var(--text-secondary);
		text-decoration: none;
		padding: 6px 16px;
		border-radius: var(--radius-sm);
		transition: all var(--transition);
	}
	.nav-link:hover { color: var(--accent-primary); }
	.nav-link.active { 
		color: #fff; 
		background: var(--accent-primary); 
		box-shadow: var(--shadow-sm);
	}

	.header-stat { text-align: right; min-width: 80px; }
	.stat-num {
		display: block;
		font-size: 22px; font-weight: 700;
		color: var(--accent-primary);
		line-height: 1;
	}
	.stat-label { font-size: 10px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

	@media (max-width: 800px) {
		.header-inner { padding: 10px 16px; }
		.brand-sub { display: none; }
		.nav { margin: 0 12px; }
		.nav-link { padding: 6px 10px; font-size: 12px; }
		.stat-num { font-size: 18px; }
	}
</style>
