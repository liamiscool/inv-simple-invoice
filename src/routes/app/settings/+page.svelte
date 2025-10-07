<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);
  let message = $state('');
  let error = $state('');
  
  // Form data - initialize with current data
  let fullName = $state(data.profile?.full_name || '');
  let companyName = $state(data.profile?.company_name || '');
  let companyAddress = $state(data.profile?.company_address || '');
  let taxId = $state(data.profile?.tax_id || '');
  let bankDetails = $state(data.profile?.bank_details || '');
  let defaultCurrency = $state(data.profile?.default_currency || 'EUR');
  
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
    message = '';
    
    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) throw new Error('No user found');
      
      const { error: updateError } = await data.supabase
        .from('app_user')
        .update({
          full_name: fullName,
          company_name: companyName,
          company_address: companyAddress,
          tax_id: taxId,
          bank_details: bankDetails,
          default_currency: defaultCurrency
        })
        .eq('id', user.user.id);
        
      if (updateError) throw updateError;
      
      message = 'Settings saved successfully!';
      
    } catch (err: any) {
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - inv</title>
</svelte:head>

<div class="max-w-2xl space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-sm mb-2">Settings</h1>
    <p class="text-xs text-gray-600">
      Manage your profile and company information
    </p>
  </div>
  
  <form onsubmit={handleSubmit} class="space-y-6">
    <!-- Personal Information -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Personal Information</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="fullName" class="block text-xs text-gray-600 mb-1">Full Name</label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            placeholder="Your full name"
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>
        
        <div>
          <label for="defaultCurrency" class="block text-xs text-gray-600 mb-1">Default Currency</label>
          <select
            id="defaultCurrency"
            bind:value={defaultCurrency}
            class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
          >
            {#each currencies as currency}
              <option value={currency.code}>{currency.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
    
    <!-- Company Information -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Company Information</h2>
      
      <div>
        <label for="companyName" class="block text-xs text-gray-600 mb-1">Company Name</label>
        <input
          id="companyName"
          type="text"
          bind:value={companyName}
          placeholder="Your company name"
          class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
        />
      </div>
      
      <div>
        <label for="companyAddress" class="block text-xs text-gray-600 mb-1">Company Address</label>
        <textarea
          id="companyAddress"
          bind:value={companyAddress}
          placeholder="Your company address"
          rows="3"
          class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors resize-none"
        ></textarea>
      </div>
      
      <div>
        <label for="taxId" class="block text-xs text-gray-600 mb-1">Tax ID / VAT Number</label>
        <input
          id="taxId"
          type="text"
          bind:value={taxId}
          placeholder="Your tax identification number"
          class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
        />
      </div>
    </div>
    
    <!-- Bank Details -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Bank Transfer Details</h2>
      
      <div>
        <label for="bankDetails" class="block text-xs text-gray-600 mb-1">Bank Information</label>
        <textarea
          id="bankDetails"
          bind:value={bankDetails}
          placeholder="Bank details to display on invoices (IBAN, account number, etc.)"
          rows="4"
          class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors resize-none"
        ></textarea>
        <p class="text-xs text-gray-500 mt-1">
          This information will be displayed on your invoices for bank transfer payments
        </p>
      </div>
    </div>
    
    <!-- Account Information -->
    <div class="border border-thin rounded-sm p-6 space-y-4">
      <h2 class="text-xs mb-4">Account</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-600 mb-1">Email</label>
          <div class="px-3 py-2 text-xs border border-thin rounded-sm bg-gray-50 text-gray-600">
            {data.session?.user?.email || 'Not available'}
          </div>
        </div>
        
        <div>
          <label class="block text-xs text-gray-600 mb-1">Plan</label>
          <div class="px-3 py-2 text-xs border border-thin rounded-sm bg-gray-50 text-gray-600">
            {data.subscription?.plan === 'free' ? 'Free' : 'Pro'} Plan
          </div>
        </div>
      </div>
      
      {#if data.subscription?.plan === 'free'}
        <div class="pt-3 border-t border-thin">
          <p class="text-xs text-gray-600 mb-2">
            Upgrade to Pro for unlimited sending and custom templates
          </p>
          <button
            type="button"
            class="px-4 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75"
          >
            Upgrade to Pro
          </button>
        </div>
      {/if}
    </div>
    
    <!-- Save Button -->
    <div class="flex justify-end">
      <button
        type="submit"
        disabled={isLoading}
        class="px-6 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
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
  </form>
</div>