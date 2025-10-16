<script lang="ts">
  import type { PageData } from './$types';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';
  import { STRIPE_MONTHLY_LINK, STRIPE_YEARLY_LINK } from '$lib/config/stripe';
  import { canAddClient } from '$lib/subscription/service';

  let { data }: { data: PageData } = $props();

  let isLoading = $state(false);
  let error = $state('');
  let showUpgradeModal = $state(false);

  // Form data
  let name = $state('');
  let company = $state('');
  let company_address = $state('');
  let email = $state('');
  let currency = $state('EUR');
  let legal_name = $state('');
  let tax_id = $state('');
  let notes = $state('');

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
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');

      // Check if user can add more clients
      const allowed = await canAddClient(data.supabase, user.user.id);
      if (!allowed) {
        isLoading = false;
        showUpgradeModal = true;
        return;
      }

      // Get user's org_id
      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Create client
      const { error: insertError } = await data.supabase
        .from('client')
        .insert({
          org_id: profile.org_id,
          name,
          company: company || null,
          company_address: company_address || null,
          email: email || null,
          currency,
          legal_name: legal_name || null,
          tax_id: tax_id || null,
          notes: notes || null,
        } as any);

      if (insertError) throw insertError;

      // Redirect to clients page
      window.location.href = '/app/clients';

    } catch (err: any) {
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Add Client - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1 dark:text-white">Add Client</h1>
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs">
        <a href="/app/clients" class="text-gray-400 hover:text-black dark:hover:text-white transition-colors">Clients</a>
        <span class="text-gray-400">/</span>
        <span class="text-gray-600 dark:text-gray-400">New</span>
      </div>
    </div>
  </div>

  <form onsubmit={handleSubmit} class="space-y-8">
    <!-- Contact Information -->
    <div class="space-y-4">
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
        href="/app/clients"
        class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors duration-75"
      >
        Cancel
      </a>

      <button
        type="submit"
        disabled={isLoading || !name}
        class="px-6 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding Client...' : 'Add Client'}
      </button>
    </div>

    {#if error}
      <div class="text-center">
        <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    {/if}
  </form>
</div>

<!-- Upgrade Modal -->
<UpgradeModal
  bind:show={showUpgradeModal}
  reason="client_limit"
  onClose={() => showUpgradeModal = false}
  monthlyLink={STRIPE_MONTHLY_LINK}
  yearlyLink={STRIPE_YEARLY_LINK}
/>