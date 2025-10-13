<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let isLoading = $state(false);
  let error = $state('');

  // Form data - initialize with existing client data
  let name = $state(data.client.name);
  let company = $state(data.client.company || '');
  let company_address = $state(data.client.company_address || '');
  let email = $state(data.client.email || '');
  let currency = $state(data.client.currency || 'EUR');
  let legal_name = $state(data.client.legal_name || '');
  let tax_id = $state(data.client.tax_id || '');
  let notes = $state(data.client.notes || '');

  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    error = '';

    try {
      // Update client
      const { error: updateError } = await data.supabase
        .from('client')
        .update({
          name,
          company: company || null,
          company_address: company_address || null,
          email: email || null,
          currency,
          legal_name: legal_name || null,
          tax_id: tax_id || null,
          notes: notes || null
        })
        .eq('id', data.client.id);

      if (updateError) throw updateError;

      // Redirect to client detail page
      window.location.href = `/app/clients/${data.client.id}`;

    } catch (err: any) {
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Edit {data.client.name} - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-base font-medium mb-1">Edit Client</h1>
    <p class="text-xs text-gray-500">
      Update client information
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y-8">
    <!-- Contact Information -->
    <div class="space-y-5">
      <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Contact Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="name" class="block text-xs font-medium text-gray-700 mb-1">
            Contact Name <span class="text-red-600">*</span>
          </label>
          <p class="text-xs text-gray-500 mb-1.5">Primary contact person</p>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="John Smith"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>

        <div>
          <label for="email" class="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <p class="text-xs text-gray-500 mb-1.5">For sending invoices</p>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="john@acme.com"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>
    </div>

    <!-- Company Information -->
    <div class="space-y-5">
      <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Company Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="company" class="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
          <p class="text-xs text-gray-500 mb-1.5">Trading or brand name</p>
          <input
            id="company"
            type="text"
            bind:value={company}
            placeholder="Acme Inc"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label for="legal_name" class="block text-xs font-medium text-gray-700 mb-1">Legal Name</label>
          <p class="text-xs text-gray-500 mb-1.5">Official registered entity name</p>
          <input
            id="legal_name"
            type="text"
            bind:value={legal_name}
            placeholder="Acme Corporation Limited"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      <div>
        <label for="company_address" class="block text-xs font-medium text-gray-700 mb-1">Company Address</label>
        <p class="text-xs text-gray-500 mb-1.5">Physical business address</p>
        <textarea
          id="company_address"
          bind:value={company_address}
          placeholder="123 Main St&#10;London, UK&#10;SW1A 1AA"
          rows="2"
          class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="tax_id" class="block text-xs font-medium text-gray-700 mb-1">Tax ID / VAT Number</label>
          <p class="text-xs text-gray-500 mb-1.5">For invoicing compliance</p>
          <input
            id="tax_id"
            type="text"
            bind:value={tax_id}
            placeholder="GB123456789"
            class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label for="currency" class="block text-xs font-medium text-gray-700 mb-1">Preferred Currency</label>
          <p class="text-xs text-gray-500 mb-1.5">Default for invoices</p>
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
      </div>
    </div>

    <!-- Additional Information -->
    <div class="space-y-5">
      <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Additional Information</h2>

      <div>
        <label for="notes" class="block text-xs text-gray-500 mb-1.5">Notes</label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder="Additional notes about this client..."
          rows="3"
          class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
        ></textarea>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4">
      <a
        href="/app/clients/{data.client.id}"
        class="px-4 py-1.5 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
      >
        Cancel
      </a>

      <button
        type="submit"
        disabled={isLoading || !name}
        class="px-6 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>

    {#if error}
      <div class="text-center">
        <p class="text-xs text-red-600">{error}</p>
      </div>
    {/if}
  </form>
</div>
