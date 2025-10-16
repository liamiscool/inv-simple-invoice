<script lang="ts">
  import type { PageData } from './$types';
  import { calculateMaxItems } from '$lib/templates';

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
  let includeContactName = $state(false);
  
  // Line items
  let lineItems = $state<any[]>([
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
    data.clients?.find((c: any) => c.id === selectedClientId) || null
  );

  const selectedTemplate = $derived(
    data.templates?.find((t: any) => t.id === selectedTemplateId) || null
  );

  // Calculate max items for selected template
  const maxItems = $derived(() => {
    if (!selectedTemplate) return Infinity;
    return calculateMaxItems(selectedTemplate.spec);
  });

  // Check if we're approaching or exceeding the limit
  const itemLimitStatus = $derived(() => {
    const max = maxItems();
    const count = lineItems.length;

    if (count >= max) {
      return { level: 'error', message: `This invoice has ${count} items, but the template can only display ${max} items properly. Consider splitting into multiple invoices.` };
    } else if (count >= max - 2) {
      return { level: 'warning', message: `Approaching item limit (${count} of ${max} items). Template may not display correctly with more items.` };
    }
    return null;
  });

  const totals = $derived(() => {
    let subtotal = 0;
    let taxTotal = 0;

    lineItems.forEach((item: any) => {
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

  // Check if all line items have 0% tax
  const hideTaxColumn = $derived(() => {
    return lineItems.length > 0 && lineItems.every((item: any) => item.taxRate === 0);
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
    includeContactName;
    lineItems;

    // Don't auto-save if no meaningful data yet
    if (!selectedClientId || !selectedTemplateId) {
      return;
    }

    // Note: We allow auto-save even with no line items yet, because:
    // - User might be setting due date, contact name checkbox, etc.
    // - Line items will be filtered when saving (only items with descriptions are saved)
    // - This ensures all form changes trigger auto-save

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
            include_contact_name: includeContactName,
            subtotal: currentTotals.subtotal,
            tax_total: currentTotals.taxTotal,
            total: currentTotals.total,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', draftInvoiceId);

        if (updateError) throw updateError;

        // Update line items (only save items with descriptions)
        const itemsToSave = lineItems
          .filter(item => item.description && item.description.trim())
          .map((item: any, index: number) => ({
            invoice_id: draftInvoiceId,
            position: index + 1,
            description: item.description,
            qty: item.qty || 0,
            unit_price: item.unitPrice || 0,
            tax_rate: (item.taxRate || 0) / 100,
            line_total: (item.qty || 0) * (item.unitPrice || 0)
          }));

        // Delete all old items and insert new ones in a transaction-like manner
        // Note: Supabase doesn't support transactions, but we do delete+insert quickly
        const { error: deleteError } = await data.supabase
          .from('invoice_item')
          .delete()
          .eq('invoice_id', draftInvoiceId);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }

        // Insert all current items
        if (itemsToSave.length > 0) {
          const { error: insertError } = await data.supabase
            .from('invoice_item')
            .insert(itemsToSave);

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
        }

      } else {
        // Create new draft invoice
        const { data: nextNumber, error: numberError } = await data.supabase
          .rpc('next_invoice_number', { p_org_id: profile.org_id } as any);

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
            include_contact_name: includeContactName,
            subtotal: currentTotals.subtotal,
            tax_total: currentTotals.taxTotal,
            total: currentTotals.total
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        draftInvoiceId = invoice.id;

        // Create line items (only save items with descriptions)
        const itemsToInsert = lineItems
          .filter(item => item.description && item.description.trim())
          .map((item: any, index: number) => ({
            invoice_id: invoice.id,
            position: index + 1,
            description: item.description,
            qty: item.qty || 0,
            unit_price: item.unitPrice || 0,
            tax_rate: (item.taxRate || 0) / 100,
            line_total: (item.qty || 0) * (item.unitPrice || 0)
          }));

        if (itemsToInsert.length > 0) {
          await data.supabase
            .from('invoice_item')
            .insert(itemsToInsert);
        }
      }

      saveStatus = 'saved';
      setTimeout(() => {
        if (saveStatus === 'saved') saveStatus = 'idle';
      }, 2000);

    } catch (err: any) {
      console.error('=== AUTO-SAVE ERROR DEBUG ===');
      console.error('Error object:', err);
      console.error('Error message:', err?.message);
      console.error('Error details:', err?.details);
      console.error('Error hint:', err?.hint);
      console.error('Error code:', err?.code);
      console.error('Full error:', JSON.stringify(err, null, 2));
      console.error('Current state:', {
        draftInvoiceId,
        selectedClientId,
        selectedTemplateId,
        lineItems: lineItems.map(item => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        includeContactName,
        dueDate,
        issueDate
      });
      console.error('=== END DEBUG ===');
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
        .rpc('next_invoice_number', { p_org_id: profile.org_id } as any);

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
          include_contact_name: includeContactName,
          subtotal: totals().subtotal,
          tax_total: totals().taxTotal,
          total: totals().total
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create line items
      const itemsToInsert = lineItems.map((item: any, index: number) => ({
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
      <h1 class="text-lg font-medium mb-1 dark:text-white">Create Invoice</h1>
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs">
        <a href="/app/invoices" class="text-gray-400 hover:text-black dark:hover:text-white transition-colors">Invoices</a>
        <span class="text-gray-400">/</span>
        <span class="text-gray-600 dark:text-gray-400">New</span>
      </div>
    </div>

    <!-- Auto-save indicator -->
    <div class="flex items-center gap-2">
      {#if saveStatus === 'saving'}
        <span class="text-sm text-gray-600 dark:text-gray-400">Saving...</span>
      {:else if saveStatus === 'saved'}
        <span class="text-sm text-green-600 dark:text-green-400">✓ Saved</span>
      {:else if saveStatus === 'error'}
        <span class="text-sm text-red-600 dark:text-red-400">Save failed</span>
      {/if}
    </div>
  </div>

  {#if data.clients?.length === 0}
    <!-- No clients state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-base font-medium dark:text-white">No clients available</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          You need to add at least one client before creating an invoice
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 dark:bg-dark-button dark:hover:bg-dark-button-hover transition-colors duration-75"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else}
    <form onsubmit={handleSubmit} class="space-y-8">
      <!-- Client and Basic Info -->
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Basic Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="client" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              Client <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <select
              id="client"
              bind:value={selectedClientId}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
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
            <label for="template" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              Template <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <select
              id="template"
              bind:value={selectedTemplateId}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
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

        <!-- Include Contact Name Option -->
        {#if selectedClient}
          <div class="flex items-center gap-3">
            <input
              id="includeContactName"
              type="checkbox"
              bind:checked={includeContactName}
              class="w-4 h-4 text-black border-gray-300 rounded focus:ring-black dark:bg-dark-input dark:border-gray-600 dark:focus:ring-gray-500"
            />
            <label for="includeContactName" class="text-sm text-gray-700 dark:text-gray-300">
              Include contact name on invoice
            </label>
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="currency" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Currency</label>
            <select
              id="currency"
              bind:value={currency}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
            >
              {#each currencies as curr}
                <option value={curr.code}>{curr.name}</option>
              {/each}
            </select>
          </div>

          {#if selectedTemplate}
            <div>
              <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Template Preview</label>
              <div class="px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 text-gray-500 dark:bg-dark-input dark:border-gray-600 dark:text-gray-400">
                {selectedTemplate.title}
              </div>
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label for="issueDate" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">
              Issue Date <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              id="issueDate"
              type="date"
              bind:value={issueDate}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
              required
            />
          </div>

          <div>
            <label for="dueDate" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Due Date</label>
            <input
              id="dueDate"
              type="date"
              bind:value={dueDate}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 class="text-base font-medium dark:text-white">Line Items</h2>
            {#if selectedTemplate}
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {lineItems.length} of {maxItems()} items
              </p>
            {/if}
          </div>
          <button
            type="button"
            onclick={addLineItem}
            class="px-5 py-2.5 text-sm text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Add Item
          </button>
        </div>

        {#if itemLimitStatus()}
          <div class="px-4 py-3 text-sm border {itemLimitStatus().level === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400' : 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'}">
            <div class="flex items-start gap-2">
              <span class="mt-0.5">{itemLimitStatus().level === 'error' ? '⚠️' : '⚡'}</span>
              <div>
                <p class="font-medium mb-1">{itemLimitStatus().level === 'error' ? 'Template Capacity Exceeded' : 'Approaching Template Limit'}</p>
                <p class="text-xs opacity-90">{itemLimitStatus().message}</p>
              </div>
            </div>
          </div>
        {/if}

        <div class="space-y-6">
          {#each lineItems as item, index}
            <div class="border border-gray-200 dark:border-gray-700 p-4 space-y-4 md:border-0 md:p-0 group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <!-- Desktop: Single line with all fields -->
              <div class="hidden md:grid md:grid-cols-12 md:gap-3 md:items-end">
                <div class="md:col-span-4">
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    bind:value={item.description}
                    placeholder="Description"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Qty</label>
                  <input
                    type="number"
                    bind:value={item.qty}
                    min="0"
                    step="1"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                    onfocus={(e) => {
                      const target = e.target as HTMLInputElement;
                      target.select();
                    }}
                    onblur={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value === '' || target.value === '0') {
                        target.value = '1';
                        item.qty = 1;
                      }
                    }}
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Unit Price</label>
                  <input
                    type="number"
                    bind:value={item.unitPrice}
                    min="0"
                    step="0.01"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                    onfocus={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value === '0') {
                        target.select();
                      }
                    }}
                    onblur={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value === '') {
                        target.value = '0';
                      }
                    }}
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Tax %</label>
                  <input
                    type="number"
                    bind:value={item.taxRate}
                    min="0"
                    max="100"
                    step="0.1"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                    onfocus={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value === '0') {
                        target.select();
                      }
                    }}
                    onblur={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (target.value === '') {
                        target.value = '0';
                      }
                    }}
                  />
                </div>

                <div class="md:col-span-2 flex items-end">
                  {#if lineItems.length > 1}
                    <button
                      type="button"
                      onclick={() => removeLineItem(index)}
                      class="w-full px-3 py-2.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 border border-gray-300 hover:border-red-300 dark:border-gray-600 dark:hover:border-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ✕ Remove
                    </button>
                  {/if}
                </div>
              </div>

              <!-- Mobile: Stacked layout with description first -->
              <div class="md:hidden space-y-3">
                <div>
                  <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Description</label>
                  <input
                    type="text"
                    bind:value={item.description}
                    placeholder="Description of work or product"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                    required
                  />
                </div>

                <!-- Mobile: 2-column grid for qty/price/tax -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Qty</label>
                    <input
                      type="number"
                      bind:value={item.qty}
                      min="0"
                      step="1"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                      onfocus={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.select();
                      }}
                      onblur={(e) => {
                        const target = e.target as HTMLInputElement;
                        if (target.value === '' || target.value === '0') {
                          target.value = '1';
                          item.qty = 1;
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Unit Price</label>
                    <input
                      type="number"
                      bind:value={item.unitPrice}
                      min="0"
                      step="0.01"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                      onfocus={(e) => {
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onblur={(e) => {
                        if (e.target.value === '') {
                          e.target.value = '0';
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Tax %</label>
                    <input
                      type="number"
                      bind:value={item.taxRate}
                      min="0"
                      max="100"
                      step="0.1"
                      class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors"
                      onfocus={(e) => {
                        if (e.target.value === '0') {
                          e.target.select();
                        }
                      }}
                      onblur={(e) => {
                        if (e.target.value === '') {
                          e.target.value = '0';
                        }
                      }}
                    />
                  </div>

                  <div class="flex items-end">
                    {#if lineItems.length > 1}
                      <button
                        type="button"
                        onclick={() => removeLineItem(index)}
                        class="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-300 dark:border-gray-600 dark:text-white dark:hover:text-red-400 dark:hover:bg-red-900/20 dark:hover:border-red-400 transition-colors"
                      >
                        ✕ Remove
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
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Summary</h2>

        <div class="max-w-sm ml-auto space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Subtotal:</span>
            <span class="font-medium dark:text-white">{formatCurrency(totals().subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Tax:</span>
            <span class="font-medium dark:text-white">{formatCurrency(totals().taxTotal)}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
            <div class="flex justify-between text-base font-medium dark:text-white">
              <span>Total:</span>
              <span>{formatCurrency(totals().total)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Your Payment Details -->
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">
          <h2 class="text-base font-medium">Your Payment Details</h2>
          <a
            href="/app/settings"
            class="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:text-white dark:hover:bg-dark-hover transition-colors duration-75"
          >
            Edit
          </a>
        </div>

        <div class="bg-gray-50 dark:bg-dark-input p-4 space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your Company Name</label>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {data.userProfile?.company_name || data.userProfile?.full_name || 'Not set'}
              </div>
            </div>
            
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your Tax ID</label>
              <div class="text-sm text-gray-600 dark:text-gray-300">
                {data.userProfile?.tax_id || 'Not set'}
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your Company Address</label>
            <div class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {data.userProfile?.company_address || 'Not set'}
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your Bank Details</label>
            <div class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {data.userProfile?.bank_details || 'Not set'}
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Additional Information</h2>

        <div>
          <label for="notes" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
          <textarea
            id="notes"
            bind:value={notes}
            placeholder="Additional notes or message to include on this invoice..."
            rows="3"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500 transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4">
        <a
          href="/app/invoices"
          class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover transition-colors duration-75"
        >
          Cancel
        </a>

        <div class="flex items-center gap-3">
          <button
            type="button"
            onclick={() => showPreview = true}
            disabled={!selectedClientId || !selectedTemplateId || totals().total <= 0}
            class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>

          <button
            type="submit"
            disabled={isLoading || !selectedClientId || !selectedTemplateId || totals().total <= 0}
            class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 dark:bg-dark-button dark:hover:bg-dark-button-hover transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </div>

      {#if error}
        <div class="text-center">
          <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      {/if}
    </form>
  {/if}
</div>

<!-- Preview Modal -->
{#if showPreview && selectedClient && selectedTemplate}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => showPreview = false}>
    <div class="bg-white dark:bg-dark-bg w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-5xl flex flex-col" onclick={(e) => e.stopPropagation()}>
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 class="text-sm font-medium dark:text-white">Invoice Preview</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {selectedTemplate.title} • {selectedClient.company || selectedClient.name}
          </p>
        </div>
        <button
          onclick={() => showPreview = false}
          class="px-3 py-1.5 text-xs text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          Close
        </button>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-auto bg-gray-100 dark:bg-dark-input p-6">
        <div class="max-w-3xl mx-auto bg-white shadow-lg">
          <iframe
            src={`/app/invoices/preview?` + new URLSearchParams({
              template_id: selectedTemplateId,
              client_id: selectedClientId,
              issue_date: issueDate,
              due_date: dueDate || '',
              currency: currency,
              notes: notes || '',
              include_contact_name: includeContactName.toString(),
              hide_tax_column: hideTaxColumn().toString(),
              items: JSON.stringify(lineItems.map((item: any, index: number) => ({
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