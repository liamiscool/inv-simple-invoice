<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let searchQuery = $state('');
  let statusFilter = $state('all');
  
  const statusColors = {
    draft: 'text-gray-600 bg-gray-100',
    sent: 'text-blue-600 bg-blue-100', 
    partially_paid: 'text-orange-600 bg-orange-100',
    paid: 'text-green-600 bg-green-100',
    overdue: 'text-red-600 bg-red-100',
    void: 'text-gray-600 bg-gray-100'
  };
  
  const statusLabels = {
    draft: 'Draft',
    sent: 'Sent',
    partially_paid: 'Partial',
    paid: 'Paid',
    overdue: 'Overdue', 
    void: 'Void'
  };
  
  // Filter invoices based on search and status
  const filteredInvoices = $derived(
    data.invoices?.filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }) || []
  );
  
  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  async function duplicateInvoice(invoiceId: string) {
    try {
      // This will be implemented later
      alert('Duplicate feature coming soon!');
    } catch (err) {
      alert('Failed to duplicate invoice');
    }
  }
  
  async function deleteInvoice(invoiceId: string, invoiceNumber: string) {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await data.supabase
        .from('invoice')
        .delete()
        .eq('id', invoiceId);
        
      if (error) throw error;
      
      window.location.reload();
      
    } catch (err) {
      alert('Failed to delete invoice. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Invoices - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-base font-medium mb-1">Invoices</h1>
      <p class="text-xs text-gray-500">
        {data.invoices?.length || 0} total
      </p>
    </div>
    <a
      href="/app/invoices/new"
      class="px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
    >
      Create Invoice
    </a>
  </div>

  <!-- Filters -->
  <div class="flex flex-col md:flex-row gap-3">
    <div class="flex-1 max-w-sm">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search invoices..."
        class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
      />
    </div>

    <div>
      <select
        bind:value={statusFilter}
        class="px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="partially_paid">Partially Paid</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="void">Void</option>
      </select>
    </div>
  </div>
  
  {#if !data.invoices || data.invoices.length === 0}
    <!-- Empty state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-sm font-medium">No invoices yet</h2>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          Create your first invoice to start getting paid
        </p>
        {#if data.clients && data.clients.length > 0}
          <a
            href="/app/invoices/new"
            class="inline-flex items-center px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
          >
            Create Your First Invoice
          </a>
        {:else}
          <div class="space-y-3">
            <p class="text-xs text-gray-400">
              You need to add a client first
            </p>
            <a
              href="/app/clients/new"
              class="inline-flex items-center px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
            >
              Add Your First Client
            </a>
          </div>
        {/if}
      </div>
    </div>
  {:else if filteredInvoices.length === 0}
    <!-- No search results -->
    <div class="py-12 text-center">
      <p class="text-xs text-gray-500">
        No invoices match your current filters
      </p>
    </div>
  {:else}
    <!-- Invoices table -->
    <div class="border-t border-b border-gray-200">
      <table class="w-full">
        <thead class="border-b border-gray-200">
          <tr>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Number</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Client</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Amount</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Status</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Issue Date</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Due Date</th>
            <th class="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredInvoices as invoice}
            <tr class="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
              <td class="px-4 py-3">
                <a
                  href="/app/invoices/{invoice.id}"
                  class="text-xs hover:text-black transition-colors font-medium"
                >
                  {invoice.number}
                </a>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {invoice.client_name}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs font-medium">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 text-xs {statusColors[invoice.status as keyof typeof statusColors]}">
                  {statusLabels[invoice.status as keyof typeof statusLabels]}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-500">
                  {formatDate(invoice.issue_date)}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-500">
                  {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <a
                    href="/app/invoices/{invoice.id}/edit"
                    class="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Edit
                  </a>
                  <button
                    onclick={() => duplicateInvoice(invoice.id)}
                    class="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onclick={() => deleteInvoice(invoice.id, invoice.number)}
                    class="text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
      <div>
        Showing {filteredInvoices.length} of {data.invoices?.length || 0} invoices
      </div>

      {#if data.stats}
        <div class="flex items-center gap-6">
          <div>Outstanding: <span class="font-medium text-black">{formatCurrency(data.stats.total_outstanding, 'EUR')}</span></div>
          <div>Paid: <span class="font-medium text-black">{formatCurrency(data.stats.total_paid, 'EUR')}</span></div>
        </div>
      {/if}
    </div>
  {/if}
</div>