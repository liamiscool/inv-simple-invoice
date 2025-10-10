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

<div class="max-w-6xl space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-sm mb-1">Invoices</h1>
      <p class="text-xs text-gray-600">
        {data.invoices?.length || 0} invoices total
      </p>
    </div>
    <a
      href="/app/invoices/new"
      class="px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium"
    >
      Create Invoice
    </a>
  </div>
  
  <!-- Filters -->
  <div class="flex flex-col md:flex-row gap-4">
    <div class="flex-1 max-w-sm">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search invoices..."
        class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
      />
    </div>
    
    <div>
      <select
        bind:value={statusFilter}
        class="px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
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
    <div class="border border-thin rounded-sm p-12 text-center">
      <div class="space-y-3">
        <h2 class="text-xs">No invoices yet</h2>
        <p class="text-xs text-gray-600 max-w-sm mx-auto">
          Create your first invoice to start getting paid
        </p>
        {#if data.clients && data.clients.length > 0}
          <a
            href="/app/invoices/new"
            class="inline-flex items-center px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium"
          >
            Create Your First Invoice
          </a>
        {:else}
          <div class="space-y-2">
            <p class="text-xs text-gray-500">
              You need to add a client first
            </p>
            <a
              href="/app/clients/new"
              class="inline-flex items-center px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium"
            >
              Add Your First Client
            </a>
          </div>
        {/if}
      </div>
    </div>
  {:else if filteredInvoices.length === 0}
    <!-- No search results -->
    <div class="border border-thin rounded-sm p-8 text-center">
      <p class="text-xs text-gray-600">
        No invoices match your current filters
      </p>
    </div>
  {:else}
    <!-- Invoices table -->
    <div class="border border-thin rounded-sm overflow-hidden">
      <table class="w-full">
        <thead class="border-b border-thin bg-gray-50">
          <tr>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Number</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Client</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Amount</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Status</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Issue Date</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Due Date</th>
            <th class="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredInvoices as invoice}
            <tr class="border-b border-thin last:border-b-0 hover:bg-gray-50">
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
                <span class="text-xs">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-1 rounded-sm text-xs {statusColors[invoice.status as keyof typeof statusColors]}">
                  {statusLabels[invoice.status as keyof typeof statusLabels]}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {formatDate(invoice.issue_date)}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <a 
                    href="/app/invoices/{invoice.id}/edit"
                    class="text-xs text-gray-600 hover:text-black transition-colors"
                  >
                    Edit
                  </a>
                  <button
                    onclick={() => duplicateInvoice(invoice.id)}
                    class="text-xs text-gray-600 hover:text-black transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onclick={() => deleteInvoice(invoice.id, invoice.number)}
                    class="text-xs text-gray-600 hover:text-red-600 transition-colors"
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
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
      <div>
        Showing {filteredInvoices.length} of {data.invoices?.length || 0} invoices
      </div>
      
      {#if data.stats}
        <div class="flex items-center gap-6">
          <div>Outstanding: {formatCurrency(data.stats.total_outstanding, 'EUR')}</div>
          <div>Paid: {formatCurrency(data.stats.total_paid, 'EUR')}</div>
        </div>
      {/if}
    </div>
  {/if}
</div>