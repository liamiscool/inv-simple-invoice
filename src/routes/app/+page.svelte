<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  let stats = $state({
    drafts: 0,
    earnings: 0,
    outstanding: 0,
    clients: 0
  });

  let recentInvoices = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) return;

      // Get user's org_id
      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id, default_currency')
        .eq('id', user.user.id)
        .single();

      if (!profile) return;

      const orgId = profile.org_id;
      const currency = profile.default_currency || 'USD';

      // Get draft count
      const { count: draftCount } = await data.supabase
        .from('invoice')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'draft');

      // Get total earnings (paid + partially paid amounts)
      const { data: paidInvoices } = await data.supabase
        .from('invoice')
        .select('amount_paid')
        .eq('org_id', orgId)
        .in('status', ['paid', 'partially_paid']);

      const earnings = (paidInvoices || []).reduce((sum, inv) => {
        return sum + (inv.amount_paid || 0);
      }, 0);

      // Get outstanding amount (sent + partially_paid)
      const { data: unpaidInvoices } = await data.supabase
        .from('invoice')
        .select('total, amount_paid')
        .eq('org_id', orgId)
        .in('status', ['sent', 'partially_paid', 'overdue']);

      const outstanding = (unpaidInvoices || []).reduce((sum, inv) => {
        return sum + (inv.total - (inv.amount_paid || 0));
      }, 0);

      // Get client count
    const { count: clientCount } = await data.supabase
      .from('client')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

      // Get recent invoices
      const { data: invoices } = await data.supabase
        .from('invoice')
        .select(`
          id,
          number,
          status,
          total,
          currency,
          due_date,
          created_at,
          client:client_id (
            name,
            company
          )
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      stats = {
        drafts: draftCount || 0,
        earnings,
        outstanding,
        clients: clientCount || 0
      };

      recentInvoices = invoices || [];

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      loading = false;
    }
  });

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'draft': return 'text-gray-600';
      case 'sent': return 'text-blue-600';
      case 'paid': return 'text-green-600';
      case 'partially_paid': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      case 'void': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  }
</script>

<svelte:head>
  <title>Dashboard - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-8">
  <!-- Welcome -->
  <div>
    <h1 class="text-lg font-medium mb-1 dark:text-white">Dashboard</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Welcome back, {data.session?.user?.email?.split('@')[0] || 'User'}
    </p>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
    </div>
  {:else}
    <!-- Quick stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="border-l-2 border-black dark:border-white pl-4 py-2">
        <div class="text-2xl font-light mb-1 dark:text-white">{stats.drafts}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Draft invoices</div>
      </div>
      <div class="border-l-2 border-black dark:border-white pl-4 py-2">
        <div class="text-2xl font-light mb-1 dark:text-white">{formatCurrency(stats.earnings)}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Total earnings</div>
      </div>
      <div class="border-l-2 border-black dark:border-white pl-4 py-2">
        <div class="text-2xl font-light mb-1 dark:text-white">{formatCurrency(stats.outstanding)}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Outstanding</div>
      </div>
      <div class="border-l-2 border-black dark:border-white pl-4 py-2">
        <div class="text-2xl font-light mb-1 dark:text-white">{stats.clients}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Clients</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="space-y-4">
      <h2 class="text-base font-medium dark:text-white">Quick actions</h2>
      <div class="flex flex-wrap gap-2">
        <a
          href="/app/invoices/new"
          class="inline-flex items-center px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
        >
          Create invoice
        </a>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          Add client
        </a>
        <a
          href="/app/templates"
          class="inline-flex items-center px-5 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
        >
          Browse templates
        </a>
      </div>
    </div>

    <!-- Recent invoices -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-medium dark:text-white">Recent invoices</h2>
        <a href="/app/invoices" class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
          View all →
        </a>
      </div>

      {#if recentInvoices.length === 0}
        <div class="py-12 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">No invoices yet</p>
          <a
            href="/app/invoices/new"
            class="inline-flex items-center px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
          >
            Create your first invoice
          </a>
        </div>
      {:else}
        <div class="border-t border-b border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {#each recentInvoices as invoice}
            <a
              href="/app/invoices/{invoice.id}"
              class="block py-4 hover:bg-gray-50/50 dark:hover:bg-dark-hover transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3">
                    <div class="text-sm font-medium dark:text-white">{invoice.number}</div>
                    <div class="text-sm {getStatusColor(invoice.status)} capitalize">
                      {invoice.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-300 mt-0.5">
                    {invoice.client?.company || invoice.client?.name || 'Unknown client'}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium dark:text-white">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                  {#if invoice.due_date}
                    <div class="text-sm text-gray-500 dark:text-gray-300 mt-0.5">
                      Due {formatDate(invoice.due_date)}
                    </div>
                  {/if}
                </div>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>