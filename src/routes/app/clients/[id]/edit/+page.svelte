<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let isLoading = $state(false);
  let error = $state('');

  // Form data - initialize with existing client data
  const client: any = data.client;
  let name = $state(client.name);
  let company = $state(client.company || '');
  let company_address = $state(client.company_address || '');
  let email = $state(client.email || '');
  let currency = $state(client.currency || 'EUR');
  let legal_name = $state(client.legal_name || '');
  let tax_id = $state(client.tax_id || '');
  let notes = $state(client.notes || '');
  let useCustomInvoicePrefix = $state(client.use_custom_invoice_prefix || false);
  let invoicePrefix = $state(client.invoice_prefix || '');
  let invoiceCounter = $state(client.invoice_counter || 1);

  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  // Generate preview of invoice number format
  const invoiceNumberPreview = $derived(() => {
    if (!useCustomInvoicePrefix || !invoicePrefix) return null;
    const year = new Date().getFullYear();
    const counter = String(invoiceCounter).padStart(3, '0');
    return `${invoicePrefix}-${year}-${counter}`;
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      // Get current user to verify org_id
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single() as { data: any };

      if (!profile) throw new Error('Profile not found');

      // Update client with org_id check
      const updateData: any = {
        name,
        company: company || null,
        company_address: company_address || null,
        email: email || null,
        currency,
        legal_name: legal_name || null,
        tax_id: tax_id || null,
        use_custom_invoice_prefix: useCustomInvoicePrefix,
        invoice_prefix: useCustomInvoicePrefix ? invoicePrefix : null,
        invoice_counter: useCustomInvoicePrefix ? invoiceCounter : 1,
        notes: notes || null
      };
      const { error: updateError } = await data.supabase
        .from('client')
        .update(updateData)
        .eq('id', client.id)
        .eq('org_id', profile.org_id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Redirect to clients list page
      window.location.href = '/app/clients';

    } catch (err: any) {
      console.error('Full error:', err);
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Edit {client.name} - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-lg font-medium mb-1 dark:text-white">Edit Client</h1>
    <!-- Breadcrumbs -->
    <div class="flex items-center gap-2 text-xs">
      <a href="/app/clients" class="text-gray-400 hover:text-black dark:hover:text-white transition-colors">Clients</a>
      <span class="text-gray-400">/</span>
      <a href="/app/clients/{client.id}" class="text-gray-400 hover:text-black dark:hover:text-white transition-colors">{client.name}</a>
      <span class="text-gray-400">/</span>
      <span class="text-gray-600 dark:text-gray-400">Edit</span>
    </div>
  </div>

  <form onsubmit={handleSubmit} class="space-y-8">
    <!-- Contact Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-white">Contact Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Name <span class="text-red-600 dark:text-red-400">*</span>
          </label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Primary contact person</p>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="John Smith"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
            required
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">For sending invoices</p>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="john@acme.com"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Company Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-white">Company Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="company" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Trading or brand name</p>
          <input
            id="company"
            type="text"
            bind:value={company}
            placeholder="Acme Inc"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
          />
        </div>

        <div>
          <label for="legal_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Legal Name</label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Official registered entity name</p>
          <input
            id="legal_name"
            type="text"
            bind:value={legal_name}
            placeholder="Acme Corporation Limited"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
          />
        </div>
      </div>

      <div>
        <label for="company_address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Address</label>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Physical business address</p>
        <textarea
          id="company_address"
          bind:value={company_address}
          placeholder="123 Main St&#10;London, UK&#10;SW1A 1AA"
          rows="2"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors resize-none dark:bg-dark-input dark:text-white"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="tax_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax ID / VAT Number</label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">For invoicing compliance</p>
          <input
            id="tax_id"
            type="text"
            bind:value={tax_id}
            placeholder="GB123456789"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
          />
        </div>

        <div>
          <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preferred Currency</label>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Default for invoices</p>
          <select
            id="currency"
            bind:value={currency}
            class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
          >
            {#each currencies as curr}
              <option value={curr.code}>{curr.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Invoice Numbering -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-white">Invoice Numbering</h2>

      <div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={useCustomInvoicePrefix}
            class="w-4 h-4 border-gray-300 dark:border-gray-600 focus:ring-0 focus:ring-offset-0"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Use Custom Invoice Prefix</span>
        </label>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-6">
          Generate client-specific invoice numbers (e.g., NATHAN-2025-001) instead of global format (INV-2025-0001)
        </p>
      </div>

      {#if useCustomInvoicePrefix}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pl-6">
          <div>
            <label for="invoice_prefix" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice Prefix <span class="text-red-600 dark:text-red-400">*</span>
            </label>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Uppercase letters and numbers only</p>
            <input
              id="invoice_prefix"
              type="text"
              bind:value={invoicePrefix}
              placeholder="NATHAN"
              maxlength="15"
              class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white uppercase"
              required={useCustomInvoicePrefix}
            />
          </div>

          <div>
            <label for="invoice_counter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Starting Number</label>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1.5">First invoice number</p>
            <input
              id="invoice_counter"
              type="number"
              bind:value={invoiceCounter}
              min="1"
              max="9999"
              class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors dark:bg-dark-input dark:text-white"
            />
          </div>
        </div>

        {#if invoiceNumberPreview()}
          <div class="pl-6">
            <div class="bg-gray-50 dark:bg-dark-hover border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm">
              <span class="text-gray-500 dark:text-gray-400">Preview:</span>
              <span class="ml-2 font-mono font-medium text-black dark:text-white">{invoiceNumberPreview()}</span>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Additional Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:border-gray-700 dark:text-white">Additional Information</h2>

      <div>
        <label for="notes" class="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder="Additional notes about this client..."
          rows="3"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors resize-none dark:bg-dark-input dark:text-white"
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4">
      <a
        href="/app/clients/{client.id}"
        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-75"
      >
        Cancel
      </a>

      <button
        type="submit"
        disabled={isLoading || !name}
        class="px-6 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>

    {#if error}
      <div class="text-center">
        <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    {/if}
  </form>
</div>
