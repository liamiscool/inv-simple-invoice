<script lang="ts">
  import type { PageData } from './$types';
  import { EllipsisVertical } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';

  let { data }: { data: PageData } = $props();

  let searchQuery = $state('');
  let statusFilter = $state('all');
  let openDropdownId = $state<string | null>(null);
  
  const statusColors = {
    draft: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700',
    sent: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    partially_paid: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    paid: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    overdue: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    void: 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'
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
  
  function toggleDropdown(invoiceId: string) {
    openDropdownId = openDropdownId === invoiceId ? null : invoiceId;
  }

  function closeDropdown() {
    openDropdownId = null;
  }

  async function updateInvoiceStatus(invoiceId: string, newStatus: string) {
    try {
      const { error } = await data.supabase
        .from('invoice')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      window.location.reload();
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  }

  async function duplicateInvoice(invoiceId: string) {
    try {
      // Redirect to the detail page which has duplicate functionality
      window.location.href = `/app/invoices/${invoiceId}`;
    } catch (err) {
      alert('Failed to navigate to invoice');
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
      <h1 class="text-lg font-medium mb-1 dark:text-white">Invoices</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {data.invoices?.length || 0} total
      </p>
    </div>
    <a
      href="/app/invoices/new"
      class="px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
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
        class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-colors dark:bg-dark-input dark:text-white"
      />
    </div>

    <div>
      <select
        bind:value={statusFilter}
        class="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-colors dark:bg-dark-input dark:text-white"
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
        <h2 class="text-base font-medium dark:text-white">No invoices yet</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Create your first invoice to start getting paid
        </p>
        {#if data.clients && data.clients.length > 0}
          <a
            href="/app/invoices/new"
            class="inline-flex items-center px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
          >
            Create Your First Invoice
          </a>
        {:else}
          <div class="space-y-3">
            <p class="text-sm text-gray-400">
              You need to add a client first
            </p>
            <a
              href="/app/clients/new"
              class="inline-flex items-center px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
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
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No invoices match your current filters
      </p>
    </div>
  {:else}
    <!-- Desktop: Invoices table -->
    <div class="hidden md:block border-t border-b border-gray-200 dark:border-gray-700">
      <table class="w-full">
        <thead class="border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Number</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Client</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Amount</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Status</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Issue Date</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Due Date</th>
            <th class="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredInvoices as invoice}
            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-dark-hover">
              <td class="px-4 py-4">
                <a
                  href="/app/invoices/{invoice.id}"
                  class="text-sm hover:text-black dark:hover:text-white transition-colors font-medium dark:text-white"
                >
                  {invoice.number}
                </a>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {invoice.client_name}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-medium dark:text-white">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex px-2.5 py-1 text-sm {statusColors[invoice.status as keyof typeof statusColors]}">
                  {statusLabels[invoice.status as keyof typeof statusLabels]}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-300">
                  {formatDate(invoice.issue_date)}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-300">
                  {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </span>
              </td>
              <td class="px-4 py-4">
                <div class="relative">
                  <button
                    onclick={() => toggleDropdown(invoice.id)}
                    class="p-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <Icon src={EllipsisVertical} class="w-5 h-5" />
                  </button>

                  {#if openDropdownId === invoice.id}
                    <div
                      class="absolute right-0 top-8 w-48 bg-white dark:bg-dark-input border border-gray-200 dark:border-gray-700 shadow-lg z-10"
                      onmouseleave={closeDropdown}
                    >
                      <div class="py-1">
                        <button
                          onclick={() => { duplicateInvoice(invoice.id); closeDropdown(); }}
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                        >
                          Duplicate
                        </button>

                        {#if invoice.status === 'draft'}
                          <button
                            onclick={() => { updateInvoiceStatus(invoice.id, 'sent'); closeDropdown(); }}
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                          >
                            Mark as Sent
                          </button>
                        {/if}

                        {#if ['sent', 'partially_paid'].includes(invoice.status)}
                          <button
                            onclick={() => { updateInvoiceStatus(invoice.id, 'paid'); closeDropdown(); }}
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                          >
                            Mark as Paid
                          </button>
                        {/if}

                        {#if invoice.status !== 'void'}
                          <button
                            onclick={() => { updateInvoiceStatus(invoice.id, 'void'); closeDropdown(); }}
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                          >
                            Mark as Void
                          </button>
                        {/if}

                        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        <button
                          onclick={() => { deleteInvoice(invoice.id, invoice.number); closeDropdown(); }}
                          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile: Invoices cards -->
    <div class="block md:hidden space-y-3">
      {#each filteredInvoices as invoice}
        <div class="border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50/50 dark:hover:bg-dark-hover transition-colors">
          <a href="/app/invoices/{invoice.id}" class="block">
            <!-- Header: Number + Status -->
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm font-medium hover:text-black dark:hover:text-white transition-colors dark:text-white">
                {invoice.number}
              </div>
              <span class="inline-flex px-2.5 py-1 text-sm {statusColors[invoice.status as keyof typeof statusColors]}">
                {statusLabels[invoice.status as keyof typeof statusLabels]}
              </span>
            </div>

            <!-- Client + Amount -->
            <div class="mb-3">
              <div class="text-sm text-gray-600 dark:text-gray-300 mb-1">
                {invoice.client_name}
              </div>
              <div class="text-base font-medium dark:text-white">
                {formatCurrency(invoice.total, invoice.currency)}
              </div>
            </div>

            <!-- Dates -->
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
              <div>Issued: {formatDate(invoice.issue_date)}</div>
              {#if invoice.due_date}
                <div>Due: {formatDate(invoice.due_date)}</div>
              {/if}
            </div>
          </a>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onclick={() => duplicateInvoice(invoice.id)}
              class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Copy
            </button>
            <button
              onclick={() => deleteInvoice(invoice.id, invoice.number)}
              class="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Summary -->
    <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
      <div>
        Showing {filteredInvoices.length} of {data.invoices?.length || 0} invoices
      </div>

      {#if data.stats}
        <div class="flex items-center gap-6">
          <div>Outstanding: <span class="font-medium text-black dark:text-white">{formatCurrency(data.stats.total_outstanding, 'EUR')}</span></div>
          <div>Paid: <span class="font-medium text-black dark:text-white">{formatCurrency(data.stats.total_paid, 'EUR')}</span></div>
        </div>
      {/if}
    </div>
  {/if}
</div>