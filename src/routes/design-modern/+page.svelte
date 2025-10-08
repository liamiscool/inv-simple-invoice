<script lang="ts">
	import { onMount } from 'svelte';
	import anime from 'animejs/dist/bundles/anime.esm.js';

	// Modernized version with better fonts and animations
	let mounted = false;

	onMount(() => {
		mounted = true;

		// Animate ASCII art on load
		anime({
			targets: '.ascii-hero',
			opacity: [0, 1],
			translateY: [10, 0],
			duration: 800,
			easing: 'easeOutQuad'
		});

		// Animate columns stagger
		anime({
			targets: '.col',
			opacity: [0, 1],
			translateY: [20, 0],
			delay: anime.stagger(80),
			duration: 600,
			easing: 'easeOutQuad'
		});

		// Animate what's new items
		anime({
			targets: '.wn-item',
			opacity: [0, 1],
			translateX: [-10, 0],
			delay: anime.stagger(100, { start: 200 }),
			duration: 500,
			easing: 'easeOutQuad'
		});

		// Hover animations for nav links
		const navLinks = document.querySelectorAll('.navlink');
		navLinks.forEach((link) => {
			link.addEventListener('mouseenter', () => {
				anime({
					targets: link,
					translateY: -1,
					duration: 100,
					easing: 'easeOutQuad'
				});
			});
			link.addEventListener('mouseleave', () => {
				anime({
					targets: link,
					translateY: 0,
					duration: 100,
					easing: 'easeOutQuad'
				});
			});
		});
	});
</script>

