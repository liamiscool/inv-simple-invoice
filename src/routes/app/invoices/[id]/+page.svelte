<script lang="ts">
  import type { PageData } from './$types';
  import { calculateMaxItems } from '$lib/templates';

  let { data }: { data: PageData } = $props();

  const invoice: any = data.invoice;

  let isLoading = $state(false);
  let message = $state('');
  let error = $state('');
  let pdfLoading = $state(false);
  
  // Email modal state
  let showEmailModal = $state(false);
  let emailForm = $state({
    to: '',
    subject: '',
    message: '',
    includePdf: true
  });
  let emailLoading = $state(false);
  let emailError = $state('');
  let emailSuccess = $state('');
  
  const statusColors = {
    draft: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    sent: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    partially_paid: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
    paid: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    overdue: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    void: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
  };
  
  const statusLabels = {
    draft: 'Draft',
    sent: 'Sent',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue',
    void: 'Void'
  };

  // Check if invoice exceeds template capacity
  const hasItemOverflow = $derived(() => {
    if (!data.invoice || !data.template) return false;
    const maxItems = calculateMaxItems(data.template.spec);
    return data.invoice.items.length > maxItems;
  });

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  async function updateStatus(newStatus: string) {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { error: updateError } = await data.supabase
        .from('invoice')
        .update({ status: newStatus } as any)
        .eq('id', invoice.id);
        
      if (updateError) throw updateError;
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (err: any) {
      error = err.message || 'Failed to update status';
    } finally {
      isLoading = false;
    }
  }
  
  async function duplicateInvoice() {
    isLoading = true;
    error = '';
    
    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');
      
      // Get user's org_id
      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single() as { data: any };

      if (!profile) throw new Error('Profile not found');

      // Generate new invoice number
      const { data: nextNumber, error: numberError } = await data.supabase
        .rpc('next_invoice_number', { p_org_id: profile.org_id } as any);

      if (numberError) throw numberError;

      // Create duplicate invoice
      const invoiceData: any = {
        org_id: invoice.org_id,
        client_id: invoice.client_id,
        template_id: invoice.template_id,
        number: nextNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: invoice.due_date,
        currency: invoice.currency,
        status: 'draft',
        notes: invoice.notes,
        include_contact_name: invoice.include_contact_name || false,
        subtotal: invoice.subtotal,
        tax_total: invoice.tax_total,
        total: invoice.total
      };
      const { data: newInvoice, error: invoiceError } = await data.supabase
        .from('invoice')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Duplicate line items
      const newInv: any = newInvoice;
      const itemsToInsert = invoice.items.map((item: any) => ({
        invoice_id: newInv.id,
        position: item.position,
        description: item.description,
        qty: item.qty,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        line_total: item.line_total
      }));
      
      const { error: itemsError } = await data.supabase
        .from('invoice_item')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;

      // Redirect to new invoice
      window.location.href = `/app/invoices/${newInv.id}`;
      
    } catch (err: any) {
      error = err.message || 'Failed to duplicate invoice';
    } finally {
      isLoading = false;
    }
  }
  
  async function deleteInvoice() {
    if (!confirm(`Are you sure you want to delete invoice ${data.invoice.number}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await data.supabase
        .from('invoice')
        .delete()
        .eq('id', data.invoice.id);
        
      if (error) throw error;
      
      // Redirect to invoices list
      window.location.href = '/app/invoices';
      
    } catch (err) {
      error = 'Failed to delete invoice';
    }
  }
  
  function openEmailModal() {
    // Build sender name for subject (matches send endpoint logic)
    const senderName = data.userProfile?.company_name
      ? `${data.userProfile.company_name} (${data.userProfile.full_name})`
      : data.userProfile?.full_name || 'Your Company';

    // Pre-fill email form
    emailForm.to = data.invoice.client.email || '';
    emailForm.subject = `Invoice ${data.invoice.number} from ${senderName}`;
    emailForm.message = '';
    emailForm.includePdf = true;

    emailError = '';
    emailSuccess = '';
    showEmailModal = true;
  }
  
  function closeEmailModal() {
    showEmailModal = false;
    emailForm = {
      to: '',
      subject: '',
      message: '',
      includePdf: true
    };
  }
  
  async function sendInvoiceEmail(e: Event) {
    e.preventDefault();

    if (!emailForm.to) {
      emailError = 'Recipient email is required';
      return;
    }

    emailLoading = true;
    emailError = '';
    emailSuccess = '';

    try {
      const response = await fetch(`/app/invoices/${data.invoice.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailForm.to,
          subject: emailForm.subject || undefined,
          message: emailForm.message || undefined,
          include_pdf: emailForm.includePdf
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      emailSuccess = 'Invoice sent successfully!';

      // Close modal after a delay
      setTimeout(() => {
        closeEmailModal();
        // Refresh page to show updated status
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      emailError = err.message || 'Failed to send invoice';
    } finally {
      emailLoading = false;
    }
  }

  async function handleDownloadPDF(e: Event) {
    e.preventDefault();

    pdfLoading = true;

    try {
      // Open PDF in new tab (will redirect to stored PDF or generate it)
      const pdfUrl = `/app/invoices/${data.invoice.id}/pdf`;
      const newWindow = window.open(pdfUrl, '_blank');

      // Give it a moment to start loading, then reset the button
      setTimeout(() => {
        pdfLoading = false;
      }, 1000);

    } catch (err) {
      pdfLoading = false;
      error = 'Failed to open PDF';
    }
  }
</script>

<svelte:head>
  <title>Invoice {data.invoice?.number} - inv</title>
</svelte:head>

{#if !data.invoice}
  <div class="max-w-2xl">
    <div class="py-16 text-center">
      <h1 class="text-base font-medium mb-2 dark:text-white">Invoice not found</h1>
      <p class="text-sm text-gray-500 mb-4 dark:text-gray-400">
        The invoice you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <a
        href="/app/invoices"
        class="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 dark:bg-dark-button dark:hover:bg-dark-button-hover"
      >
        Back to Invoices
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-3xl space-y-12">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-lg font-medium dark:text-white">Invoice {data.invoice.number}</h1>
          <span class="inline-flex px-2.5 py-1 text-sm {statusColors[data.invoice.status as keyof typeof statusColors]}">
            {statusLabels[data.invoice.status as keyof typeof statusLabels]}
          </span>
          {#if hasItemOverflow()}
            <span class="inline-flex px-2.5 py-1 text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              ⚠️ Template Limit
            </span>
          {/if}
        </div>
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-xs">
          <a href="/app/invoices" class="text-gray-400 hover:text-black transition-colors dark:hover:text-white">Invoices</a>
          <span class="text-gray-400">/</span>
          <span class="text-gray-600 dark:text-gray-400">{data.invoice.number}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if data.invoice.status === 'draft'}
          <a
            href="/app/invoices/{data.invoice.id}/edit"
            class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
          >
            Edit
          </a>
        {/if}

        <button
          onclick={duplicateInvoice}
          disabled={isLoading}
          class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
        >
          Duplicate
        </button>

        {#if data.invoice.status === 'draft'}
          <button
            onclick={() => updateStatus('sent')}
            disabled={isLoading}
            class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
          >
            Mark as Sent
          </button>
        {/if}

        {#if ['sent', 'partially_paid'].includes(data.invoice.status)}
          <button
            onclick={() => updateStatus('paid')}
            disabled={isLoading}
            class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
          >
            Mark as Paid
          </button>
        {/if}

        <button
          onclick={deleteInvoice}
          class="px-4 py-2 text-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors dark:border-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
        >
          Delete
        </button>
      </div>
    </div>

    {#if hasItemOverflow()}
      <div class="px-4 py-3 text-sm bg-orange-50 border border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400">
        <div class="flex items-start gap-2">
          <span class="mt-0.5">⚠️</span>
          <div>
            <p class="font-medium mb-1">PDF May Have Display Issues</p>
            <p class="text-xs opacity-90">
              This invoice has {data.invoice.items.length} items, but the template ({data.template?.title}) can only display {calculateMaxItems(data.template.spec)} items properly.
              Items may overflow into the totals section. Consider splitting into multiple invoices.
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Invoice Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Client Information -->
      <div class="space-y-3">
        <h2 class="text-base font-medium dark:text-white">Bill To</h2>
        <div class="space-y-1 text-sm">
          <div class="font-medium dark:text-white">{data.invoice.client.name}</div>
          {#if data.invoice.client.company}
            <div class="text-gray-600 dark:text-gray-300">{data.invoice.client.company}</div>
          {/if}
          {#if data.invoice.client.legal_name}
            <div class="text-gray-600 dark:text-gray-300">Legal: {data.invoice.client.legal_name}</div>
          {/if}
          {#if data.invoice.client.company_address}
            <div class="text-gray-500 whitespace-pre-wrap dark:text-gray-400">{data.invoice.client.company_address}</div>
          {/if}
          {#if data.invoice.client.tax_id}
            <div class="text-gray-500 dark:text-gray-400">Tax ID: {data.invoice.client.tax_id}</div>
          {/if}
          {#if data.invoice.client.email}
            <div class="text-gray-500 dark:text-gray-400">{data.invoice.client.email}</div>
          {/if}
        </div>
      </div>

      <!-- Invoice Information -->
      <div class="space-y-3">
        <h2 class="text-base font-medium dark:text-white">Invoice Details</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Number:</span>
            <span class="dark:text-white">{data.invoice.number}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Issue Date:</span>
            <span class="dark:text-white">{formatDate(data.invoice.issue_date)}</span>
          </div>
          {#if data.invoice.due_date}
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Due Date:</span>
              <span class="dark:text-white">{formatDate(data.invoice.due_date)}</span>
            </div>
          {/if}
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Currency:</span>
            <span class="dark:text-white">{data.invoice.currency}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Status:</span>
            <span class="{statusColors[data.invoice.status as keyof typeof statusColors]} px-2.5 py-1 rounded-sm">
              {statusLabels[data.invoice.status as keyof typeof statusLabels]}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Line Items -->
    <div class="space-y-4">
      <h2 class="text-base font-medium dark:text-white">Items</h2>

      <!-- Desktop: Table -->
      <div class="hidden md:block">
        <div class="border-t border-b border-gray-200 py-4 dark:border-gray-700">
          <table class="w-full">
            <thead>
              <tr class="text-left">
                <th class="text-sm text-gray-500 pb-3 font-medium dark:text-gray-400">Description</th>
                <th class="text-sm text-gray-500 pb-3 font-medium text-right dark:text-gray-400">Qty</th>
                <th class="text-sm text-gray-500 pb-3 font-medium text-right dark:text-gray-400">Unit Price</th>
                <th class="text-sm text-gray-500 pb-3 font-medium text-right dark:text-gray-400">Tax</th>
                <th class="text-sm text-gray-500 pb-3 font-medium text-right dark:text-gray-400">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              {#each data.invoice.items as item}
                <tr>
                  <td class="py-3 text-sm dark:text-white">{item.description}</td>
                  <td class="py-3 text-sm text-right dark:text-white">{item.qty}</td>
                  <td class="py-3 text-sm text-right dark:text-white">{formatCurrency(item.unit_price, data.invoice.currency)}</td>
                  <td class="py-3 text-sm text-right dark:text-white">{(item.tax_rate * 100).toFixed(1)}%</td>
                  <td class="py-3 text-sm text-right dark:text-white">{formatCurrency(item.line_total + (item.line_total * item.tax_rate), data.invoice.currency)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mobile: Stacked List -->
      <div class="block md:hidden border-t border-b border-gray-200 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700">
        {#each data.invoice.items as item}
          <div class="py-4">
            <!-- Description -->
            <div class="text-sm font-medium mb-2 dark:text-white">{item.description}</div>

            <!-- Details Grid -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500 dark:text-gray-400">Quantity:</div>
              <div class="text-right dark:text-white">{item.qty}</div>

              <div class="text-gray-500 dark:text-gray-400">Unit Price:</div>
              <div class="text-right dark:text-white">{formatCurrency(item.unit_price, data.invoice.currency)}</div>

              <div class="text-gray-500 dark:text-gray-400">Tax:</div>
              <div class="text-right dark:text-white">{(item.tax_rate * 100).toFixed(1)}%</div>

              <div class="text-gray-500 font-medium dark:text-gray-400">Total:</div>
              <div class="text-right font-medium dark:text-white">{formatCurrency(item.line_total + (item.line_total * item.tax_rate), data.invoice.currency)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Totals -->
    <div class="bg-gray-50 border border-gray-200 p-6 dark:bg-dark-input dark:border-gray-700">
      <h2 class="text-base mb-6 font-medium dark:text-white">Summary</h2>

      <div class="max-w-sm ml-auto space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
          <span class="dark:text-white">{formatCurrency(data.invoice.subtotal, data.invoice.currency)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600 dark:text-gray-400">Tax:</span>
          <span class="dark:text-white">{formatCurrency(data.invoice.tax_total, data.invoice.currency)}</span>
        </div>
        <div class="border-t border-gray-300 pt-3 mt-3 dark:border-gray-700">
          <div class="flex justify-between text-base font-medium">
            <span class="dark:text-white">Total:</span>
            <span class="dark:text-white">{formatCurrency(data.invoice.total, data.invoice.currency)}</span>
          </div>
        </div>

        {#if data.invoice.amount_paid > 0}
          <div class="border-t border-gray-300 pt-3 mt-3 dark:border-gray-700">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">Amount Paid:</span>
              <span class="dark:text-white">{formatCurrency(data.invoice.amount_paid, data.invoice.currency)}</span>
            </div>
            <div class="flex justify-between text-sm font-medium mt-2">
              <span class="dark:text-white">Amount Due:</span>
              <span class="dark:text-white">{formatCurrency(data.invoice.total - data.invoice.amount_paid, data.invoice.currency)}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Notes -->
    {#if data.invoice.notes}
      <div class="space-y-3">
        <h2 class="text-base font-medium dark:text-white">Notes</h2>
        <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed dark:text-gray-300">{data.invoice.notes}</p>
      </div>
    {/if}

    <!-- Payments (if any) -->
    {#if data.invoice.payments && data.invoice.payments.length > 0}
      <div class="space-y-4">
        <h2 class="text-base font-medium dark:text-white">Payment History</h2>

        <div class="border-t border-b border-gray-200 divide-y divide-gray-100 dark:border-gray-700 dark:divide-gray-700">
          {#each data.invoice.payments as payment}
            <div class="flex justify-between items-center py-4">
              <div>
                <div class="text-sm font-medium dark:text-white">{formatDate(payment.date)}</div>
                {#if payment.notes}
                  <div class="text-sm text-gray-500 mt-1 dark:text-gray-400">{payment.notes}</div>
                {/if}
              </div>
              <div class="text-sm font-medium dark:text-white">
                {formatCurrency(payment.amount, data.invoice.currency)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-8">
      <button
        onclick={handleDownloadPDF}
        disabled={pdfLoading}
        class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
      >
        {#if pdfLoading}
          <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating PDF...
        {:else}
          View/Download PDF
        {/if}
      </button>

      {#if ['draft', 'sent'].includes(data.invoice.status)}
        <button
          onclick={openEmailModal}
          disabled={isLoading}
          class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 font-medium disabled:opacity-50 dark:bg-dark-button dark:hover:bg-dark-button-hover"
        >
          Send to Client
        </button>
      {/if}
    </div>
    
    <!-- Messages -->
    {#if message}
      <div class="text-center">
        <p class="text-xs text-green-600 dark:text-green-400">{message}</p>
      </div>
    {/if}

    {#if error}
      <div class="text-center">
        <p class="text-xs text-red-600 dark:text-red-400">{error}</p>
      </div>
    {/if}
  </div>
{/if}

<!-- Email Modal -->
{#if showEmailModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-sm border border-thin max-w-md w-full max-h-[90vh] overflow-y-auto dark:bg-dark-bg dark:border-gray-700">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium dark:text-white">Send Invoice via Email</h3>
          <button
            onclick={closeEmailModal}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <form onsubmit={sendInvoiceEmail} class="space-y-4">
          <div>
            <label for="email-to" class="block text-xs text-gray-600 mb-1 dark:text-gray-400">
              To <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="email-to"
              type="email"
              bind:value={emailForm.to}
              placeholder="client@example.com"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:border-gray-700 dark:text-white dark:focus:border-white dark:placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label for="email-subject" class="block text-xs text-gray-600 mb-1 dark:text-gray-400">Subject</label>
            <input
              id="email-subject"
              type="text"
              bind:value={emailForm.subject}
              placeholder="Invoice {data.invoice.number}"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:border-gray-700 dark:text-white dark:focus:border-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label for="email-message" class="block text-xs text-gray-600 mb-1 dark:text-gray-400">Additional Message</label>
            <textarea
              id="email-message"
              bind:value={emailForm.message}
              placeholder="Optional message to include in the email..."
              rows="3"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors resize-none dark:bg-dark-input dark:border-gray-700 dark:text-white dark:focus:border-white dark:placeholder-gray-500"
            ></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input
              id="include-pdf"
              type="checkbox"
              bind:checked={emailForm.includePdf}
              class="rounded border-thin dark:bg-dark-input dark:border-gray-700"
            />
            <label for="include-pdf" class="text-xs text-gray-600 dark:text-gray-400">
              Attach PDF invoice
            </label>
          </div>
          
          {#if emailError}
            <div class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm p-3 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800">
              {emailError}
            </div>
          {/if}

          {#if emailSuccess}
            <div class="text-xs text-green-600 bg-green-50 border border-green-200 rounded-sm p-3 dark:text-green-400 dark:bg-green-900/30 dark:border-green-800">
              {emailSuccess}
            </div>
          {/if}

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onclick={closeEmailModal}
              class="px-4 py-2 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={emailLoading || !emailForm.to}
              class="px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-button dark:hover:bg-dark-button-hover"
            >
              {emailLoading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}