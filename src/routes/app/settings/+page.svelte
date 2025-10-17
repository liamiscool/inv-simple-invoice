<script lang="ts">
  import type { PageData } from './$types';
  import { DATE_FORMAT_OPTIONS } from '$lib/utils/dateFormat';
  import { enhance } from '$app/forms';
  import type { Database } from '$lib/types/database.types';
  import { notify } from '$lib/stores/notifications';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  
  let { data }: { data: PageData } = $props();
  
  let isLoading = $state(false);

  // Custom fields state
  let showCustomFieldForm = $state(false);
  let customFieldLabel = $state('');
  let isCustomFieldCreating = $state(false);
  
  // Account update state
  let newEmail = $state(data.session?.user?.email || '');
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmNewPassword = $state('');
  let isAccountLoading = $state(false);
  
  // Reactive current email that updates when session changes
  let currentEmail = $state(data.session?.user?.email || '');
  
  // Form data - initialize with current data
  let fullName = $state(data.profile?.full_name || '');
  let companyName = $state(data.profile?.company_name || '');
  let companyAddress = $state(data.profile?.company_address || '');
  let taxId = $state(data.profile?.tax_id || '');
  let bankDetails = $state(data.profile?.bank_details || '');
  let defaultCurrency = $state(data.profile?.default_currency || 'EUR');
  let dateFormat = $state(data.profile?.date_format || 'AU');
  let operatesAsCompany = $state(data.profile?.operates_as_company || false);
  
  const currencies = [
    { code: 'EUR', name: 'Euro (€)' },
    { code: 'USD', name: 'US Dollar ($)' },
    { code: 'GBP', name: 'British Pound (£)' },
    { code: 'CAD', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', name: 'Australian Dollar (A$)' }
  ];

  // Handle email verification success
  onMount(() => {
    if ($page.url.searchParams.get('email_verified') === 'true') {
      // Refresh the session to get updated email
      data.supabase.auth.getSession().then(({ data: sessionData }) => {
        if (sessionData.session?.user?.email) {
          currentEmail = sessionData.session.user.email;
          newEmail = sessionData.session.user.email;
          notify.success('Email Updated', 'Your email address has been successfully updated!');
        }
      });
      
      // Clean up the URL
      window.history.replaceState({}, '', '/app/settings');
    }
  });
  
  async function handleAccountUpdate(e: Event) {
    e.preventDefault();
    isAccountLoading = true;
    
    try {
      const { data: user, error: userError } = await data.supabase.auth.getUser();
      if (userError) throw userError;
      if (!user.user) throw new Error('No user found');
      
      // Check if email changed
      const emailChanged = newEmail !== currentEmail;
      
      if (emailChanged) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          throw new Error('Please enter a valid email address');
        }
      }
      
      // Check if password fields are filled
      const passwordChangeRequested = currentPassword || newPassword || confirmNewPassword;
      
      if (passwordChangeRequested) {
        // Validate password fields
        if (!currentPassword) {
          throw new Error('Current password is required to change password');
        }
        if (!newPassword) {
          throw new Error('New password is required');
        }
        if (newPassword.length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
        if (newPassword !== confirmNewPassword) {
          throw new Error('New passwords do not match');
        }
        
        // Verify current password by attempting to sign in
        const { error: signInError } = await data.supabase.auth.signInWithPassword({
          email: data.session?.user?.email || '',
          password: currentPassword
        });
        
        if (signInError) {
          throw new Error('Current password is incorrect');
        }
        
        // Update password
        const { error: passwordError } = await data.supabase.auth.updateUser({
          password: newPassword
        });
        
        if (passwordError) throw passwordError;
        
        // Clear password fields
        currentPassword = '';
        newPassword = '';
        confirmNewPassword = '';
        
        notify.success('Password Updated', 'Your password has been changed successfully');
      }
      
      if (emailChanged) {
        // Update email with verification redirect
        // For local development, use localhost:5173, for production use the actual origin
        const redirectUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5173/auth/callback'
          : `${window.location.origin}/auth/callback`;
          
        const { error: emailError } = await data.supabase.auth.updateUser({
          email: newEmail
        }, {
          emailRedirectTo: redirectUrl
        });
        
        if (emailError) throw emailError;
        
        notify.info('Email Update Initiated', 'Check your new email for a verification link. You must click the link to confirm the email change.');
      }
      
      if (!emailChanged && !passwordChangeRequested) {
        notify.info('No Changes', 'No changes to save');
      }
      
    } catch (err: any) {
      // Handle network timeout errors gracefully
      if (err?.code === 'UND_ERR_CONNECT_TIMEOUT' || err?.message?.includes('timeout')) {
        notify.error('Network Timeout', 'Please check your connection and try again');
      } else {
        notify.error('Update Failed', err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      isAccountLoading = false;
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    
    try {
      const { data: user, error: userError } = await data.supabase.auth.getUser();
      if (userError) throw userError;
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
          date_format: dateFormat,
          operates_as_company: operatesAsCompany
        } as any)
        .eq('id', user.user.id);
        
      if (updateError) throw updateError;
      
      notify.success('Settings Saved', 'Your profile settings have been updated successfully');
      
    } catch (err: any) {
      // Handle network timeout errors gracefully
      if (err?.code === 'UND_ERR_CONNECT_TIMEOUT' || err?.message?.includes('timeout')) {
        notify.error('Network Timeout', 'Please check your connection and try again');
      } else {
        notify.error('Save Failed', err.message || 'Something went wrong. Please try again.');
      }
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
      Manage your account, profile and company information
    </p>
  </div>

  <!-- Account Form -->
  <form onsubmit={handleAccountUpdate} class="space-y-12">
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Account</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label for="newEmail" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Email</label>
          <input
            id="newEmail"
            type="email"
            bind:value={newEmail}
            placeholder="your@email.com"
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
            required
          />
          <p class="text-xs text-gray-400 mt-1">
            Current: {currentEmail || 'Not available'}
          </p>

        </div>

        <div>
          <div class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Plan</div>
          <div class="px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 text-gray-500 dark:bg-dark-input dark:text-gray-400 dark:border-gray-600">
            {data.subscription?.plan === 'free' ? 'Free' : 'Pro'} Plan
          </div>
        </div>
      </div>

      <!-- Password Change Section -->
      <div class="pt-5 border-t border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium mb-3 dark:text-white">Change Password</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label for="currentPassword" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              bind:value={currentPassword}
              placeholder="Enter current password"
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
            />
          </div>

          <div>
            <label for="newPassword" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">New Password</label>
            <input
              id="newPassword"
              type="password"
              bind:value={newPassword}
              placeholder="Enter new password"
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
            />
          </div>

          <div>
            <label for="confirmNewPassword" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type="password"
              bind:value={confirmNewPassword}
              placeholder="Confirm new password"
              class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
            />
          </div>
        </div>
        
        <p class="text-xs text-gray-400 mt-2">
          Leave password fields empty if you don't want to change your password
        </p>
      </div>

      <!-- Account Save Button -->
      <div class="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isAccountLoading}
          class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 dark:bg-dark-button dark:hover:bg-dark-button-hover"
        >
          {isAccountLoading ? 'Updating...' : 'Update Account'}
        </button>
      </div>

    </div>
  </form>

  <!-- Profile Form -->
  <form onsubmit={handleSubmit} class="space-y-12">
    <!-- Personal Information -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Personal Information</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
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

        <div>
          <label for="dateFormat" class="block text-sm text-gray-500 mb-1.5 dark:text-gray-400">Date Format</label>
          <select
            id="dateFormat"
            bind:value={dateFormat}
            class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors dark:bg-dark-input dark:text-white dark:border-gray-600 dark:focus:border-gray-500"
          >
            {#each DATE_FORMAT_OPTIONS as option}
              <option value={option.value}>{option.label} - {option.example}</option>
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
              return async ({ update, result }: any) => {
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
                use:enhance={({ cancel }: any) => {
                  if (!confirm(`Delete "${field.field_label}"? This will remove it from all templates.`)) {
                    cancel();
                  }
                  return async ({ update }: any) => {
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

  <!-- Upgrade Section -->
  {#if data.subscription?.plan === 'free'}
    <div class="space-y-12 mt-12">
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Upgrade</h2>
        
        <div class="pt-5">
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
      </div>
    </div>
  {/if}
</div>