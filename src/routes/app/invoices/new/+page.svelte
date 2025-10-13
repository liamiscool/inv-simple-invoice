<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);
  let error = $state('');
  
  // Form data
  let selectedClientId = $state('');
  let selectedTemplateId = $state('');
  let issueDate = $state(new Date().toISOString().split('T')[0]);
  let dueDate = $state('');
  let notes = $state('');
  let currency = $state('EUR');
  
  // Line items
  let lineItems = $state([
    { description: '', qty: 1, unitPrice: 0, taxRate: 0 }
  ]);
  
  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];
  
  // Computed values
  const selectedClient = $derived(
    data.clients?.find(c => c.id === selectedClientId) || null
  );
  
  const selectedTemplate = $derived(
    data.templates?.find(t => t.id === selectedTemplateId) || null
  );
  
  const totals = $derived(() => {
    let subtotal = 0;
    let taxTotal = 0;
    
    lineItems.forEach(item => {
      const lineSubtotal = item.qty * item.unitPrice;
      const lineTax = lineSubtotal * (item.taxRate / 100);
      subtotal += lineSubtotal;
      taxTotal += lineTax;
    });
    
    return {
      subtotal,
      taxTotal,
      total: subtotal + taxTotal
    };
  });
  
  function addLineItem() {
    lineItems.push({ description: '', qty: 1, unitPrice: 0, taxRate: 0 });
  }
  
  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      lineItems.splice(index, 1);
    }
  }
  
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Auto-select first template if none selected
  $effect(() => {
    if (data.templates && data.templates.length > 0 && !selectedTemplateId) {
      selectedTemplateId = data.templates[0].id;
    }
  });
  
  // Update currency when client changes
  $effect(() => {
    if (selectedClient && selectedClient.currency) {
      currency = selectedClient.currency;
    }
  });
  
  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!selectedClientId) {
      error = 'Please select a client';
      return;
    }
    
    if (!selectedTemplateId) {
      error = 'Please select a template';
      return;
    }
    
    if (lineItems.length === 0 || !lineItems[0].description) {
      error = 'Please add at least one line item';
      return;
    }
    
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
      
      // Generate invoice number
      const { data: nextNumber, error: numberError } = await data.supabase
        .rpc('next_invoice_number', { p_org_id: profile.org_id });
        
      if (numberError) throw numberError;
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await data.supabase
        .from('invoice')
        .insert({
          org_id: profile.org_id,
          client_id: selectedClientId,
          template_id: selectedTemplateId,
          number: nextNumber,
          issue_date: issueDate,
          due_date: dueDate || null,
          currency: currency,
          status: 'draft',
          notes: notes || null,
          subtotal: totals().subtotal,
          tax_total: totals().taxTotal,
          total: totals().total
        })
        .select()
        .single();
        
      if (invoiceError) throw invoiceError;
      
      // Create line items
      const itemsToInsert = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        position: index + 1,
        description: item.description,
        qty: item.qty,
        unit_price: item.unitPrice,
        tax_rate: item.taxRate / 100, // Convert percentage to decimal
        line_total: item.qty * item.unitPrice
      }));
      
      const { error: itemsError } = await data.supabase
        .from('invoice_item')
        .insert(itemsToInsert);
        
      if (itemsError) throw itemsError;
      
      // Redirect to invoice detail page
      window.location.href = `/app/invoices/${invoice.id}`;
      
    } catch (err: any) {
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Create Invoice - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-base font-medium mb-1">Create Invoice</h1>
    <p class="text-xs text-gray-500">
      Create a new invoice for your client
    </p>
  </div>

  {#if data.clients?.length === 0}
    <!-- No clients state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-sm font-medium">No clients available</h2>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          You need to add at least one client before creating an invoice
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-8">
      <!-- Client and Basic Info -->
      <div class="space-y-5">
        <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="client" class="block text-xs text-gray-500 mb-1.5">
              Client <span class="text-red-600">*</span>
            </label>
            <select
              id="client"
              bind:value={selectedClientId}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
              required
            >
              <option value="">Select a client</option>
              {#each data.clients || [] as client}
                <option value={client.id}>
                  {client.company ? `${client.company} (${client.name})` : client.name}
                </option>
              {/each}
            </select>
          </div>

          <div>
            <label for="template" class="block text-xs text-gray-500 mb-1.5">
              Template <span class="text-red-600">*</span>
            </label>
            <select
              id="template"
              bind:value={selectedTemplateId}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
              required
            >
              <option value="">Select a template</option>
              {#each data.templates || [] as template}
                <option value={template.id}>
                  {template.title} {template.kind === 'curated' ? '(Built-in)' : '(Custom)'}
                </option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="currency" class="block text-xs text-gray-500 mb-1.5">Currency</label>
            <select
              id="currency"
              bind:value={currency}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            >
              {#each currencies as curr}
                <option value={curr.code}>{curr.name}</option>
              {/each}
            </select>
          </div>

          {#if selectedTemplate}
            <div>
              <label class="block text-xs text-gray-500 mb-1.5">Template Preview</label>
              <div class="px-3 py-1.5 text-xs border border-gray-300 bg-gray-50 text-gray-500">
                {selectedTemplate.title}
              </div>
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="issueDate" class="block text-xs text-gray-500 mb-1.5">
              Issue Date <span class="text-red-600">*</span>
            </label>
            <input
              id="issueDate"
              type="date"
              bind:value={issueDate}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label for="dueDate" class="block text-xs text-gray-500 mb-1.5">Due Date</label>
            <input
              id="dueDate"
              type="date"
              bind:value={dueDate}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-2 border-b border-gray-200">
          <h2 class="text-sm font-medium">Line Items</h2>
          <button
            type="button"
            onclick={addLineItem}
            class="px-3 py-1 text-xs text-gray-500 hover:text-black transition-colors"
          >
            Add Item
          </button>
        </div>
        
        <div class="space-y-3">
          {#each lineItems as item, index}
            <div class="grid grid-cols-12 gap-3 items-end">
              <div class="col-span-12 md:col-span-5">
                <label class="block text-xs text-gray-500 mb-1.5">Description</label>
                <input
                  type="text"
                  bind:value={item.description}
                  placeholder="Description of work or product"
                  class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div class="col-span-3 md:col-span-2">
                <label class="block text-xs text-gray-500 mb-1.5">Qty</label>
                <input
                  type="number"
                  bind:value={item.qty}
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div class="col-span-4 md:col-span-2">
                <label class="block text-xs text-gray-500 mb-1.5">Unit Price</label>
                <input
                  type="number"
                  bind:value={item.unitPrice}
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div class="col-span-3 md:col-span-2">
                <label class="block text-xs text-gray-500 mb-1.5">Tax %</label>
                <input
                  type="number"
                  bind:value={item.taxRate}
                  min="0"
                  max="100"
                  step="0.1"
                  class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div class="col-span-2 md:col-span-1">
                {#if lineItems.length > 1}
                  <button
                    type="button"
                    onclick={() => removeLineItem(index)}
                    class="w-full px-2 py-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Totals -->
      <div class="space-y-5">
        <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Summary</h2>

        <div class="max-w-sm ml-auto space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Subtotal:</span>
            <span class="font-medium">{formatCurrency(totals().subtotal)}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-500">Tax:</span>
            <span class="font-medium">{formatCurrency(totals().taxTotal)}</span>
          </div>
          <div class="border-t border-gray-200 pt-2">
            <div class="flex justify-between text-sm font-medium">
              <span>Total:</span>
              <span>{formatCurrency(totals().total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-5">
        <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Additional Information</h2>

        <div>
          <label for="notes" class="block text-xs text-gray-500 mb-1.5">Notes</label>
          <textarea
            id="notes"
            bind:value={notes}
            placeholder="Additional notes or payment terms..."
            rows="3"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4">
        <a
          href="/app/invoices"
          class="px-4 py-1.5 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={isLoading || !selectedClientId || !selectedTemplateId || totals().total <= 0}
          class="px-6 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Invoice...' : 'Create Invoice'}
        </button>
      </div>

      {#if error}
        <div class="text-center">
          <p class="text-xs text-red-600">{error}</p>
        </div>
      {/if}
    </form>
  {/if}
</div>