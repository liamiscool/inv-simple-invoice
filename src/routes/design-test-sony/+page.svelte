<script lang="ts">
	// 2006 Sony-inspired design with ASCII graphics and light mode
	// Combining retro web layout with modern inv branding

	let stats = {
		invoices: 127,
		clients: 43,
		revenue: 234800,
		templates: 12
	};
</script>

<svelte:head>
	<title>inv - Beautiful Invoices for Designers</title>
</svelte:head>

<div class="sony-design">
	<!-- Top Navigation Bar -->
	<header class="top-nav">
		<div class="nav-container">
			<div class="logo-section">
				<div class="brand">inv</div>
			</div>
			<div class="search-section">
				<span class="search-label">SEARCH:</span>
				<input type="text" class="search-input" placeholder="" />
				<button class="search-btn">GO</button>
			</div>
			<div class="location">
				<a href="#" class="global-link">Global Home</a>
				<span class="country">USA</span>
			</div>
		</div>
	</header>

	<!-- Main Navigation -->
	<nav class="main-nav">
		<a href="#" class="nav-item">REGISTER</a>
		<a href="#" class="nav-item">SHOP</a>
		<a href="#" class="nav-item">TEMPLATES</a>
		<a href="#" class="nav-item">INVOICING</a>
		<a href="#" class="nav-item">CLIENTS & PAYMENTS</a>
	</nav>

	<nav class="sub-nav">
		<a href="#" class="subnav-item">SERVICE & SUPPORT</a>
	</nav>

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-container">
			<div class="hero-image">
				<pre class="hero-ascii">{`
    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
    ┃                                                                    ┃
    ┃   ██▓ ███▄    █  ██▒   █▓    ┏━━━━━━━━━━━━━━━┓                   ┃
    ┃  ▓██▒ ██ ▀█   █ ▓██░   █▒    ┃ ╔═══════════╗ ┃                   ┃
    ┃  ▒██▒▓██  ▀█ ██▒ ▓██  █▒░    ┃ ║ INVOICE   ║ ┃                   ┃
    ┃  ░██░▓██▒  ▐▌██▒  ▒██ █░░    ┃ ║           ║ ┃                   ┃
    ┃  ░██░▒██░   ▓██░   ▒▀█░      ┃ ║ $12,400   ║ ┃                   ┃
    ┃  ░▓  ░ ▒░   ▒ ▒    ░ ▐░      ┃ ╚═══════════╝ ┃                   ┃
    ┃   ▒ ░░ ░░   ░ ▒░   ░ ░░      ┗━━━━━━━━━━━━━━━┛                   ┃
    ┃   ▒ ░   ░   ░ ░      ░░                                           ┃
    ┃   ░           ░       ░                                           ┃
    ┃                                                                    ┃
    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
				`.trim()}</pre>
			</div>
			<div class="hero-content">
				<h1 class="hero-title">
					welcome to the<br />
					<span class="world-of">world of</span> <span class="brand-name">inv</span>
				</h1>
				<p class="hero-subtitle">invoicing, templates, payments, clients</p>
			</div>
		</div>
	</section>

	<!-- What's New Box -->
	<section class="whats-new">
		<div class="whats-new-header">what's new</div>
		<div class="whats-new-content">
			<div class="news-item">
				<span class="arrow">»</span> Be warned. Be ready. <strong>Bewitched.</strong> New
				templates June 24
			</div>
			<div class="news-item">
				<span class="arrow">»</span> Create up to 40 invoices instantly with the new
				<strong>Batch Invoice Generator™</strong>
			</div>
			<div class="news-item">
				<span class="arrow">»</span>
				<strong>inv Card:</strong> Transform your ordinary purchases into inv Rewards
			</div>
		</div>
	</section>

	<!-- Four Section Navigation (See, Hear, Play, Shop style) -->
	<section class="quad-nav">
		<a href="#" class="quad-item">
			<div class="quad-label">See</div>
		</a>
		<a href="#" class="quad-item">
			<div class="quad-label">Create</div>
		</a>
		<a href="#" class="quad-item">
			<div class="quad-label">Send</div>
		</a>
		<a href="#" class="quad-item">
			<div class="quad-label">Track</div>
		</a>
	</section>

	<!-- Main Content Grid (Sony-style 4-column) -->
	<section class="content-grid">
		<div class="grid-container">
			<!-- Column 1 - Templates -->
			<div class="content-column">
				<div class="column-header">Templates</div>
				<div class="column-image">
					<pre class="content-ascii">{`
┏━━━━━━━━━━━━━━━━┓
┃ ░░░░░░░░░░░░░░ ┃
┃ ▓▓▓ MINIMAL ▓▓ ┃
┃ ░░░░░░░░░░░░░░ ┃
┃ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┃
┃ ░░ INVOICE ░░░ ┃
┃ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ┃
┗━━━━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="column-content">
					<h3 class="content-title">New templates now available</h3>
					<p class="content-text">Browse our curated collection of minimal invoice designs</p>
					<div class="content-links">
						<a href="#" class="content-link">» Browse Templates</a>
						<a href="#" class="content-link">» Upload Custom Design</a>
						<a href="#" class="content-link">» Template Gallery</a>
					</div>
				</div>
			</div>

			<!-- Column 2 - Invoicing -->
			<div class="content-column">
				<div class="column-header">Invoicing</div>
				<div class="column-image">
					<pre class="content-ascii">{`
┏━━━━━━━━━━━━━━━━┓
┃ INV-2025-0089  ┃
┃ ══════════════ ┃
┃ Acme Corp      ┃
┃ $8,400    [✓]  ┃
┃ ────────────── ┃
┃ INV-2025-0088  ┃
┃ Design Co      ┃
┃ $5,200    [→]  ┃
┗━━━━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="column-content">
					<h3 class="content-title">Create invoices in seconds</h3>
					<p class="content-text">Choose a template, add items, and send — it's that simple</p>
					<div class="content-links">
						<a href="#" class="content-link">» Create Invoice</a>
						<a href="#" class="content-link">» View All Invoices</a>
						<a href="#" class="content-link">» Batch Generator</a>
					</div>
				</div>
			</div>

			<!-- Column 3 - Payments -->
			<div class="content-column">
				<div class="column-header">Payments</div>
				<div class="column-image">
					<pre class="content-ascii">{`
┏━━━━━━━━━━━━━━━━┓
┃  $$$ → [✓]     ┃
┃  ◎◎◎ → [✓]    ┃
┃  $$$ → [→]     ┃
┃  ◎◎◎ → [!]    ┃
┃ ══════════════ ┃
┃ TOTAL: $234K   ┃
┃ PAID:  $189K   ┃
┃ DUE:   $45K    ┃
┗━━━━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="column-content">
					<h3 class="content-title">Track every payment</h3>
					<p class="content-text">Monitor status, record partial payments, send reminders</p>
					<div class="content-links">
						<a href="#" class="content-link">» Payment Dashboard</a>
						<a href="#" class="content-link">» Send Reminder</a>
						<a href="#" class="content-link">» Record Payment</a>
					</div>
				</div>
			</div>

			<!-- Column 4 - Clients -->
			<div class="content-column">
				<div class="column-header">Clients</div>
				<div class="column-image">
					<pre class="content-ascii">{`
┏━━━━━━━━━━━━━━━━┓
┃ [A] Acme Corp  ┃
┃ [D] Design Co  ┃
┃ [T] TechCorp   ┃
┃ [S] Studio XYZ ┃
┃ ══════════════ ┃
┃ 43 CLIENTS     ┃
┃ 127 INVOICES   ┃
┃ $234K REVENUE  ┃
┗━━━━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="column-content">
					<h3 class="content-title">Manage your clients</h3>
					<p class="content-text">Keep all client details organized in one place</p>
					<div class="content-links">
						<a href="#" class="content-link">» View All Clients</a>
						<a href="#" class="content-link">» Add New Client</a>
						<a href="#" class="content-link">» Client Reports</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Bottom Links Grid (Sony-style compact links) -->
	<section class="bottom-links">
		<div class="links-container">
			<div class="link-column">
				<a href="#" class="bottom-link">Templates</a> |
				<a href="#" class="bottom-link">Curated Gallery</a> |
				<a href="#" class="bottom-link">Upload Custom</a> |
				<a href="#" class="bottom-link">Template Spec</a>
			</div>
			<div class="link-column">
				<a href="#" class="bottom-link">Invoices</a> |
				<a href="#" class="bottom-link">Create New</a> |
				<a href="#" class="bottom-link">Drafts</a> |
				<a href="#" class="bottom-link">Sent</a> |
				<a href="#" class="bottom-link">Paid</a>
			</div>
			<div class="link-column">
				<a href="#" class="bottom-link">Clients</a> |
				<a href="#" class="bottom-link">All Clients</a> |
				<a href="#" class="bottom-link">Add Client</a> |
				<a href="#" class="bottom-link">Reports</a>
			</div>
			<div class="link-column">
				<a href="#" class="bottom-link">Account</a> |
				<a href="#" class="bottom-link">Settings</a> |
				<a href="#" class="bottom-link">Billing</a> |
				<a href="#" class="bottom-link">Upgrade</a>
			</div>
		</div>
	</section>

	<!-- Footer Navigation -->
	<footer class="footer-nav">
		<div class="footer-container">
			<a href="#" class="footer-link">INDEX OF SITES</a>
			<a href="#" class="footer-link">FAQ</a>
			<a href="#" class="footer-link">TERMS/PRIVACY</a>
			<a href="#" class="footer-link">PRICING</a>
			<a href="#" class="footer-link">CONTACT</a>
		</div>
		<div class="copyright">© 2025 inv — Beautiful Invoices for Designers</div>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: Verdana, Arial, Helvetica, sans-serif;
	}

	.sony-design {
		background: #ffffff;
		color: #000000;
		min-height: 100vh;
	}

	/* Top Navigation */
	.top-nav {
		background: #ffffff;
		border-bottom: 1px solid #cccccc;
		padding: 8px 0;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo-section {
		flex: 1;
	}

	.brand {
		font-size: 28px;
		font-weight: bold;
		color: #000000;
		font-family: Arial, sans-serif;
		letter-spacing: -1px;
	}

	.search-section {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.search-label {
		font-size: 11px;
		font-weight: bold;
		color: #000000;
	}

	.search-input {
		border: 1px solid #999999;
		padding: 2px 6px;
		font-size: 11px;
		width: 120px;
		font-family: inherit;
	}

	.search-btn {
		background: #666666;
		color: #ffffff;
		border: none;
		padding: 3px 12px;
		font-size: 11px;
		font-weight: bold;
		cursor: pointer;
		font-family: inherit;
	}

	.location {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
	}

	.global-link {
		color: #0066cc;
		text-decoration: underline;
	}

	.country {
		font-weight: bold;
	}

	/* Main Navigation */
	.main-nav {
		background: #f0f0f0;
		border-bottom: 1px solid #cccccc;
		padding: 0;
		display: flex;
		max-width: 1200px;
		margin: 0 auto;
	}

	.nav-item {
		padding: 8px 20px;
		font-size: 11px;
		font-weight: bold;
		color: #000000;
		text-decoration: none;
		border-right: 1px solid #cccccc;
		background: #f0f0f0;
		transition: background 0.2s;
	}

	.nav-item:hover {
		background: #e0e0e0;
	}

	.sub-nav {
		background: #e8e8e8;
		border-bottom: 2px solid #999999;
		padding: 6px 0;
		max-width: 1200px;
		margin: 0 auto;
	}

	.subnav-item {
		padding: 0 20px;
		font-size: 11px;
		font-weight: bold;
		color: #000000;
		text-decoration: none;
	}

	/* Hero Section */
	.hero-section {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
	}

	.hero-container {
		display: flex;
		gap: 20px;
		align-items: center;
	}

	.hero-image {
		background: linear-gradient(135deg, #e8f4f8 0%, #d4e8f0 100%);
		padding: 20px;
		border: 1px solid #cccccc;
		flex: 1;
	}

	.hero-ascii {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		line-height: 1.2;
		color: #333333;
	}

	.hero-content {
		flex: 1;
		padding: 20px;
	}

	.hero-title {
		font-size: 24px;
		margin: 0 0 12px;
		color: #666666;
		font-weight: normal;
		line-height: 1.3;
	}

	.world-of {
		color: #6699cc;
	}

	.brand-name {
		color: #000000;
		font-weight: bold;
		font-size: 32px;
	}

	.hero-subtitle {
		font-size: 12px;
		color: #666666;
		margin: 0;
		font-style: italic;
	}

	/* What's New */
	.whats-new {
		max-width: 1200px;
		margin: 20px auto;
		padding: 0 20px;
	}

	.whats-new-header {
		background: linear-gradient(to right, #6699cc 0%, #99bbdd 100%);
		color: #ffffff;
		padding: 6px 12px;
		font-size: 14px;
		font-weight: bold;
		border: 1px solid #5588bb;
	}

	.whats-new-content {
		background: #f0f8ff;
		border: 1px solid #cccccc;
		border-top: none;
		padding: 12px;
	}

	.news-item {
		font-size: 11px;
		margin-bottom: 8px;
		color: #333333;
	}

	.news-item:last-child {
		margin-bottom: 0;
	}

	.arrow {
		color: #6699cc;
		font-weight: bold;
	}

	/* Quad Navigation */
	.quad-nav {
		max-width: 1200px;
		margin: 20px auto;
		padding: 0 20px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.quad-item {
		background: linear-gradient(to bottom, #6699cc 0%, #5588bb 100%);
		color: #ffffff;
		text-align: center;
		padding: 10px;
		text-decoration: none;
		border: 1px solid #4477aa;
		transition: background 0.2s;
	}

	.quad-item:hover {
		background: linear-gradient(to bottom, #5588bb 0%, #4477aa 100%);
	}

	.quad-label {
		font-size: 13px;
		font-weight: bold;
	}

	/* Content Grid */
	.content-grid {
		max-width: 1200px;
		margin: 20px auto;
		padding: 0 20px;
	}

	.grid-container {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.content-column {
		background: #ffffff;
		border: 1px solid #cccccc;
	}

	.column-header {
		background: #f0f0f0;
		padding: 6px 10px;
		font-size: 12px;
		font-weight: bold;
		border-bottom: 1px solid #cccccc;
	}

	.column-image {
		background: #fafafa;
		padding: 12px;
		border-bottom: 1px solid #eeeeee;
		display: flex;
		justify-content: center;
	}

	.content-ascii {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-size: 9px;
		line-height: 1.2;
		color: #333333;
	}

	.column-content {
		padding: 12px;
	}

	.content-title {
		font-size: 12px;
		font-weight: bold;
		margin: 0 0 8px;
		color: #000000;
	}

	.content-text {
		font-size: 11px;
		color: #666666;
		margin: 0 0 12px;
		line-height: 1.4;
	}

	.content-links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.content-link {
		font-size: 10px;
		color: #0066cc;
		text-decoration: none;
	}

	.content-link:hover {
		text-decoration: underline;
	}

	/* Bottom Links */
	.bottom-links {
		max-width: 1200px;
		margin: 20px auto;
		padding: 0 20px;
		background: #f8f8f8;
		border: 1px solid #cccccc;
	}

	.links-container {
		padding: 12px;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.link-column {
		font-size: 10px;
		line-height: 1.6;
	}

	.bottom-link {
		color: #0066cc;
		text-decoration: none;
	}

	.bottom-link:hover {
		text-decoration: underline;
	}

	/* Footer */
	.footer-nav {
		background: #f0f0f0;
		border-top: 2px solid #999999;
		padding: 16px 0;
		margin-top: 40px;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		display: flex;
		gap: 20px;
		justify-content: center;
		margin-bottom: 12px;
	}

	.footer-link {
		font-size: 10px;
		color: #0066cc;
		text-decoration: none;
		font-weight: bold;
	}

	.footer-link:hover {
		text-decoration: underline;
	}

	.copyright {
		text-align: center;
		font-size: 10px;
		color: #666666;
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.grid-container {
			grid-template-columns: repeat(2, 1fr);
		}

		.quad-nav {
			grid-template-columns: repeat(2, 1fr);
		}

		.hero-container {
			flex-direction: column;
		}
	}

	@media (max-width: 640px) {
		.grid-container {
			grid-template-columns: 1fr;
		}

		.quad-nav {
			grid-template-columns: 1fr;
		}

		.main-nav {
			flex-wrap: wrap;
		}

		.links-container {
			grid-template-columns: 1fr;
		}
	}
</style>
