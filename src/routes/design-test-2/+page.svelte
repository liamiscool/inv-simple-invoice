<script lang="ts">
	// Variation 2: cobalt.tools inspired - technical, refined, dark accents
	let processingTime = 0.82;
	let invoicesSent = 1247;
	let uptime = 99.9;

	function formatCurrency(num: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0
		}).format(num);
	}
</script>

<svelte:head>
	<title>Design Test 2 - Cobalt Inspired</title>
</svelte:head>

<div class="design-2">
	<!-- Header -->
	<header class="header">
		<div class="container">
			<div class="header-content">
				<div class="logo-area">
					<div class="logo">inv</div>
					<div class="version">v2.0</div>
				</div>
				<nav class="nav">
					<a href="#" class="nav-link">Dashboard</a>
					<a href="#" class="nav-link">Invoices</a>
					<a href="#" class="nav-link">Clients</a>
					<a href="#" class="nav-link">API</a>
					<button class="btn-secondary">Sign In</button>
				</nav>
			</div>
		</div>
	</header>

	<!-- Hero -->
	<section class="hero">
		<div class="container">
			<div class="hero-badge">
				<span class="badge-dot"></span>
				<span>Production Ready</span>
			</div>
			<h1 class="hero-title">
				Professional invoicing<br />
				for technical teams
			</h1>
			<p class="hero-desc">
				API-first invoice generation with custom template support.<br />
				Built for developers who care about design.
			</p>
			<div class="hero-actions">
				<button class="btn-primary-large">Get Started</button>
				<button class="btn-ghost">
					<span>Read Docs</span>
					<span class="arrow">→</span>
				</button>
			</div>

			<!-- Code Preview -->
			<div class="code-block">
				<div class="code-header">
					<div class="code-dots">
						<span class="dot"></span>
						<span class="dot"></span>
						<span class="dot"></span>
					</div>
					<div class="code-title">invoice.ts</div>
					<button class="code-copy">Copy</button>
				</div>
				<pre class="code-content"><code>import inv from '@inv/sdk';

const invoice = await inv.create({
  client: 'acme-corp',
  template: 'minimal-dark',
  items: [
    { desc: 'Brand Identity', amount: 4200 },
    { desc: 'UI/UX Design', amount: 3800 }
  ],
  dueDate: '2025-02-15'
});

