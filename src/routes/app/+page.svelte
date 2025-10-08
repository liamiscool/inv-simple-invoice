<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  let stats = $state({
    drafts: 0,
    sentThisMonth: 0,
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

      // Get sent this month count
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: sentCount } = await data.supabase
        .from('invoice')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['sent', 'partially_paid'])
        .gte('created_at', startOfMonth.toISOString());

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
        sentThisMonth: sentCount || 0,
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

<div class="max-w-5xl space-y-6">
  <!-- Welcome -->
  <div>
    <h1 class="text-sm mb-2">Dashboard</h1>
    <p class="text-xs text-gray-600">
      Welcome back, {data.session?.user?.email?.split('@')[0] || 'User'}
    </p>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <p class="text-xs text-gray-600">Loading...</p>
    </div>
  {:else}
    <!-- Quick stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="border border-thin rounded-sm p-4">
        <div class="text-2xl font-light mb-1">{stats.drafts}</div>
        <div class="text-xs text-gray-600">Draft invoices</div>
      </div>
      <div class="border border-thin rounded-sm p-4">
        <div class="text-2xl font-light mb-1">{stats.sentThisMonth}</div>
        <div class="text-xs text-gray-600">Sent this month</div>
      </div>
      <div class="border border-thin rounded-sm p-4">
        <div class="text-2xl font-light mb-1">{formatCurrency(stats.outstanding)}</div>
        <div class="text-xs text-gray-600">Outstanding</div>
      </div>
      <div class="border border-thin rounded-sm p-4">
        <div class="text-2xl font-light mb-1">{stats.clients}</div>
        <div class="text-xs text-gray-600">Clients</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="space-y-4">
      <h2 class="text-xs">Quick actions</h2>
      <div class="flex flex-wrap gap-3">
        <a
          href="/app/invoices/new"
          class="inline-flex items-center px-4 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75"
        >
          Create invoice
        </a>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-4 py-2 border border-thin text-xs hover:border-black transition-colors duration-75"
        >
          Add client
        </a>
        <a
          href="/app/templates"
          class="inline-flex items-center px-4 py-2 border border-thin text-xs hover:border-black transition-colors duration-75"
        >
          Browse templates
        </a>
      </div>
    </div>

    <!-- Recent invoices -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xs">Recent invoices</h2>
        <a href="/app/invoices" class="text-xs text-gray-600 hover:text-black transition-colors">
          View all →
        </a>
      </div>

      {#if recentInvoices.length === 0}
        <div class="border border-thin rounded-sm p-8 text-center">
          <p class="text-xs text-gray-600 mb-3">No invoices yet</p>
          <a
            href="/app/invoices/new"
            class="inline-flex items-center px-4 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75"
          >
            Create your first invoice
          </a>
        </div>
      {:else}
        <div class="border border-thin rounded-sm divide-y divide-thin">
          {#each recentInvoices as invoice}
            <a
              href="/app/invoices/{invoice.id}"
              class="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3">
                    <div class="text-xs font-medium">{invoice.number}</div>
                    <div class="text-xs {getStatusColor(invoice.status)} capitalize">
                      {invoice.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div class="text-xs text-gray-600 mt-1">
                    {invoice.client?.company || invoice.client?.name || 'Unknown client'}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-medium">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </div>
                  {#if invoice.due_date}
                    <div class="text-xs text-gray-600 mt-1">
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