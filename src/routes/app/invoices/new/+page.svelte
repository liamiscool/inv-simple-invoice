<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);
  let error = $state('');
  let showPreview = $state(false);

  // Auto-save state
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let isSaving = $state(false);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let draftInvoiceId = $state<string | null>(null);

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

  // Auto-save when form data changes
  $effect(() => {
    // Track these dependencies (Svelte 5 tracks them automatically)
    selectedClientId;
    selectedTemplateId;
    issueDate;
    dueDate;
    notes;
    currency;
    lineItems;

    // Don't auto-save if no meaningful data yet
    if (!selectedClientId || !selectedTemplateId || !lineItems[0]?.description) {
      return;
    }

    // Debounce auto-save (wait 2 seconds after last change)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
      triggerAutoSave();
    }, 2000);

    // Cleanup function
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  });

  async function triggerAutoSave() {
    // Skip if already saving, loading, or about to submit
    if (isSaving || isLoading) return;

    try {
      isSaving = true;
      saveStatus = 'saving';

      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');

      // Get user's org_id
      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Calculate totals
      const currentTotals = totals();

      if (draftInvoiceId) {
        // Update existing draft
        const { error: updateError } = await data.supabase
          .from('invoice')
          .update({
            client_id: selectedClientId,
            template_id: selectedTemplateId,
            issue_date: issueDate,
            due_date: dueDate || null,
            currency: currency,
            notes: notes || null,
            subtotal: currentTotals.subtotal,
            tax_total: currentTotals.taxTotal,
            total: currentTotals.total,
            updated_at: new Date().toISOString()
          })
          .eq('id', draftInvoiceId);

        if (updateError) throw updateError;

        // Delete old line items and insert new ones
        await data.supabase
          .from('invoice_item')
          .delete()
          .eq('invoice_id', draftInvoiceId);

        const itemsToInsert = lineItems.map((item, index) => ({
          invoice_id: draftInvoiceId,
          position: index + 1,
          description: item.description,
          qty: item.qty,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate / 100,
          line_total: item.qty * item.unitPrice
        }));

        await data.supabase
          .from('invoice_item')
          .insert(itemsToInsert);

      } else {
        // Create new draft invoice
        const { data: nextNumber, error: numberError } = await data.supabase
          .rpc('next_invoice_number', { p_org_id: profile.org_id });

        if (numberError) throw numberError;

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
            subtotal: currentTotals.subtotal,
            tax_total: currentTotals.taxTotal,
            total: currentTotals.total
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        draftInvoiceId = invoice.id;

        // Create line items
        const itemsToInsert = lineItems.map((item, index) => ({
          invoice_id: invoice.id,
          position: index + 1,
          description: item.description,
          qty: item.qty,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate / 100,
          line_total: item.qty * item.unitPrice
        }));

        await data.supabase
          .from('invoice_item')
          .insert(itemsToInsert);
      }

      saveStatus = 'saved';
      setTimeout(() => {
        if (saveStatus === 'saved') saveStatus = 'idle';
      }, 2000);

    } catch (err: any) {
      console.error('Auto-save failed:', err);
      saveStatus = 'error';
    } finally {
      isSaving = false;
    }
  }
  
  async function handleSubmit(e: Event) {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) return;

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
      // If we have a draft, just redirect (auto-save has been keeping it updated)
      if (draftInvoiceId) {
        // Clear any pending auto-save timeout
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }

        // Redirect to invoice detail page immediately
        // Auto-save has already kept the draft up-to-date
        window.location.href = `/app/invoices/${draftInvoiceId}`;
        return; // IMPORTANT: Exit here to prevent creating duplicate
      }

      // Otherwise, create new invoice (only if no draft exists)
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
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1">Create Invoice</h1>
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs">
        <a href="/app/invoices" class="text-gray-400 hover:text-black transition-colors">Invoices</a>
        <span class="text-gray-400">/</span>
        <span class="text-gray-600">New</span>
      </div>
    </div>

    <!-- Auto-save indicator -->
    <div class="flex items-center gap-2">
      {#if saveStatus === 'saving'}
        <span class="text-sm text-gray-600">Saving...</span>
      {:else if saveStatus === 'saved'}
        <span class="text-sm text-green-600">✓ Saved</span>
      {:else if saveStatus === 'error'}
        <span class="text-sm text-red-600">Save failed</span>
      {/if}
    </div>
  </div>

  {#if data.clients?.length === 0}
    <!-- No clients state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-base font-medium">No clients available</h2>
        <p class="text-sm text-gray-500 max-w-sm mx-auto">
          You need to add at least one client before creating an invoice
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-8">
      <!-- Client and Basic Info -->
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200">Basic Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="client" class="block text-sm text-gray-500 mb-1.5">
              Client <span class="text-red-600">*</span>
            </label>
            <select
              id="client"
              bind:value={selectedClientId}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
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
            <label for="template" class="block text-sm text-gray-500 mb-1.5">
              Template <span class="text-red-600">*</span>
            </label>
            <select
              id="template"
              bind:value={selectedTemplateId}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
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
            <label for="currency" class="block text-sm text-gray-500 mb-1.5">Currency</label>
            <select
              id="currency"
              bind:value={currency}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
            >
              {#each currencies as curr}
                <option value={curr.code}>{curr.name}</option>
              {/each}
            </select>
          </div>

          {#if selectedTemplate}
            <div>
              <label class="block text-sm text-gray-500 mb-1.5">Template Preview</label>
              <div class="px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 text-gray-500">
                {selectedTemplate.title}
              </div>
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="issueDate" class="block text-sm text-gray-500 mb-1.5">
              Issue Date <span class="text-red-600">*</span>
            </label>
            <input
              id="issueDate"
              type="date"
              bind:value={issueDate}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label for="dueDate" class="block text-sm text-gray-500 mb-1.5">Due Date</label>
            <input
              id="dueDate"
              type="date"
              bind:value={dueDate}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-2 border-b border-gray-200">
          <h2 class="text-base font-medium">Line Items</h2>
          <button
            type="button"
            onclick={addLineItem}
            class="px-5 py-2.5 text-sm text-gray-500 hover:text-black transition-colors"
          >
            Add Item
          </button>
        </div>

        <div class="space-y-6">
          {#each lineItems as item, index}
            <div class="border border-gray-200 p-4 space-y-4 md:border-0 md:p-0">
              <!-- Desktop: Single line with all fields -->
              <div class="hidden md:grid md:grid-cols-12 md:gap-3 md:items-end">
                <div class="md:col-span-4">
                  <label class="block text-sm text-gray-500 mb-1.5">Description</label>
                  <input
                    type="text"
                    bind:value={item.description}
                    placeholder="Description"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 mb-1.5">Qty</label>
                  <input
                    type="number"
                    bind:value={item.qty}
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 mb-1.5">Unit Price</label>
                  <input
                    type="number"
                    bind:value={item.unitPrice}
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 mb-1.5">Tax %</label>
                  <input
                    type="number"
                    bind:value={item.taxRate}
                    min="0"
                    max="100"
                    step="0.1"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div class="md:col-span-2">
                  {#if lineItems.length > 1}
                    <button
                      type="button"
                      onclick={() => removeLineItem(index)}
                      class="w-full px-2 py-2.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  {/if}
                </div>
              </div>

              <!-- Mobile: Stacked layout with description first -->
              <div class="md:hidden space-y-3">
                <div>
                  <label class="block text-sm text-gray-500 mb-1.5">Description</label>
                  <input
                    type="text"
                    bind:value={item.description}
                    placeholder="Description of work or product"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    required
                  />
                </div>

                <!-- Mobile: 2-column grid for qty/price/tax -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm text-gray-500 mb-1.5">Qty</label>
                    <input
                      type="number"
                      bind:value={item.qty}
                      min="0"
                      step="0.01"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-sm text-gray-500 mb-1.5">Unit Price</label>
                    <input
                      type="number"
                      bind:value={item.unitPrice}
                      min="0"
                      step="0.01"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-sm text-gray-500 mb-1.5">Tax %</label>
                    <input
                      type="number"
                      bind:value={item.taxRate}
                      min="0"
                      max="100"
                      step="0.1"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div class="flex items-end">
                    {#if lineItems.length > 1}
                      <button
                        type="button"
                        onclick={() => removeLineItem(index)}
                        class="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Totals -->
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200">Summary</h2>

        <div class="max-w-sm ml-auto space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Subtotal:</span>
            <span class="font-medium">{formatCurrency(totals().subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Tax:</span>
            <span class="font-medium">{formatCurrency(totals().taxTotal)}</span>
          </div>
          <div class="border-t border-gray-200 pt-2">
            <div class="flex justify-between text-base font-medium">
              <span>Total:</span>
              <span>{formatCurrency(totals().total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200">Additional Information</h2>

        <div>
          <label for="notes" class="block text-sm text-gray-500 mb-1.5">Notes</label>
          <textarea
            id="notes"
            bind:value={notes}
            placeholder="Additional notes or payment terms..."
            rows="3"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4">
        <a
          href="/app/invoices"
          class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-75"
        >
          Cancel
        </a>

        <div class="flex items-center gap-3">
          <button
            type="button"
            onclick={() => showPreview = true}
            disabled={!selectedClientId || !selectedTemplateId || totals().total <= 0}
            class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>

          <button
            type="submit"
            disabled={isLoading || !selectedClientId || !selectedTemplateId || totals().total <= 0}
            class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </div>

      {#if error}
        <div class="text-center">
          <p class="text-sm text-red-600">{error}</p>
        </div>
      {/if}
    </form>
  {/if}
</div>

<!-- Preview Modal -->
{#if showPreview && selectedClient && selectedTemplate}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => showPreview = false}>
    <div class="bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-5xl flex flex-col" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 class="text-sm font-medium">Invoice Preview</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            {selectedTemplate.title} • {selectedClient.company || selectedClient.name}
          </p>
        </div>
        <button
          onclick={() => showPreview = false}
          class="px-3 py-1.5 text-xs text-gray-500 hover:text-black transition-colors"
        >
          Close
        </button>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-auto bg-gray-100 p-6">
        <div class="max-w-3xl mx-auto bg-white shadow-lg">
          <iframe
            src={`/app/invoices/preview?` + new URLSearchParams({
              template_id: selectedTemplateId,
              client_id: selectedClientId,
              issue_date: issueDate,
              due_date: dueDate || '',
              currency: currency,
              notes: notes || '',
              items: JSON.stringify(lineItems.map((item, index) => ({
                position: index + 1,
                description: item.description,
                qty: item.qty,
                unit_price: item.unitPrice,
                tax_rate: item.taxRate / 100,
                line_total: item.qty * item.unitPrice
              }))),
              subtotal: totals().subtotal.toString(),
              tax_total: totals().taxTotal.toString(),
              total: totals().total.toString()
            })}
            class="w-full h-[800px] border-0"
            title="Invoice Preview"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
{/if}