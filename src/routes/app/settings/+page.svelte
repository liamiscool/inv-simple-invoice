<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);
  let message = $state('');
  let error = $state('');

  // Custom fields state
  let showCustomFieldForm = $state(false);
  let customFieldLabel = $state('');
  let isCustomFieldCreating = $state(false);
  
  // Form data - initialize with current data
  let fullName = $state(data.profile?.full_name || '');
  let companyName = $state(data.profile?.company_name || '');
  let companyAddress = $state(data.profile?.company_address || '');
  let taxId = $state(data.profile?.tax_id || '');
  let bankDetails = $state(data.profile?.bank_details || '');
  let defaultCurrency = $state(data.profile?.default_currency || 'EUR');
  let operatesAsCompany = $state(data.profile?.operates_as_company || false);
  
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
          default_currency: defaultCurrency,
          operates_as_company: operatesAsCompany
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

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-lg font-medium mb-1 dark:text-white">Settings</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Manage your profile and company information
    </p>
  </div>

  <!-- Profile Form -->
  <form onsubmit={handleSubmit} class="space-y-12">
    <!-- Personal Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Personal Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="fullName" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Full Name</label>
          <input
            id="fullName"
            type="text"
            bind:value={fullName}
            placeholder="Your full name"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
            required
          />
        </div>

        <div>
          <label for="defaultCurrency" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Default Currency</label>
          <select
            id="defaultCurrency"
            bind:value={defaultCurrency}
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
          >
            {#each currencies as currency}
              <option value={currency.code}>{currency.name}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Company Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Company Information</h2>

      <div class="flex items-center gap-2">
        <input
          id="operatesAsCompany"
          type="checkbox"
          bind:checked={operatesAsCompany}
          class="w-4 h-4 border-gray-300 focus:ring-black"
        />
        <label for="operatesAsCompany" class="text-sm text-gray-700 cursor-pointer dark:text-gray-300">
          I operate as a registered business/company
        </label>
      </div>

      <div>
        <label for="companyName" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">
          {operatesAsCompany ? 'Company Name' : 'Business Name (optional)'}
        </label>
        <input
          id="companyName"
          type="text"
          bind:value={companyName}
          placeholder={operatesAsCompany ? 'Your registered company name' : 'Your business/trading name'}
          class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
        />
      </div>

      <div>
        <label for="companyAddress" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Company Address</label>
        <textarea
          id="companyAddress"
          bind:value={companyAddress}
          placeholder="Your company address"
          rows="3"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
        ></textarea>
      </div>

      <div>
        <label for="taxId" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Tax ID / VAT Number</label>
        <input
          id="taxId"
          type="text"
          bind:value={taxId}
          placeholder="Your tax identification number"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
        />
      </div>
    </div>

    <!-- Bank Details -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Bank Transfer Details</h2>

      <div>
        <label for="bankDetails" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Bank Information</label>
        <textarea
          id="bankDetails"
          bind:value={bankDetails}
          placeholder="Bank details to display on invoices (IBAN, account number, etc.)"
          rows="4"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
        ></textarea>
        <p class="text-sm text-gray-400 mt-1.5">
          This information will be displayed on your invoices for bank transfer payments
        </p>
      </div>
    </div>

    <!-- Save Button -->
    <div class="flex justify-end pt-4">
      <button
        type="submit"
        disabled={isLoading}
        class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 dark:bg-dark-button dark:hover:bg-dark-button-hover"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>

    <!-- Messages -->
    {#if message}
      <div class="text-center">
        <p class="text-sm text-green-600 dark:text-green-400">{message}</p>
      </div>
    {/if}

    {#if error}
      <div class="text-center">
        <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    {/if}
  </form>

  <!-- Template Settings / Custom Fields (separate from profile form) -->
  <div class="space-y-12 mt-12">
    <div class="space-y-5">
      <div class="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-base font-medium dark:text-white">Custom Template Fields</h2>
        <button
          type="button"
          onclick={() => { showCustomFieldForm = !showCustomFieldForm; customFieldLabel = ''; }}
          class="px-5 py-2.5 text-sm bg-black text-white hover:bg-gray-800 transition-colors dark:bg-dark-button dark:hover:bg-dark-button-hover"
        >
          {showCustomFieldForm ? 'Cancel' : '+ New Field'}
        </button>
      </div>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        Create custom fields that can be used across all your invoice templates
      </p>

      <!-- Create Custom Field Form -->
      {#if showCustomFieldForm}
        <div class="border border-gray-300 rounded-sm p-4 bg-gray-50 dark:border-gray-600 dark:bg-dark-input">
          <form
            method="POST"
            action="?/createCustomField"
            use:enhance={() => {
              isCustomFieldCreating = true;
              return async ({ update, result }) => {
                isCustomFieldCreating = false;
                if (result.type === 'success') {
                  customFieldLabel = '';
                  showCustomFieldForm = false;
                }
                await update();
              };
            }}
            class="space-y-3"
          >
            <div>
              <label for="field_label" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">
                Field Label
              </label>
              <input
                id="field_label"
                name="field_label"
                type="text"
                bind:value={customFieldLabel}
                placeholder="e.g., Project Code, PO Number, Reference"
                class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
                required
              />
            </div>

            <div class="flex gap-2">
              <button
                type="submit"
                disabled={isCustomFieldCreating || !customFieldLabel.trim()}
                class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 dark:bg-dark-button dark:hover:bg-dark-button-hover"
              >
                {isCustomFieldCreating ? 'Creating...' : 'Create Field'}
              </button>
              <button
                type="button"
                onclick={() => { showCustomFieldForm = false; customFieldLabel = ''; }}
                class="px-5 py-2.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      {/if}

      <!-- Custom Fields List -->
      {#if data.customFields && data.customFields.length > 0}
        <div class="border border-gray-200 rounded-sm divide-y divide-gray-200 dark:border-gray-700 dark:divide-gray-700">
          {#each data.customFields as field}
            <div class="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors dark:hover:bg-dark-hover">
              <div>
                <div class="text-sm font-medium dark:text-white">{field.field_label}</div>
                <div class="text-sm text-gray-500 mt-0.5 dark:text-gray-400">
                  <code class="font-mono text-sm bg-gray-100 px-1 py-0.5 rounded dark:bg-dark-bg dark:text-gray-300">{field.field_name}</code>
                </div>
              </div>

              <form
                method="POST"
                action="?/deleteCustomField"
                use:enhance={({ cancel }) => {
                  if (!confirm(`Delete "${field.field_label}"? This will remove it from all templates.`)) {
                    cancel();
                  }
                  return async ({ update }) => {
                    await update();
                  };
                }}
              >
                <input type="hidden" name="field_id" value={field.id} />
                <button
                  type="submit"
                  class="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-sm transition-colors dark:hover:bg-red-950/20 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </form>
            </div>
          {/each}
        </div>
      {:else if !showCustomFieldForm}
        <div class="text-sm text-gray-500 italic dark:text-gray-400">
          No custom fields yet. Click "+ New Field" to create one.
        </div>
      {/if}
    </div>
  </div>

  <!-- Account Information (separate section, no form needed) -->
  <div class="space-y-12 mt-12">
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Account</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Email</label>
          <div class="px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 text-gray-500 dark:bg-dark-input dark:text-gray-400 dark:border-gray-600">
            {data.session?.user?.email || 'Not available'}
          </div>
        </div>

        <div>
          <label class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Plan</label>
          <div class="px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 text-gray-500 dark:bg-dark-input dark:text-gray-400 dark:border-gray-600">
            {data.subscription?.plan === 'free' ? 'Free' : 'Pro'} Plan
          </div>
        </div>
      </div>

      {#if data.subscription?.plan === 'free'}
        <div class="pt-5 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 mb-3 dark:text-gray-400">
            Upgrade to Pro for unlimited sending and custom templates
          </p>
          <button
            type="button"
            class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 dark:bg-dark-button dark:hover:bg-dark-button-hover"
          >
            Upgrade to Pro
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>