<script lang="ts">
	// Variation 3: yeezy.com inspired - extreme minimalism, brutalist spacing
	let totalRevenue = 234800;
	let activeInvoices = 12;
</script>

<svelte:head>
	<title>Design Test 3 - Yeezy Inspired</title>
</svelte:head>

<div class="design-3">
	<!-- Minimal Header -->
	<header class="header">
		<div class="header-left">
			<div class="wordmark">INV</div>
		</div>
		<div class="header-right">
			<button class="link-btn">ENTER</button>
		</div>
	</header>

	<!-- Hero Statement -->
	<section class="hero">
		<div class="hero-inner">
			<div class="statement">
				<div class="statement-line">INVOICING</div>
				<div class="statement-line">FOR</div>
				<div class="statement-line">DESIGNERS</div>
			</div>

			<div class="hero-meta">
				<div class="meta-item">
					<div class="meta-label">TOTAL REVENUE</div>
					<div class="meta-value">${(totalRevenue / 1000).toFixed(0)}K</div>
				</div>
				<div class="meta-item">
					<div class="meta-label">ACTIVE</div>
					<div class="meta-value">{activeInvoices}</div>
				</div>
			</div>

			<button class="cta-main">START NOW</button>
		</div>
	</section>

	<!-- Full Width Divider -->
	<div class="divider"></div>

	<!-- Dashboard View -->
	<section class="dashboard">
		<div class="dash-header">
			<div class="dash-title">RECENT INVOICES</div>
			<div class="dash-action">
				<button class="action-link">+ NEW</button>
			</div>
		</div>

		<div class="invoice-grid">
			<div class="invoice-card">
				<div class="card-row">
					<span class="card-label">NUMBER</span>
					<span class="card-value">INV-2025-0156</span>
				</div>
				<div class="card-row">
					<span class="card-label">CLIENT</span>
					<span class="card-value">ACME CORP</span>
				</div>
				<div class="card-row">
					<span class="card-label">AMOUNT</span>
					<span class="card-value">$8,400</span>
				</div>
				<div class="card-row">
					<span class="card-label">STATUS</span>
					<span class="card-status status-paid">PAID</span>
				</div>
			</div>

			<div class="invoice-card">
				<div class="card-row">
					<span class="card-label">NUMBER</span>
					<span class="card-value">INV-2025-0155</span>
				</div>
				<div class="card-row">
					<span class="card-label">CLIENT</span>
					<span class="card-value">DESIGN STUDIO</span>
				</div>
				<div class="card-row">
					<span class="card-label">AMOUNT</span>
					<span class="card-value">$5,200</span>
				</div>
				<div class="card-row">
					<span class="card-label">STATUS</span>
					<span class="card-status status-sent">SENT</span>
				</div>
			</div>

			<div class="invoice-card">
				<div class="card-row">
					<span class="card-label">NUMBER</span>
					<span class="card-value">INV-2025-0154</span>
				</div>
				<div class="card-row">
					<span class="card-label">CLIENT</span>
					<span class="card-value">TECH INC</span>
				</div>
				<div class="card-row">
					<span class="card-label">AMOUNT</span>
					<span class="card-value">$12,800</span>
				</div>
				<div class="card-row">
					<span class="card-label">STATUS</span>
					<span class="card-status status-overdue">OVERDUE</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Info Blocks -->
	<section class="info-section">
		<div class="info-grid">
			<div class="info-block">
				<div class="info-number">01</div>
				<div class="info-title">UPLOAD DESIGN</div>
				<div class="info-desc">
					Bring your own invoice template. PDF or PNG. We map the data fields automatically.
				</div>
			</div>

			<div class="info-block">
				<div class="info-number">02</div>
				<div class="info-title">CREATE INVOICE</div>
				<div class="info-desc">
					Add client details and line items. Your design, your data. Generated in seconds.
				</div>
			</div>

			<div class="info-block">
				<div class="info-number">03</div>
				<div class="info-title">GET PAID</div>
				<div class="info-desc">
					Send via email. Track payments. Record partial amounts. All in one place.
				</div>
			</div>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Content Table -->
	<section class="content-table">
		<div class="table-wrapper">
			<div class="table-header">
				<div class="th">FEATURE</div>
				<div class="th">FREE</div>
				<div class="th">PRO</div>
			</div>
			<div class="table-row-item">
				<div class="td">INVOICE SENDS</div>
				<div class="td">3 TOTAL</div>
				<div class="td">UNLIMITED</div>
			</div>
			<div class="table-row-item">
				<div class="td">CUSTOM TEMPLATES</div>
				<div class="td">—</div>
				<div class="td">✓</div>
			</div>
			<div class="table-row-item">
				<div class="td">PARTIAL PAYMENTS</div>
				<div class="td">—</div>
				<div class="td">✓</div>
			</div>
			<div class="table-row-item">
				<div class="td">REMOVE BRANDING</div>
				<div class="td">—</div>
				<div class="td">✓</div>
			</div>
		</div>

		<div class="table-footer">
			<button class="table-cta">UPGRADE TO PRO — $12/MO</button>
		</div>
	</section>

	<!-- Divider -->
	<div class="divider"></div>

	<!-- Footer Statement -->
	<footer class="footer">
		<div class="footer-statement">
			<div>INVOICING REIMAGINED</div>
			<div>FOR CREATIVE PROFESSIONALS</div>
		</div>
		<div class="footer-links">
			<a href="#" class="footer-link">DOCS</a>
			<a href="#" class="footer-link">API</a>
			<a href="#" class="footer-link">SUPPORT</a>
		</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	.design-3 {
		font-family: 'Helvetica Neue', Arial, sans-serif;
		background: #f7f7f7;
		color: #0a0a0a;
		min-height: 100vh;
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 40px 60px;
		background: #f7f7f7;
	}

	.wordmark {
		font-size: 28px;
		font-weight: 900;
		letter-spacing: 0.15em;
	}

	.link-btn {
		background: transparent;
		border: 2px solid #0a0a0a;
		color: #0a0a0a;
		padding: 12px 32px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		transition: all 0.2s;
	}

	.link-btn:hover {
		background: #0a0a0a;
		color: #f7f7f7;
	}

	/* Hero */
	.hero {
		padding: 100px 60px 120px;
		background: #f7f7f7;
	}

	.hero-inner {
		max-width: 1400px;
		margin: 0 auto;
	}

	.statement {
		margin-bottom: 80px;
	}

	.statement-line {
		font-size: clamp(64px, 8vw, 140px);
		font-weight: 900;
		line-height: 0.9;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	.hero-meta {
		display: flex;
		gap: 80px;
		margin-bottom: 60px;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.meta-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #666;
	}

	.meta-value {
		font-size: 48px;
		font-weight: 900;
		letter-spacing: -0.02em;
	}

	.cta-main {
		background: #0a0a0a;
		color: #f7f7f7;
		border: none;
		padding: 20px 60px;
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.cta-main:hover {
		transform: scale(1.02);
	}

	.cta-main:active {
		transform: scale(0.98);
	}

	/* Divider */
	.divider {
		height: 1px;
		background: #d4d4d4;
		margin: 0;
	}

	/* Dashboard */
	.dashboard {
		padding: 80px 60px;
		background: #ffffff;
	}

	.dash-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 48px;
	}

	.dash-title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
	}

	.action-link {
		background: transparent;
		border: 1px solid #0a0a0a;
		color: #0a0a0a;
		padding: 8px 24px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		transition: all 0.15s;
	}

	.action-link:hover {
		background: #0a0a0a;
		color: #ffffff;
	}

	.invoice-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.invoice-card {
		background: #fafafa;
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		transition: background 0.2s;
	}

	.invoice-card:hover {
		background: #f0f0f0;
	}

	.card-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.card-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #999;
	}

	.card-value {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.card-status {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		padding: 4px 12px;
		background: #e0e0e0;
	}

	.status-paid {
		background: #0a0a0a;
		color: #ffffff;
	}

	.status-sent {
		background: #e0e0e0;
		color: #0a0a0a;
	}

	.status-overdue {
		background: #ffffff;
		color: #0a0a0a;
		border: 1px solid #0a0a0a;
	}

	/* Info Section */
	.info-section {
		padding: 80px 60px;
		background: #f7f7f7;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 60px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.info-block {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.info-number {
		font-size: 14px;
		font-weight: 900;
		color: #999;
	}

	.info-title {
		font-size: 18px;
		font-weight: 900;
		letter-spacing: 0.05em;
	}

	.info-desc {
		font-size: 14px;
		line-height: 1.7;
		color: #666;
	}

	/* Content Table */
	.content-table {
		padding: 80px 60px;
		background: #ffffff;
	}

	.table-wrapper {
		max-width: 1000px;
		margin: 0 auto 48px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 24px;
		padding-bottom: 16px;
		border-bottom: 2px solid #0a0a0a;
		margin-bottom: 24px;
	}

	.th {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
	}

	.table-row-item {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr;
		gap: 24px;
		padding: 20px 0;
		border-bottom: 1px solid #e0e0e0;
	}

	.table-row-item:last-child {
		border-bottom: none;
	}

	.td {
		font-size: 13px;
		font-weight: 500;
	}

	.table-footer {
		text-align: center;
	}

	.table-cta {
		background: #0a0a0a;
		color: #ffffff;
		border: none;
		padding: 18px 48px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
		cursor: pointer;
		transition: transform 0.1s;
	}

	.table-cta:hover {
		transform: scale(1.02);
	}

	/* Footer */
	.footer {
		padding: 80px 60px 60px;
		background: #f7f7f7;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.footer-statement {
		font-size: 20px;
		font-weight: 900;
		line-height: 1.4;
		letter-spacing: 0.05em;
	}

	.footer-links {
		display: flex;
		gap: 32px;
	}

	.footer-link {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.15em;
		color: #0a0a0a;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.footer-link:hover {
		opacity: 0.6;
	}

	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.invoice-grid,
		.info-grid {
			grid-template-columns: 1fr;
		}

		.hero-meta {
			gap: 40px;
		}
	}
</style>