await invoice.send();</code></pre>
			</div>
		</div>
	</section>

	<!-- Metrics -->
	<section class="metrics">
		<div class="container">
			<div class="metrics-grid">
				<div class="metric">
					<div class="metric-value">{processingTime}s</div>
					<div class="metric-label">Avg. Generation Time</div>
					<div class="metric-change positive">↑ 23% faster</div>
				</div>
				<div class="metric">
					<div class="metric-value">{invoicesSent.toLocaleString()}</div>
					<div class="metric-label">Invoices Generated</div>
					<div class="metric-change">{formatCurrency(invoicesSent * 42)} total value</div>
				</div>
				<div class="metric">
					<div class="metric-value">{uptime}%</div>
					<div class="metric-label">Uptime</div>
					<div class="metric-change positive">Last 30 days</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Dashboard Section -->
	<section class="dashboard-section">
		<div class="container">
			<div class="section-header">
				<h2 class="section-title">Invoice Management</h2>
				<div class="section-actions">
					<button class="btn-outline">Filter</button>
					<button class="btn-outline">Export</button>
					<button class="btn-accent">+ New Invoice</button>
				</div>
			</div>

			<div class="table-container">
				<table class="data-table">
					<thead>
						<tr>
							<th>Invoice</th>
							<th>Client</th>
							<th>Amount</th>
							<th>Status</th>
							<th>Date</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						<tr class="table-row">
							<td>
								<div class="cell-primary">INV-2025-0089</div>
							</td>
							<td>
								<div class="client-cell">
									<div class="client-avatar">A</div>
									<div class="client-name">Acme Corporation</div>
								</div>
							</td>
							<td>
								<div class="amount">{formatCurrency(8400)}</div>
							</td>
							<td>
								<span class="status-badge status-paid">Paid</span>
							</td>
							<td>
								<div class="date">Jan 28, 2025</div>
							</td>
							<td>
								<button class="btn-icon">⋯</button>
							</td>
						</tr>
						<tr class="table-row">
							<td>
								<div class="cell-primary">INV-2025-0088</div>
							</td>
							<td>
								<div class="client-cell">
									<div class="client-avatar">D</div>
									<div class="client-name">Design Studio XYZ</div>
								</div>
							</td>
							<td>
								<div class="amount">{formatCurrency(5200)}</div>
							</td>
							<td>
								<span class="status-badge status-sent">Sent</span>
							</td>
							<td>
								<div class="date">Jan 26, 2025</div>
							</td>
							<td>
								<button class="btn-icon">⋯</button>
							</td>
						</tr>
						<tr class="table-row">
							<td>
								<div class="cell-primary">INV-2025-0087</div>
							</td>
							<td>
								<div class="client-cell">
									<div class="client-avatar">T</div>
									<div class="client-name">TechCorp Inc</div>
								</div>
							</td>
							<td>
								<div class="amount">{formatCurrency(12800)}</div>
							</td>
							<td>
								<span class="status-badge status-overdue">Overdue</span>
							</td>
							<td>
								<div class="date">Jan 22, 2025</div>
							</td>
							<td>
								<button class="btn-icon">⋯</button>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="features-grid">
		<div class="container">
			<h2 class="section-title centered">Built for Performance</h2>
			<div class="grid-3">
				<div class="feature-box">
					<div class="feature-header">
						<div class="feature-icon">⚡</div>
						<h3 class="feature-title">Fast by Default</h3>
					</div>
					<p class="feature-text">
						Generate PDFs in under 1 second. Optimized rendering pipeline with edge caching.
					</p>
					<div class="feature-footer">
						<a href="#" class="feature-link">Performance Docs →</a>
					</div>
				</div>
				<div class="feature-box">
					<div class="feature-header">
						<div class="feature-icon">🔧</div>
						<h3 class="feature-title">Developer First</h3>
					</div>
					<p class="feature-text">
						REST API, webhooks, TypeScript SDK. Integrate invoicing into your existing workflow.
					</p>
					<div class="feature-footer">
						<a href="#" class="feature-link">API Reference →</a>
					</div>
				</div>
				<div class="feature-box">
					<div class="feature-header">
						<div class="feature-icon">🎨</div>
						<h3 class="feature-title">Design Freedom</h3>
					</div>
					<p class="feature-text">
						Upload custom templates. Maintain brand consistency without compromising on functionality.
					</p>
					<div class="feature-footer">
						<a href="#" class="feature-link">Template Spec →</a>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.design-2 {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		background: #0a0a0a;
		color: #ffffff;
		min-height: 100vh;
	}

	.container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 40px;
	}

	/* Header */
	.header {
		border-bottom: 1px solid #1a1a1a;
		background: rgba(10, 10, 10, 0.8);
		backdrop-filter: blur(12px);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 72px;
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo {
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.version {
		font-size: 11px;
		color: #666;
		padding: 2px 8px;
		background: #1a1a1a;
		border-radius: 4px;
		font-weight: 500;
	}

	.nav {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.nav-link {
		color: #999;
		text-decoration: none;
		font-size: 14px;
		transition: color 0.15s;
		font-weight: 500;
	}

	.nav-link:hover {
		color: #ffffff;
	}

	.btn-secondary {
		background: #1a1a1a;
		color: #ffffff;
		border: 1px solid #2a2a2a;
		padding: 8px 20px;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: border-color 0.15s;
		font-weight: 500;
	}

	.btn-secondary:hover {
		border-color: #3a3a3a;
	}

	/* Hero */
	.hero {
		padding: 120px 0 80px;
		text-align: center;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		background: #0f1419;
		border: 1px solid #1a2634;
		border-radius: 20px;
		font-size: 13px;
		color: #6b97cf;
		margin-bottom: 32px;
		font-weight: 500;
	}

	.badge-dot {
		width: 6px;
		height: 6px;
		background: #4ade80;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.hero-title {
		font-size: 64px;
		font-weight: 700;
		line-height: 1.1;
		margin: 0 0 24px;
		letter-spacing: -0.03em;
		background: linear-gradient(to bottom, #ffffff 60%, #666666 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-desc {
		font-size: 18px;
		color: #999;
		line-height: 1.6;
		margin: 0 0 48px;
	}

	.hero-actions {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-bottom: 80px;
	}

	.btn-primary-large {
		background: #ffffff;
		color: #0a0a0a;
		border: none;
		padding: 14px 36px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.btn-primary-large:hover {
		transform: translateY(-1px);
	}

	.btn-ghost {
		background: transparent;
		color: #ffffff;
		border: 1px solid #2a2a2a;
		padding: 14px 36px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: border-color 0.15s;
	}

	.btn-ghost:hover {
		border-color: #3a3a3a;
	}

	.arrow {
		transition: transform 0.2s;
	}

	.btn-ghost:hover .arrow {
		transform: translateX(4px);
	}

	/* Code Block */
	.code-block {
		max-width: 800px;
		margin: 0 auto;
		background: #0f0f0f;
		border: 1px solid #1a1a1a;
		border-radius: 12px;
		overflow: hidden;
		text-align: left;
	}

	.code-header {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background: #0a0a0a;
		border-bottom: 1px solid #1a1a1a;
	}

	.code-dots {
		display: flex;
		gap: 6px;
		margin-right: 16px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #2a2a2a;
	}

	.code-title {
		flex: 1;
		font-size: 13px;
		color: #666;
		font-weight: 500;
	}

	.code-copy {
		background: transparent;
		color: #666;
		border: none;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: background 0.15s;
		font-weight: 500;
	}

	.code-copy:hover {
		background: #1a1a1a;
		color: #999;
	}

	.code-content {
		padding: 24px;
		margin: 0;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 13px;
		line-height: 1.8;
		color: #e0e0e0;
		overflow-x: auto;
	}

	/* Metrics */
	.metrics {
		padding: 80px 0;
		border-top: 1px solid #1a1a1a;
		border-bottom: 1px solid #1a1a1a;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 40px;
	}

	.metric {
		text-align: center;
	}

	.metric-value {
		font-size: 48px;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
	}

	.metric-label {
		font-size: 14px;
		color: #666;
		margin-bottom: 8px;
	}

	.metric-change {
		font-size: 13px;
		color: #999;
		font-weight: 500;
	}

	.metric-change.positive {
		color: #4ade80;
	}

	/* Dashboard Section */
	.dashboard-section {
		padding: 80px 0;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
	}

	.section-title {
		font-size: 32px;
		font-weight: 700;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.section-title.centered {
		text-align: center;
		margin-bottom: 64px;
	}

	.section-actions {
		display: flex;
		gap: 12px;
	}

	.btn-outline {
		background: transparent;
		color: #999;
		border: 1px solid #2a2a2a;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
		font-weight: 500;
	}

	.btn-outline:hover {
		border-color: #3a3a3a;
		color: #ffffff;
	}

	.btn-accent {
		background: #ffffff;
		color: #0a0a0a;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.btn-accent:hover {
		transform: translateY(-1px);
	}

	/* Table */
	.table-container {
		background: #0f0f0f;
		border: 1px solid #1a1a1a;
		border-radius: 12px;
		overflow: hidden;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
	}

	.data-table thead {
		background: #0a0a0a;
		border-bottom: 1px solid #1a1a1a;
	}

	.data-table th {
		text-align: left;
		padding: 16px 20px;
		font-size: 12px;
		font-weight: 600;
		color: #666;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.table-row {
		border-bottom: 1px solid #1a1a1a;
		transition: background 0.15s;
	}

	.table-row:hover {
		background: #121212;
	}

	.table-row:last-child {
		border-bottom: none;
	}

	.data-table td {
		padding: 16px 20px;
	}

	.cell-primary {
		font-size: 14px;
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
	}

	.client-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.client-avatar {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: #1a1a1a;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 600;
		color: #999;
	}

	.client-name {
		font-size: 14px;
	}

	.amount {
		font-size: 15px;
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
	}

	.status-badge {
		padding: 4px 10px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
		display: inline-block;
	}

	.status-paid {
		background: rgba(74, 222, 128, 0.1);
		color: #4ade80;
		border: 1px solid rgba(74, 222, 128, 0.2);
	}

	.status-sent {
		background: rgba(96, 165, 250, 0.1);
		color: #60a5fa;
		border: 1px solid rgba(96, 165, 250, 0.2);
	}

	.status-overdue {
		background: rgba(248, 113, 113, 0.1);
		color: #f87171;
		border: 1px solid rgba(248, 113, 113, 0.2);
	}

	.date {
		font-size: 14px;
		color: #666;
	}

	.btn-icon {
		background: transparent;
		color: #666;
		border: none;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 16px;
		transition: background 0.15s;
	}

	.btn-icon:hover {
		background: #1a1a1a;
		color: #999;
	}

	/* Features Grid */
	.features-grid {
		padding: 80px 0 120px;
	}

	.grid-3 {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.feature-box {
		background: #0f0f0f;
		border: 1px solid #1a1a1a;
		border-radius: 12px;
		padding: 32px;
		transition: border-color 0.2s;
	}

	.feature-box:hover {
		border-color: #2a2a2a;
	}

	.feature-header {
		margin-bottom: 16px;
	}

	.feature-icon {
		font-size: 32px;
		margin-bottom: 16px;
	}

	.feature-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
	}

	.feature-text {
		font-size: 14px;
		line-height: 1.6;
		color: #999;
		margin: 0 0 24px;
	}

	.feature-footer {
		padding-top: 16px;
		border-top: 1px solid #1a1a1a;
	}

	.feature-link {
		color: #6b97cf;
		text-decoration: none;
		font-size: 14px;
		font-weight: 500;
		transition: color 0.15s;
	}

	.feature-link:hover {
		color: #8bb4e0;
	}
</style>
