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
  let email = $state('');
  let currency = $state('EUR');
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
          email: email || null,
          currency,
          notes: notes || null
        });

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

<div class="max-w-2xl space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-sm mb-2">Add Client</h1>
    <p class="text-xs text-gray-600">
      Add a new client to start creating invoices
    </p>
  </div>
  
  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Basic Information -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Basic Information</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="name" class="block text-xs text-gray-600 mb-1">
            Client Name <span class="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            bind:value={name}
            placeholder="John Doe"
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>
        
        <div>
          <label for="company" class="block text-xs text-gray-600 mb-1">Company</label>
          <input
            id="company"
            type="text"
            bind:value={company}
            placeholder="Acme Inc."
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="email" class="block text-xs text-gray-600 mb-1">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="john@example.com"
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
          />
        </div>
        
        <div>
          <label for="currency" class="block text-xs text-gray-600 mb-1">Preferred Currency</label>
          <select
            id="currency"
            bind:value={currency}
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
          >
            {#each currencies as curr}
              <option value={curr.code}>{curr.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
    
    <!-- Additional Information -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Additional Information</h2>
      
      <div>
        <label for="notes" class="block text-xs text-gray-600 mb-1">Notes</label>
        <textarea
          id="notes"
          bind:value={notes}
          placeholder="Additional notes about this client..."
          rows="3"
          class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors resize-none"
        ></textarea>
      </div>
    </div>
    
    <!-- Actions -->
    <div class="flex items-center justify-between">
      <a
        href="/app/clients"
        class="px-4 py-2 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
      >
        Cancel
      </a>

      <button
        type="submit"
        disabled={isLoading || !name}
        class="px-6 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding Client...' : 'Add Client'}
      </button>
    </div>
    
    {#if error}
      <div class="text-center">
        <p class="text-xs text-red-600">{error}</p>
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