<svelte:head>
	<title>inv - Beautiful Invoices for Designers</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="modern">
	<!-- Top Bar -->
	<div class="topbar">
		<div class="wrap">
			<div class="logo">inv</div>
			<div class="search">
				<span class="search-txt">SEARCH:</span>
				<input type="text" class="search-input" />
				<button class="search-go">GO</button>
			</div>
			<div class="location">
				<button class="global-btn">Global Home</button>
				<span class="region">USA</span>
			</div>
		</div>
	</div>

	<!-- Main Nav -->
	<div class="mainnav">
		<div class="wrap">
			<a href="#" class="navlink">REGISTER</a>
			<a href="#" class="navlink">SHOP</a>
			<a href="#" class="navlink">TEMPLATES</a>
			<a href="#" class="navlink">INVOICING</a>
			<a href="#" class="navlink">CLIENTS & PAYMENTS</a>
		</div>
	</div>

	<!-- Sub Nav -->
	<div class="subnav">
		<div class="wrap">
			<a href="#" class="sublink">SERVICE & SUPPORT</a>
		</div>
	</div>

	<!-- Hero -->
	<div class="hero">
		<div class="wrap">
			<div class="hero-img">
				<pre class="ascii-hero">{`


     ██▓ ███▄    █  ██▒   █▓
    ▓██▒ ██ ▀█   █ ▓██░   █▒
    ▒██▒▓██  ▀█ ██▒ ▓██  █▒░
    ░██░▓██▒  ▐▌██▒  ▒██ █░░
    ░██░▒██░   ▓██░   ▒▀█░
         ┏━━━━━━━━━━━┓
         ┃ INVOICE   ┃
         ┃ ═════════ ┃
         ┃ $12,400   ┃
         ┗━━━━━━━━━━━┛



				`.trim()}</pre>
			</div>
			<div class="hero-txt">
				<h1 class="hero-title">
					welcome to the<br />
					<span class="world">world of</span> <span class="inv-brand">inv</span>
				</h1>
				<p class="hero-sub">invoicing, templates, payments, clients</p>
			</div>
		</div>
	</div>

	<!-- What's New -->
	<div class="whats-new">
		<div class="wrap">
			<div class="wn-header">what's new</div>
			<div class="wn-body">
				<div class="wn-item">» Be warned. Be ready. <strong>Bewitched.</strong> New templates June 24</div>
				<div class="wn-item">
					» Create up to 40 invoices instantly with the new <strong>Batch Generator™</strong>
				</div>
				<div class="wn-item">
					» <strong>inv Card:</strong> Transform your ordinary purchases into inv Rewards
				</div>
			</div>
		</div>
	</div>

	<!-- Four Tabs -->
	<div class="tabs">
		<div class="wrap">
			<a href="#" class="tab">See</a>
			<a href="#" class="tab">Create</a>
			<a href="#" class="tab">Send</a>
			<a href="#" class="tab">Track</a>
		</div>
	</div>

	<!-- Four Columns -->
	<div class="cols">
		<div class="wrap">
			<!-- Col 1 -->
			<div class="col">
				<div class="col-head">InvGallery.com</div>
				<div class="col-img">
					<pre class="ascii-sm">{`
┏━━━━━━━━━━━━━┓
┃   MINIMAL   ┃
┃ ┌─────────┐ ┃
┃ │░░░░░░░░░│ ┃
┃ │▓▓▓▓▓▓▓▓▓│ ┃
┃ │░░░░░░░░░│ ┃
┃ └─────────┘ ┃
┗━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="col-txt">
					<h3 class="col-title">New <em>Minimal Black</em> template now available</h3>
					<p class="col-desc">Browse our curated collection of designer invoice templates</p>
					<a href="#" class="col-link">» Browse Templates</a><br />
					<a href="#" class="col-link">» Upload Custom Design</a>
				</div>
			</div>

			<!-- Col 2 -->
			<div class="col">
				<div class="col-head">InvCreate.com</div>
				<div class="col-img">
					<pre class="ascii-sm">{`
┏━━━━━━━━━━━━━┓
┃ INV-2025-89 ┃
┃ Acme Corp   ┃
┃ $8,400  [✓] ┃
┃ ─────────── ┃
┃ INV-2025-88 ┃
┃ Design Co   ┃
┃ $5,200  [→] ┃
┗━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="col-txt">
					<h3 class="col-title">K-Bills II for free:</h3>
					<h3 class="col-title">Download <em>Trial of the Iste</em></h3>
					<p class="col-desc">Create professional invoices in seconds</p>
					<a href="#" class="col-link">» Create Invoice</a><br />
					<a href="#" class="col-link">» View All Invoices</a>
				</div>
			</div>

			<!-- Col 3 -->
			<div class="col">
				<div class="col-head">InvPay.com</div>
				<div class="col-img">
					<pre class="ascii-sm">{`
┏━━━━━━━━━━━━━┓
┃ $ → [✓]     ┃
┃ ◎ → [✓]     ┃
┃ $ → [→]     ┃
┃ ◎ → [!]     ┃
┃ ═══════════ ┃
┃ $234K TOTAL ┃
┃ $45K  DUE   ┃
┗━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="col-txt">
					<h3 class="col-title">Take on the most feared enemy in the galaxy</h3>
					<h3 class="col-title">— mankind — in <em>Track All Payments!</em></h3>
					<a href="#" class="col-link">» Payment Dashboard</a><br />
					<a href="#" class="col-link">» Send Reminder</a>
				</div>
			</div>

			<!-- Col 4 -->
			<div class="col">
				<div class="col-head">InvClients.com</div>
				<div class="col-img">
					<pre class="ascii-sm">{`
┏━━━━━━━━━━━━━┓
┃  [A] Acme   ┃
┃  [D] Design ┃
┃  [T] Tech   ┃
┃  [S] Studio ┃
┃ ═══════════ ┃
┃ 43 CLIENTS  ┃
┃ 127 INVCS   ┃
┗━━━━━━━━━━━━━┛
					`.trim()}</pre>
				</div>
				<div class="col-txt">
					<p class="col-desc">» <a href="#" class="col-link">All Clients</a></p>
					<p class="col-desc">» <a href="#" class="col-link">Add New Client</a></p>
					<p class="col-desc">» <a href="#" class="col-link">Client Reports</a></p>
					<p class="col-desc">» <a href="#" class="col-link">Export Data</a></p>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Links -->
	<div class="bottom-links">
		<div class="wrap">
			<div class="link-col">
				<a href="#">Templates</a> | <a href="#">Curated</a> | <a href="#">Upload</a> |
				<a href="#">Spec</a> | <a href="#">Gallery</a> | <a href="#">Custom</a> |
				<a href="#">API</a> | <a href="#">Webhooks</a>
			</div>
			<div class="link-col">
				<a href="#">Invoices</a> | <a href="#">Create</a> | <a href="#">Drafts</a> |
				<a href="#">Sent</a> | <a href="#">Paid</a> | <a href="#">Overdue</a> | <a href="#">Void</a> |
				<a href="#">Archive</a>
			</div>
			<div class="link-col">
				<a href="#">Clients</a> | <a href="#">All</a> | <a href="#">Add</a> | <a href="#">Import</a> |
				<a href="#">Export</a> | <a href="#">Reports</a> | <a href="#">CRM</a>
			</div>
			<div class="link-col">
				<a href="#">Payments</a> | <a href="#">Dashboard</a> | <a href="#">Record</a> |
				<a href="#">Reminders</a> | <a href="#">Partial</a> | <a href="#">History</a>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="footer">
		<div class="wrap">
			<div class="footer-links">
				<a href="#">INDEX OF SITES</a>
				<a href="#">FAQ</a>
				<a href="#">TERMS/PRIVACY</a>
				<a href="#">PRICING</a>
				<a href="#">CONTACT</a>
			</div>
			<div class="copyright">© 2025 inv — Beautiful Invoices for Designers</div>
		</div>
	</div>
</div>

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.modern {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
		font-size: 11px;
		background: #fff;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	.wrap {
		max-width: 760px;
		margin: 0;
		padding: 0 10px;
	}

	/* Top Bar */
	.topbar {
		background: #fff;
		border-bottom: 1px solid #e0e0e0;
		padding: 6px 0;
	}

	.topbar .wrap {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-size: 24px;
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
		color: #000;
		letter-spacing: -0.02em;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.search-txt {
		font-size: 10px;
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.05em;
	}

	.search-input {
		border: 1px solid #d0d0d0;
		padding: 3px 6px;
		font-size: 11px;
		width: 100px;
		font-family: 'Inter', sans-serif;
		border-radius: 2px;
		transition: border-color 0.15s;
	}

	.search-input:focus {
		outline: none;
		border-color: #000;
	}

	.search-go {
		background: #000;
		color: #fff;
		border: none;
		padding: 4px 12px;
		font-size: 10px;
		font-weight: 600;
		cursor: pointer;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.05em;
		transition: opacity 0.1s;
	}

	.search-go:hover {
		opacity: 0.85;
	}

	.location {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 10px;
	}

	.global-btn {
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		padding: 3px 10px;
		font-size: 10px;
		cursor: pointer;
		border-radius: 12px;
		font-family: 'Inter', sans-serif;
		transition: background 0.15s;
	}

	.global-btn:hover {
		background: #eaeaea;
	}

	.region {
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
	}

	/* Main Nav */
	.mainnav {
		background: #fafafa;
		border-bottom: 1px solid #e0e0e0;
	}

	.mainnav .wrap {
		display: flex;
	}

	.navlink {
		padding: 8px 16px;
		font-size: 10px;
		font-weight: 600;
		color: #000;
		text-decoration: none;
		border-right: 1px solid #e0e0e0;
		background: #fafafa;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.03em;
		transition: background 0.1s, transform 0.1s;
	}

	.navlink:hover {
		background: #f0f0f0;
	}

	/* Sub Nav */
	.subnav {
		background: #f5f5f5;
		border-bottom: 1px solid #d0d0d0;
		padding: 5px 0;
	}

	.sublink {
		font-size: 10px;
		font-weight: 600;
		color: #000;
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.03em;
	}

	/* Hero */
	.hero {
		background: #fff;
		padding: 10px 0;
	}

	.hero .wrap {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.hero-img {
		background: linear-gradient(135deg, #f8fafb 0%, #f0f4f8 100%);
		border: 1px solid #e0e0e0;
		padding: 10px;
	}

	.ascii-hero {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10px;
		line-height: 1.2;
		color: #333;
		opacity: 0;
	}

	.hero-txt {
		padding: 10px;
	}

	.hero-title {
		font-size: 20px;
		font-weight: 400;
		color: #999;
		line-height: 1.2;
		margin-bottom: 8px;
		font-family: 'Inter', sans-serif;
	}

	.world {
		color: #6699cc;
	}

	.inv-brand {
		color: #000;
		font-weight: 700;
		font-size: 26px;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: -0.02em;
	}

	.hero-sub {
		font-size: 11px;
		color: #666;
		font-style: italic;
	}

	/* What's New */
	.whats-new {
		margin: 10px 0;
	}

	.wn-header {
		background: linear-gradient(to right, #6699cc 0%, #99bbdd 100%);
		color: #fff;
		padding: 5px 10px;
		font-size: 13px;
		font-weight: 600;
		border: 1px solid #5588bb;
		font-family: 'Inter', sans-serif;
	}

	.wn-body {
		background: #f8fbff;
		border: 1px solid #e0e0e0;
		border-top: none;
		padding: 10px;
	}

	.wn-item {
		font-size: 10px;
		margin-bottom: 7px;
		color: #333;
		opacity: 0;
	}

	.wn-item:last-child {
		margin-bottom: 0;
	}

	/* Tabs */
	.tabs {
		margin: 10px 0 0;
	}

	.tabs .wrap {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 2px;
	}

	.tab {
		background: linear-gradient(to bottom, #6699cc 0%, #5588bb 100%);
		color: #fff;
		text-align: center;
		padding: 7px;
		text-decoration: none;
		font-size: 12px;
		font-weight: 600;
		border: 1px solid #4477aa;
		font-family: 'Inter', sans-serif;
		transition: background 0.15s;
	}

	.tab:hover {
		background: linear-gradient(to bottom, #5588bb 0%, #4477aa 100%);
	}

	/* Columns */
	.cols {
		margin: 10px 0;
	}

	.cols .wrap {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}

	.col {
		background: #fff;
		border: 1px solid #e0e0e0;
		opacity: 0;
		transition: border-color 0.15s;
	}

	.col:hover {
		border-color: #000;
	}

	.col-head {
		background: #fafafa;
		padding: 5px 8px;
		font-size: 10px;
		font-weight: 600;
		border-bottom: 1px solid #e0e0e0;
		font-family: 'JetBrains Mono', monospace;
	}

	.col-img {
		background: #fafafa;
		padding: 8px;
		border-bottom: 1px solid #f0f0f0;
		text-align: center;
	}

	.ascii-sm {
		font-family: 'JetBrains Mono', monospace;
		font-size: 8px;
		line-height: 1.2;
		color: #333;
		display: inline-block;
	}

	.col-txt {
		padding: 8px;
	}

	.col-title {
		font-size: 10px;
		font-weight: 600;
		margin-bottom: 5px;
		color: #000;
	}

	.col-desc {
		font-size: 10px;
		color: #666;
		margin-bottom: 7px;
		line-height: 1.4;
	}

	.col-link {
		font-size: 9px;
		color: #0066cc;
		text-decoration: none;
		font-family: 'JetBrains Mono', monospace;
		transition: opacity 0.1s;
	}

	.col-link:hover {
		opacity: 0.7;
	}

	/* Bottom Links */
	.bottom-links {
		background: #fafafa;
		border: 1px solid #e0e0e0;
		padding: 10px;
		margin: 10px 0;
	}

	.bottom-links .wrap {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}

	.link-col {
		font-size: 9px;
		line-height: 1.7;
	}

	.link-col a {
		color: #0066cc;
		text-decoration: none;
		transition: opacity 0.1s;
	}

	.link-col a:hover {
		opacity: 0.7;
	}

	/* Footer */
	.footer {
		background: #fafafa;
		border-top: 1px solid #d0d0d0;
		padding: 14px 0;
		margin-top: 20px;
	}

	.footer-links {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-bottom: 10px;
	}

	.footer-links a {
		font-size: 9px;
		color: #0066cc;
		text-decoration: none;
		font-weight: 600;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.03em;
		transition: opacity 0.1s;
	}

	.footer-links a:hover {
		opacity: 0.7;
	}

	.copyright {
		text-align: center;
		font-size: 9px;
		color: #666;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.cols .wrap {
			grid-template-columns: repeat(2, 1fr);
		}

		.hero .wrap {
			grid-template-columns: 1fr;
		}

		.tabs .wrap {
			grid-template-columns: repeat(2, 1fr);
		}

		.bottom-links .wrap {
			grid-template-columns: 1fr;
		}
	}
</style>
