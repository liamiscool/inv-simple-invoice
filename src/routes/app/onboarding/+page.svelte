<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let step = $state(1);
  let isLoading = $state(false);
  let error = $state('');
  
  // Form data
  let fullName = $state('');
  let companyName = $state('');
  let companyAddress = $state('');
  let taxId = $state('');
  let bankDetails = $state('');
  let defaultCurrency = $state('EUR');
  
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
      
      // Create organization
      const { data: org, error: orgError } = await data.supabase
        .from('app_org')
        .insert({
          name: companyName || `${fullName}'s Organization`,
          owner_id: user.user.id
        })
        .select()
        .single();
        
      if (orgError) throw orgError;
      
      // Create user profile
      const { error: userError } = await data.supabase
        .from('app_user')
        .insert({
          id: user.user.id,
          org_id: org.id,
          full_name: fullName,
          company_name: companyName,
          company_address: companyAddress,
          tax_id: taxId,
          bank_details: bankDetails,
          default_currency: defaultCurrency
        });
        
      if (userError) throw userError;
      
      // Create default subscription (free plan)
      const { error: subError } = await data.supabase
        .from('plan_subscription')
        .insert({
          org_id: org.id,
          plan: 'free',
          status: 'active'
        });
        
      if (subError) throw subError;
      
      // Create send counter
      const { error: counterError } = await data.supabase
        .from('send_counter')
        .insert({
          org_id: org.id,
          sent_count: 0
        });
        
      if (counterError) throw counterError;
      
      // Redirect to dashboard
      window.location.href = '/app';
      
    } catch (err: any) {
      error = err.message || 'Something went wrong. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  function nextStep() {
    if (step < 2) step++;
  }
  
  function prevStep() {
    if (step > 1) step--;
  }
</script>

<svelte:head>
  <title>Setup - inv</title>
</svelte:head>

<div class="min-h-screen bg-white flex items-center justify-center px-4">
  <div class="w-full max-w-md space-y-8">
    <!-- Progress -->
    <div class="text-center space-y-3">
      <h1 class="text-base font-medium">Welcome to inv</h1>
      <p class="text-xs text-gray-500">
        Let's set up your account ({step}/2)
      </p>
      <div class="flex gap-2 justify-center">
        <div class="w-16 h-0.5 {step >= 1 ? 'bg-black' : 'bg-gray-200'} transition-colors"></div>
        <div class="w-16 h-0.5 {step >= 2 ? 'bg-black' : 'bg-gray-200'} transition-colors"></div>
      </div>
    </div>

    <form onsubmit={handleSubmit} class="space-y-6">
      {#if step === 1}
        <!-- Step 1: Personal Info -->
        <div class="space-y-5">
          <h2 class="text-sm font-medium">Personal Information</h2>

          <div>
            <label for="fullName" class="block text-xs text-gray-500 mb-1.5">Full Name</label>
            <input
              id="fullName"
              type="text"
              bind:value={fullName}
              placeholder="Your full name"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>

          <div>
            <label for="companyName" class="block text-xs text-gray-500 mb-1.5">Company Name</label>
            <input
              id="companyName"
              type="text"
              bind:value={companyName}
              placeholder="Your company name"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label for="defaultCurrency" class="block text-xs text-gray-500 mb-1.5">Default Currency</label>
            <select
              id="defaultCurrency"
              bind:value={defaultCurrency}
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            >
              {#each currencies as currency}
                <option value={currency.code}>{currency.name}</option>
              {/each}
            </select>
          </div>
        </div>

        <button
          type="button"
          onclick={nextStep}
          disabled={!fullName}
          class="w-full py-1.5 px-4 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      {:else if step === 2}
        <!-- Step 2: Company Details -->
        <div class="space-y-5">
          <h2 class="text-sm font-medium">Company Details <span class="text-gray-400">(Optional)</span></h2>

          <div>
            <label for="companyAddress" class="block text-xs text-gray-500 mb-1.5">Company Address</label>
            <textarea
              id="companyAddress"
              bind:value={companyAddress}
              placeholder="Your company address"
              rows="3"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
            ></textarea>
          </div>

          <div>
            <label for="taxId" class="block text-xs text-gray-500 mb-1.5">Tax ID / VAT Number</label>
            <input
              id="taxId"
              type="text"
              bind:value={taxId}
              placeholder="Your tax identification number"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label for="bankDetails" class="block text-xs text-gray-500 mb-1.5">Bank Transfer Details</label>
            <textarea
              id="bankDetails"
              bind:value={bankDetails}
              placeholder="Bank details to display on invoices (IBAN, account number, etc.)"
              rows="3"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            type="button"
            onclick={prevStep}
            class="flex-1 py-1.5 px-4 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isLoading}
            class="flex-1 py-1.5 px-4 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50"
          >
            {isLoading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </div>
      {/if}

      {#if error}
        <div class="text-center">
          <p class="text-xs text-red-600">{error}</p>
        </div>
      {/if}
    </form>

    <!-- Skip option -->
    {#if step === 2}
      <div class="text-center">
        <button
          onclick={handleSubmit}
          disabled={isLoading}
          class="text-xs text-gray-500 hover:text-black transition-colors"
        >
          Skip and continue with minimal setup
        </button>
      </div>
    {/if}
  </div>
</div>