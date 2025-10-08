<script lang="ts">
	// Variation 1: svgl.app inspired - clean, modern grid with generous spacing
	let invoiceCount = 127;
	let clientCount = 43;
	let revenue = 89420;
</script>

<svelte:head>
	<title>Design Test 1 - SVGL Inspired</title>
</svelte:head>

<div class="design-1">
	<!-- Hero Section -->
	<section class="hero">
		<nav class="nav">
			<div class="logo">inv</div>
			<div class="nav-links">
				<a href="#features">Features</a>
				<a href="#pricing">Pricing</a>
				<a href="#docs">Docs</a>
				<button class="btn-primary">Get Started</button>
			</div>
		</nav>

		<div class="hero-content">
			<h1 class="hero-title">
				Beautiful Invoices<br />
				<span class="gradient-text">For Modern Designers</span>
			</h1>
			<p class="hero-subtitle">
				Upload your own designs. Generate invoices that match your brand. Get paid faster.
			</p>
			<div class="hero-cta">
				<button class="btn-hero-primary">Start Free Trial</button>
				<button class="btn-hero-secondary">View Demo</button>
			</div>
		</div>
	</section>

	<!-- Stats Grid -->
	<section class="stats">
		<div class="stat-card">
			<div class="stat-number">{invoiceCount}</div>
			<div class="stat-label">Invoices Sent</div>
		</div>
		<div class="stat-card">
			<div class="stat-number">{clientCount}</div>
			<div class="stat-label">Active Clients</div>
		</div>
		<div class="stat-card">
			<div class="stat-number">${(revenue / 1000).toFixed(1)}k</div>
			<div class="stat-label">Total Revenue</div>
		</div>
	</section>

	<!-- Dashboard Preview -->
	<section class="dashboard-preview">
		<h2 class="section-title">Your Invoicing Command Center</h2>

		<div class="dashboard-cards">
			<div class="dash-card">
				<div class="card-header">
					<span class="card-title">Recent Invoices</span>
					<button class="btn-icon">→</button>
				</div>
				<div class="invoice-list">
					<div class="invoice-item">
						<div class="invoice-info">
							<div class="invoice-number">INV-2025-0023</div>
							<div class="invoice-client">Acme Corp</div>
						</div>
						<div class="invoice-amount">$4,200</div>
						<div class="badge badge-paid">Paid</div>
					</div>
					<div class="invoice-item">
						<div class="invoice-info">
							<div class="invoice-number">INV-2025-0022</div>
							<div class="invoice-client">Design Co</div>
						</div>
						<div class="invoice-amount">$2,800</div>
						<div class="badge badge-sent">Sent</div>
					</div>
					<div class="invoice-item">
						<div class="invoice-info">
							<div class="invoice-number">INV-2025-0021</div>
							<div class="invoice-client">Studio XYZ</div>
						</div>
						<div class="invoice-amount">$5,600</div>
						<div class="badge badge-overdue">Overdue</div>
					</div>
				</div>
			</div>

			<div class="dash-card">
				<div class="card-header">
					<span class="card-title">Quick Actions</span>
				</div>
				<div class="actions-grid">
					<button class="action-btn">
						<span class="action-icon">+</span>
						<span class="action-label">New Invoice</span>
					</button>
					<button class="action-btn">
						<span class="action-icon">👤</span>
						<span class="action-label">Add Client</span>
					</button>
					<button class="action-btn">
						<span class="action-icon">📄</span>
						<span class="action-label">Templates</span>
					</button>
					<button class="action-btn">
						<span class="action-icon">⚙️</span>
						<span class="action-label">Settings</span>
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- Feature Cards -->
	<section class="features">
		<div class="feature-card">
			<div class="feature-icon">🎨</div>
			<h3 class="feature-title">Custom Templates</h3>
			<p class="feature-desc">Upload your own invoice designs. We handle the data mapping automatically.</p>
			<a href="#" class="feature-link">Learn more →</a>
		</div>
		<div class="feature-card">
			<div class="feature-icon">⚡</div>
			<h3 class="feature-title">Lightning Fast</h3>
			<p class="feature-desc">Generate and send invoices in seconds. No complex setup required.</p>
			<a href="#" class="feature-link">Learn more →</a>
		</div>
		<div class="feature-card">
			<div class="feature-icon">💰</div>
			<h3 class="feature-title">Track Payments</h3>
			<p class="feature-desc">Monitor payment status, send reminders, record partial payments.</p>
			<a href="#" class="feature-link">Learn more →</a>
		</div>
	</section>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.design-1 {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
		min-height: 100vh;
		padding-bottom: 120px;
	}

	/* Hero Section */
	.hero {
		padding: 24px 48px 120px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 120px;
	}

	.logo {
		font-size: 24px;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: #111;
	}

	.nav-links {
		display: flex;
		gap: 32px;
		align-items: center;
	}

	.nav-links a {
		color: #666;
		text-decoration: none;
		font-size: 15px;
		transition: color 0.2s;
	}

	.nav-links a:hover {
		color: #111;
	}

	.btn-primary {
		background: #111;
		color: white;
		border: none;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: 15px;
		cursor: pointer;
		transition: transform 0.1s, box-shadow 0.2s;
	}

	.btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.hero-content {
		text-align: center;
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 72px;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin: 0 0 24px;
		color: #111;
	}

	.gradient-text {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: 20px;
		color: #666;
		line-height: 1.6;
		margin: 0 0 48px;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.hero-cta {
		display: flex;
		gap: 16px;
		justify-content: center;
	}

	.btn-hero-primary {
		background: #111;
		color: white;
		border: none;
		padding: 16px 40px;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.1s, box-shadow 0.2s;
	}

	.btn-hero-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.btn-hero-secondary {
		background: white;
		color: #111;
		border: 2px solid #e5e5e5;
		padding: 16px 40px;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.btn-hero-secondary:hover {
		border-color: #111;
	}

	/* Stats Grid */
	.stats {
		max-width: 1200px;
		margin: 0 auto 120px;
		padding: 0 48px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.stat-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 16px;
		padding: 40px;
		text-align: center;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	}

	.stat-number {
		font-size: 48px;
		font-weight: 700;
		color: #111;
		margin-bottom: 8px;
	}

	.stat-label {
		font-size: 15px;
		color: #666;
	}

	/* Dashboard Preview */
	.dashboard-preview {
		max-width: 1200px;
		margin: 0 auto 120px;
		padding: 0 48px;
	}

	.section-title {
		font-size: 40px;
		font-weight: 700;
		text-align: center;
		margin: 0 0 64px;
		color: #111;
		letter-spacing: -0.02em;
	}

	.dashboard-cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 24px;
	}

	.dash-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 16px;
		padding: 32px;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.card-title {
		font-size: 18px;
		font-weight: 600;
		color: #111;
	}

	.btn-icon {
		background: #f5f5f5;
		border: none;
		width: 32px;
		height: 32px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 16px;
		transition: background 0.2s;
	}

	.btn-icon:hover {
		background: #e5e5e5;
	}

	.invoice-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.invoice-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		background: #fafafa;
		border-radius: 12px;
		transition: background 0.2s;
	}

	.invoice-item:hover {
		background: #f5f5f5;
	}

	.invoice-info {
		flex: 1;
	}

	.invoice-number {
		font-size: 14px;
		font-weight: 600;
		color: #111;
		margin-bottom: 4px;
	}

	.invoice-client {
		font-size: 13px;
		color: #666;
	}

	.invoice-amount {
		font-size: 16px;
		font-weight: 600;
		color: #111;
		margin-right: 16px;
	}

	.badge {
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	}

	.badge-paid {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-sent {
		background: #dbeafe;
		color: #1e40af;
	}

	.badge-overdue {
		background: #fee2e2;
		color: #991b1b;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	.action-btn {
		background: #fafafa;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: background 0.2s, border-color 0.2s;
	}

	.action-btn:hover {
		background: white;
		border-color: #111;
	}

	.action-icon {
		font-size: 24px;
	}

	.action-label {
		font-size: 14px;
		font-weight: 600;
		color: #111;
	}

	/* Features */
	.features {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 48px;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.feature-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 16px;
		padding: 40px;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
	}

	.feature-icon {
		font-size: 40px;
		margin-bottom: 24px;
	}

	.feature-title {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 12px;
		color: #111;
	}

	.feature-desc {
		font-size: 15px;
		line-height: 1.6;
		color: #666;
		margin: 0 0 16px;
	}

	.feature-link {
		color: #667eea;
		text-decoration: none;
		font-size: 15px;
		font-weight: 600;
		transition: opacity 0.2s;
	}

	.feature-link:hover {
		opacity: 0.7;
	}
</style>
