<script lang="ts">
  import type { PageData } from './$types';
  import { EllipsisVertical } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { formatDate } from '$lib/utils/dateFormat';
  import { getUserDateFormat } from '$lib/utils/userPreferences';

  let { data }: { data: PageData } = $props();

  let searchQuery = $state('');
  let statusFilter = $state('all');
  let openDropdownId = $state<string | null>(null);

  // Bulk selection state
  let selectedInvoiceIds = $state(new Set<string>());
  let isBulkActionLoading = $state(false);
  
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

  // Derived state for bulk selection
  const selectedInvoices = $derived(
    filteredInvoices.filter(inv => selectedInvoiceIds.has(inv.id))
  );

  const canMarkAsPaid = $derived(
    selectedInvoices.length > 0 &&
    selectedInvoices.every(inv => ['sent', 'partially_paid'].includes(inv.status))
  );

  const allVisibleSelected = $derived(
    filteredInvoices.length > 0 &&
    filteredInvoices.every(inv => selectedInvoiceIds.has(inv.id))
  );
  
  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  function formatDateForDisplay(dateString: string) {
    const userDateFormat = getUserDateFormat(data.profile);
    return formatDate(dateString, userDateFormat);
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
        .update({ status: newStatus } as any)
        .eq('id', invoiceId);

      if (error) throw error;

      window.location.reload();
    } catch (err) {
      alert('Failed to update status. Please try again.');
    }
  }

  function handleRowClick(event: MouseEvent, invoiceId: string) {
    // Don't navigate if clicking checkbox column or action column
    const target = event.target as HTMLElement;

    // Check if click is on checkbox, dropdown button, or their children
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest('button') ||
      target.closest('.relative') // dropdown container
    ) {
      return;
    }

    // Navigate to invoice detail page
    window.location.href = `/app/invoices/${invoiceId}`;
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

  // Bulk selection functions
  function toggleSelection(invoiceId: string) {
    const newSet = new Set(selectedInvoiceIds);
    if (newSet.has(invoiceId)) {
      newSet.delete(invoiceId);
    } else {
      newSet.add(invoiceId);
    }
    selectedInvoiceIds = newSet;
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      selectedInvoiceIds = new Set();
    } else {
      selectedInvoiceIds = new Set(filteredInvoices.map(inv => inv.id));
    }
  }

  function clearSelection() {
    selectedInvoiceIds = new Set();
  }

  // Bulk operations
  async function bulkMarkAsPaid() {
    if (!canMarkAsPaid) return;

    isBulkActionLoading = true;

    try {
      const { error } = await data.supabase
        .from('invoice')
        .update({ status: 'paid' as any })
        .in('id', Array.from(selectedInvoiceIds));

      if (error) throw error;

      alert(`${selectedInvoiceIds.size} invoice(s) marked as paid`);
      window.location.reload();

    } catch (err) {
      alert('Failed to update invoices. Please try again.');
    } finally {
      isBulkActionLoading = false;
    }
  }

  async function bulkDuplicate() {
    isBulkActionLoading = true;

    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Fetch selected invoices with items
      const { data: invoicesToDuplicate, error: fetchError } = await data.supabase
        .from('invoice')
        .select(`
          *,
          items:invoice_item(*)
        `)
        .in('id', Array.from(selectedInvoiceIds));

      if (fetchError) throw fetchError;
      if (!invoicesToDuplicate) throw new Error('No invoices found');

      // Create duplicates for each selected invoice
      for (const invoice of invoicesToDuplicate) {
        // Get next invoice number
        const { data: nextNumber } = await data.supabase
          .rpc('next_invoice_number', { p_org_id: profile.org_id });

        // Insert new invoice
        const { data: newInvoice, error: invoiceError } = await data.supabase
          .from('invoice')
          .insert({
            org_id: invoice.org_id,
            client_id: invoice.client_id,
            template_id: invoice.template_id,
            number: nextNumber,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: invoice.due_date,
            currency: invoice.currency,
            status: 'draft',
            notes: invoice.notes,
            subtotal: invoice.subtotal,
            tax_total: invoice.tax_total,
            total: invoice.total
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;
        if (!newInvoice) throw new Error('Failed to create invoice');

        // Insert line items
        if (invoice.items && invoice.items.length > 0) {
          const itemsToInsert = invoice.items.map((item: any) => ({
            invoice_id: newInvoice.id,
            position: item.position,
            description: item.description,
            qty: item.qty,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            line_total: item.line_total
          }));

          await data.supabase.from('invoice_item').insert(itemsToInsert);
        }
      }

      alert(`${invoicesToDuplicate.length} invoice(s) duplicated`);
      window.location.reload();

    } catch (err) {
      console.error('Bulk duplicate error:', err);
      alert('Failed to duplicate invoices. Please try again.');
    } finally {
      isBulkActionLoading = false;
    }
  }

  async function bulkDelete() {
    const count = selectedInvoiceIds.size;

    if (!confirm(`Delete ${count} invoice(s)? This action cannot be undone.`)) {
      return;
    }

    isBulkActionLoading = true;

    try {
      const { error } = await data.supabase
        .from('invoice')
        .delete()
        .in('id', Array.from(selectedInvoiceIds));

      if (error) throw error;

      alert(`${count} invoice(s) deleted`);
      window.location.reload();

    } catch (err) {
      alert('Failed to delete invoices. Please try again.');
    } finally {
      isBulkActionLoading = false;
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

  <!-- Bulk Action Bar (Desktop) -->
  {#if selectedInvoiceIds.size > 0}
    <div class="hidden md:flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-dark-input border-t border-b border-gray-200 dark:border-gray-700">
      <!-- Left: Selection count -->
      <div class="text-sm text-gray-600 dark:text-gray-300">
        <span class="font-medium">{selectedInvoiceIds.size}</span> invoice{selectedInvoiceIds.size !== 1 ? 's' : ''} selected
      </div>

      <!-- Center: Action buttons -->
      <div class="flex items-center gap-2">
        <button
          onclick={bulkMarkAsPaid}
          disabled={!canMarkAsPaid || isBulkActionLoading}
          class="px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark as Paid
        </button>

        <button
          onclick={bulkDuplicate}
          disabled={isBulkActionLoading}
          class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Duplicate
        </button>

        <button
          onclick={bulkDelete}
          disabled={isBulkActionLoading}
          class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>

      <!-- Right: Clear button -->
      <button
        onclick={clearSelection}
        class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
      >
        Clear
      </button>
    </div>
  {/if}
  
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
            <th class="w-12 px-4 py-4">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onchange={toggleSelectAll}
                class="w-4 h-4 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white cursor-pointer accent-black dark:accent-white"
              />
            </th>
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
            <tr
              class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-dark-hover cursor-pointer {selectedInvoiceIds.has(invoice.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}"
              onclick={(e) => handleRowClick(e, invoice.id)}
            >
              <td class="px-4 py-4" onclick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedInvoiceIds.has(invoice.id)}
                  onchange={() => toggleSelection(invoice.id)}
                  class="w-4 h-4 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white cursor-pointer accent-black dark:accent-white"
                />
              </td>
              <td class="px-4 py-4">
                <span class="text-sm hover:text-black dark:hover:text-white transition-colors font-medium dark:text-white">
                  {invoice.number}
                </span>
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
                  {formatDateForDisplay(invoice.issue_date)}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-300">
                  {invoice.due_date ? formatDateForDisplay(invoice.due_date) : '—'}
                </span>
              </td>
              <td class="px-4 py-4" onclick={(e) => e.stopPropagation()}>
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

                        <!-- Status Change Submenu -->
                        <div class="relative group">
                          <button
                            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors flex items-center justify-between"
                          >
                            Change Status
                            <span class="text-xs">›</span>
                          </button>

                          <!-- Submenu (appears on hover) -->
                          <div class="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-dark-input border border-gray-200 dark:border-gray-700 shadow-lg hidden group-hover:block z-20">
                            <div class="py-1">
                              {#if invoice.status !== 'draft'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'draft'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Draft
                                </button>
                              {/if}

                              {#if invoice.status !== 'sent'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'sent'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Sent
                                </button>
                              {/if}

                              {#if invoice.status !== 'partially_paid'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'partially_paid'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Partially Paid
                                </button>
                              {/if}

                              {#if invoice.status !== 'paid'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'paid'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Paid
                                </button>
                              {/if}

                              {#if invoice.status !== 'overdue'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'overdue'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Overdue
                                </button>
                              {/if}

                              {#if invoice.status !== 'void'}
                                <button
                                  onclick={() => { updateInvoiceStatus(invoice.id, 'void'); closeDropdown(); }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
                                >
                                  Void
                                </button>
                              {/if}
                            </div>
                          </div>
                        </div>

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
        <div
          class="border border-gray-200 dark:border-gray-700 p-4 cursor-pointer {selectedInvoiceIds.has(invoice.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}"
          onclick={() => window.location.href = `/app/invoices/${invoice.id}`}
        >
          <!-- Header: Checkbox + Number + Status -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                onclick={(e) => e.stopPropagation()}
                checked={selectedInvoiceIds.has(invoice.id)}
                onchange={() => toggleSelection(invoice.id)}
                class="w-4 h-4 mt-1 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white cursor-pointer accent-black dark:accent-white"
              />
              <span class="text-sm font-medium hover:text-black dark:hover:text-white transition-colors dark:text-white">
                {invoice.number}
              </span>
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
            <div>Issued: {formatDateForDisplay(invoice.issue_date)}</div>
            {#if invoice.due_date}
              <div>Due: {formatDateForDisplay(invoice.due_date)}</div>
            {/if}
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700" onclick={(e) => e.stopPropagation()}>
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

  <!-- Mobile: Sticky bottom action bar -->
  {#if selectedInvoiceIds.size > 0}
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
      <div class="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {selectedInvoiceIds.size} selected
      </div>
      <div class="flex flex-col gap-2">
        <button
          onclick={bulkMarkAsPaid}
          disabled={!canMarkAsPaid || isBulkActionLoading}
          class="w-full px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mark as Paid
        </button>
        <div class="flex gap-2">
          <button
            onclick={bulkDuplicate}
            disabled={isBulkActionLoading}
            class="flex-1 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Duplicate
          </button>
          <button
            onclick={bulkDelete}
            disabled={isBulkActionLoading}
            class="flex-1 px-5 py-2.5 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
        <button
          onclick={clearSelection}
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          Clear Selection
        </button>
      </div>
    </div>
  {/if}
</div>