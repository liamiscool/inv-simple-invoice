<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
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
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue', 
    void: 'Void'
  };
  
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
        .update({ status: newStatus })
        .eq('id', data.invoice.id);
        
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
        .single();
        
      if (!profile) throw new Error('Profile not found');
      
      // Generate new invoice number
      const { data: nextNumber, error: numberError } = await data.supabase
        .rpc('next_invoice_number', { p_org_id: profile.org_id });
        
      if (numberError) throw numberError;
      
      // Create duplicate invoice
      const { data: newInvoice, error: invoiceError } = await data.supabase
        .from('invoice')
        .insert({
          org_id: data.invoice.org_id,
          client_id: data.invoice.client_id,
          template_id: data.invoice.template_id,
          number: nextNumber,
          issue_date: new Date().toISOString().split('T')[0],
          due_date: data.invoice.due_date,
          currency: data.invoice.currency,
          status: 'draft',
          notes: data.invoice.notes,
          subtotal: data.invoice.subtotal,
          tax_total: data.invoice.tax_total,
          total: data.invoice.total
        })
        .select()
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Duplicate line items
      const itemsToInsert = data.invoice.items.map(item => ({
        invoice_id: newInvoice.id,
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
      window.location.href = `/app/invoices/${newInvoice.id}`;
      
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
      <h1 class="text-base font-medium mb-2">Invoice not found</h1>
      <p class="text-sm text-gray-500 mb-4">
        The invoice you're looking for doesn't exist or you don't have permission to view it.
      </p>
      <a
        href="/app/invoices"
        class="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75"
      >
        Back to Invoices
      </a>
    </div>
  </div>
{:else}
  <div class="max-w-6xl space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <h1 class="text-lg font-medium">Invoice {data.invoice.number}</h1>
          <span class="inline-flex px-2.5 py-1 text-sm {statusColors[data.invoice.status as keyof typeof statusColors]}">
            {statusLabels[data.invoice.status as keyof typeof statusLabels]}
          </span>
        </div>
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-xs">
          <a href="/app/invoices" class="text-gray-400 hover:text-black transition-colors">Invoices</a>
          <span class="text-gray-400">/</span>
          <span class="text-gray-600">{data.invoice.number}</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={duplicateInvoice}
          disabled={isLoading}
          class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Duplicate
        </button>

        {#if data.invoice.status === 'draft'}
          <button
            onclick={() => updateStatus('sent')}
            disabled={isLoading}
            class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Mark as Sent
          </button>
        {/if}

        {#if ['sent', 'partially_paid'].includes(data.invoice.status)}
          <button
            onclick={() => updateStatus('paid')}
            disabled={isLoading}
            class="px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Mark as Paid
          </button>
        {/if}

        <button
          onclick={deleteInvoice}
          class="px-4 py-2 text-sm border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Invoice Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Client Information -->
      <div class="space-y-3">
        <h2 class="text-base font-medium">Bill To</h2>
        <div class="space-y-1 text-sm">
          <div class="font-medium">{data.invoice.client.name}</div>
          {#if data.invoice.client.company}
            <div class="text-gray-600">{data.invoice.client.company}</div>
          {/if}
          {#if data.invoice.client.legal_name}
            <div class="text-gray-600">Legal: {data.invoice.client.legal_name}</div>
          {/if}
          {#if data.invoice.client.company_address}
            <div class="text-gray-500 whitespace-pre-wrap">{data.invoice.client.company_address}</div>
          {/if}
          {#if data.invoice.client.tax_id}
            <div class="text-gray-500">Tax ID: {data.invoice.client.tax_id}</div>
          {/if}
          {#if data.invoice.client.email}
            <div class="text-gray-500">{data.invoice.client.email}</div>
          {/if}
        </div>
      </div>

      <!-- Invoice Information -->
      <div class="space-y-3">
        <h2 class="text-base font-medium">Invoice Details</h2>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Number:</span>
            <span>{data.invoice.number}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Issue Date:</span>
            <span>{formatDate(data.invoice.issue_date)}</span>
          </div>
          {#if data.invoice.due_date}
            <div class="flex justify-between">
              <span class="text-gray-600">Due Date:</span>
              <span>{formatDate(data.invoice.due_date)}</span>
            </div>
          {/if}
          <div class="flex justify-between">
            <span class="text-gray-600">Currency:</span>
            <span>{data.invoice.currency}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Status:</span>
            <span class="{statusColors[data.invoice.status as keyof typeof statusColors]} px-2.5 py-1 rounded-sm">
              {statusLabels[data.invoice.status as keyof typeof statusLabels]}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Line Items -->
    <div class="border border-thin rounded-sm p-4 md:p-6">
      <h2 class="text-base mb-4 font-medium">Items</h2>

      <!-- Desktop: Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-thin">
            <tr class="text-left">
              <th class="text-sm text-gray-600 pb-2 font-normal">Description</th>
              <th class="text-sm text-gray-600 pb-2 font-normal text-right">Qty</th>
              <th class="text-sm text-gray-600 pb-2 font-normal text-right">Unit Price</th>
              <th class="text-sm text-gray-600 pb-2 font-normal text-right">Tax</th>
              <th class="text-sm text-gray-600 pb-2 font-normal text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {#each data.invoice.items as item}
              <tr class="border-b border-thin last:border-0">
                <td class="py-3 text-sm">{item.description}</td>
                <td class="py-3 text-sm text-right">{item.qty}</td>
                <td class="py-3 text-sm text-right">{formatCurrency(item.unit_price, data.invoice.currency)}</td>
                <td class="py-3 text-sm text-right">{(item.tax_rate * 100).toFixed(1)}%</td>
                <td class="py-3 text-sm text-right">{formatCurrency(item.line_total + (item.line_total * item.tax_rate), data.invoice.currency)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Mobile: Stacked List -->
      <div class="block md:hidden space-y-4">
        {#each data.invoice.items as item}
          <div class="border-b border-thin last:border-0 pb-4 last:pb-0">
            <!-- Description -->
            <div class="text-sm font-medium mb-2">{item.description}</div>

            <!-- Details Grid -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="text-gray-500">Quantity:</div>
              <div class="text-right">{item.qty}</div>

              <div class="text-gray-500">Unit Price:</div>
              <div class="text-right">{formatCurrency(item.unit_price, data.invoice.currency)}</div>

              <div class="text-gray-500">Tax:</div>
              <div class="text-right">{(item.tax_rate * 100).toFixed(1)}%</div>

              <div class="text-gray-500 font-medium">Total:</div>
              <div class="text-right font-medium">{formatCurrency(item.line_total + (item.line_total * item.tax_rate), data.invoice.currency)}</div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Totals -->
    <div class="border border-thin rounded-sm p-4 md:p-6">
      <h2 class="text-base mb-4 font-medium">Summary</h2>

      <div class="max-w-sm ml-auto space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Subtotal:</span>
          <span>{formatCurrency(data.invoice.subtotal, data.invoice.currency)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Tax:</span>
          <span>{formatCurrency(data.invoice.tax_total, data.invoice.currency)}</span>
        </div>
        <div class="border-t border-thin pt-2">
          <div class="flex justify-between text-base font-medium">
            <span>Total:</span>
            <span>{formatCurrency(data.invoice.total, data.invoice.currency)}</span>
          </div>
        </div>

        {#if data.invoice.amount_paid > 0}
          <div class="border-t border-thin pt-2">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Amount Paid:</span>
              <span>{formatCurrency(data.invoice.amount_paid, data.invoice.currency)}</span>
            </div>
            <div class="flex justify-between text-sm font-medium">
              <span>Amount Due:</span>
              <span>{formatCurrency(data.invoice.total - data.invoice.amount_paid, data.invoice.currency)}</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Notes -->
    {#if data.invoice.notes}
      <div class="border border-thin rounded-sm p-6">
        <h2 class="text-base mb-2 font-medium">Notes</h2>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">{data.invoice.notes}</p>
      </div>
    {/if}

    <!-- Payments (if any) -->
    {#if data.invoice.payments && data.invoice.payments.length > 0}
      <div class="border border-thin rounded-sm p-6">
        <h2 class="text-base mb-4 font-medium">Payment History</h2>

        <div class="space-y-2">
          {#each data.invoice.payments as payment}
            <div class="flex justify-between items-center py-2 border-b border-thin last:border-0">
              <div>
                <div class="text-sm">{formatDate(payment.date)}</div>
                {#if payment.notes}
                  <div class="text-sm text-gray-600">{payment.notes}</div>
                {/if}
              </div>
              <div class="text-sm font-medium">
                {formatCurrency(payment.amount, data.invoice.currency)}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 pt-4 border-t border-thin">
      <button
        onclick={handleDownloadPDF}
        disabled={pdfLoading}
        class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if pdfLoading}
          <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating PDF...
        {:else}
          Download PDF
        {/if}
      </button>

      {#if ['draft', 'sent'].includes(data.invoice.status)}
        <button
          onclick={openEmailModal}
          disabled={isLoading}
          class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 font-medium disabled:opacity-50"
        >
          Send to Client
        </button>
      {/if}
    </div>
    
    <!-- Messages -->
    {#if message}
      <div class="text-center">
        <p class="text-xs text-green-600">{message}</p>
      </div>
    {/if}
    
    {#if error}
      <div class="text-center">
        <p class="text-xs text-red-600">{error}</p>
      </div>
    {/if}
  </div>
{/if}

<!-- Email Modal -->
{#if showEmailModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-sm border border-thin max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium">Send Invoice via Email</h3>
          <button
            onclick={closeEmailModal}
            class="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <form onsubmit={sendInvoiceEmail} class="space-y-4">
          <div>
            <label for="email-to" class="block text-xs text-gray-600 mb-1">
              To <span class="text-red-600">*</span>
            </label>
            <input
              id="email-to"
              type="email"
              bind:value={emailForm.to}
              placeholder="client@example.com"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>
          
          <div>
            <label for="email-subject" class="block text-xs text-gray-600 mb-1">Subject</label>
            <input
              id="email-subject"
              type="text"
              bind:value={emailForm.subject}
              placeholder="Invoice {data.invoice.number}"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
            />
          </div>
          
          <div>
            <label for="email-message" class="block text-xs text-gray-600 mb-1">Additional Message</label>
            <textarea
              id="email-message"
              bind:value={emailForm.message}
              placeholder="Optional message to include in the email..."
              rows="3"
              class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors resize-none"
            ></textarea>
          </div>
          
          <div class="flex items-center gap-2">
            <input
              id="include-pdf"
              type="checkbox"
              bind:checked={emailForm.includePdf}
              class="rounded border-thin"
            />
            <label for="include-pdf" class="text-xs text-gray-600">
              Attach PDF invoice
            </label>
          </div>
          
          {#if emailError}
            <div class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm p-3">
              {emailError}
            </div>
          {/if}
          
          {#if emailSuccess}
            <div class="text-xs text-green-600 bg-green-50 border border-green-200 rounded-sm p-3">
              {emailSuccess}
            </div>
          {/if}
          
          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onclick={closeEmailModal}
              class="px-4 py-2 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={emailLoading || !emailForm.to}
              class="px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailLoading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}