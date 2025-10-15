<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  async function deleteClient() {
    if (!confirm(`Are you sure you want to delete ${data.client.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Hard delete: permanently remove the client
      const { error } = await data.supabase
        .from('client')
        .delete()
        .eq('id', data.client.id);

      if (error) throw error;

      window.location.href = '/app/clients';

    } catch (err) {
      alert('Failed to delete client. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>{data.client.name} - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1 dark:text-white">{data.client.name}</h1>
      <!-- Breadcrumbs -->
      <div class="flex items-center gap-2 text-xs">
        <a href="/app/clients" class="text-gray-400 hover:text-black dark:hover:text-white transition-colors">Clients</a>
        <span class="text-gray-400">/</span>
        <span class="text-gray-600 dark:text-gray-400">{data.client.name}</span>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="/app/clients/{data.client.id}/edit"
        class="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 dark:border-gray-600 dark:text-white dark:hover:bg-dark-hover transition-colors duration-75"
      >
        Edit
      </a>
      <button
        onclick={deleteClient}
        class="px-5 py-2.5 border border-red-300 text-red-600 text-sm hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors duration-75"
      >
        Delete
      </button>
    </div>
  </div>

  <!-- Client Information -->
  <div class="border-t border-b border-gray-200 dark:border-gray-700 py-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Basic Information</h2>

        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</dt>
          <dd class="text-base dark:text-white">{data.client.name}</dd>
        </div>

        {#if data.client.company}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Company</dt>
            <dd class="text-base dark:text-white">{data.client.company}</dd>
          </div>
        {/if}

        {#if data.client.email}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Email</dt>
            <dd class="text-base dark:text-white">
              <a href="mailto:{data.client.email}" class="hover:text-black dark:hover:text-white transition-colors">
                {data.client.email}
              </a>
            </dd>
          </div>
        {/if}

        <div>
          <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Currency</dt>
          <dd class="text-base dark:text-white">{data.client.currency || 'EUR'}</dd>
        </div>
      </div>

      <div class="space-y-5">
        <h2 class="text-base font-medium pb-2 border-b border-gray-200 dark:text-white dark:border-gray-700">Legal Information</h2>

        {#if data.client.legal_name}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Legal Name</dt>
            <dd class="text-base dark:text-white">{data.client.legal_name}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Legal Name</dt>
            <dd class="text-sm text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.company_address}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Company Address</dt>
            <dd class="text-base dark:text-white whitespace-pre-wrap">{data.client.company_address}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Company Address</dt>
            <dd class="text-sm text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.tax_id}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Tax ID</dt>
            <dd class="text-base dark:text-white">{data.client.tax_id}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Tax ID</dt>
            <dd class="text-sm text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.notes}
          <div>
            <dt class="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</dt>
            <dd class="text-base dark:text-white whitespace-pre-wrap">{data.client.notes}</dd>
          </div>
        {/if}
      </div>
    </div>
  </div>

</div>
