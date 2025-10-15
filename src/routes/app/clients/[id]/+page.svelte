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
      <h1 class="text-base font-medium mb-1">{data.client.name}</h1>
      <p class="text-xs text-gray-500">
        Client Details
      </p>
    </div>
    <div class="flex items-center gap-3">
      <a
        href="/app/clients/{data.client.id}/edit"
        class="px-4 py-1.5 border border-gray-300 text-gray-700 text-xs hover:bg-gray-50 transition-colors duration-75"
      >
        Edit
      </a>
      <button
        onclick={deleteClient}
        class="px-4 py-1.5 border border-red-300 text-red-600 text-xs hover:bg-red-50 transition-colors duration-75"
      >
        Delete
      </button>
    </div>
  </div>

  <!-- Client Information -->
  <div class="border-t border-b border-gray-200 py-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="space-y-5">
        <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Basic Information</h2>

        <div>
          <dt class="text-xs text-gray-500 mb-1">Name</dt>
          <dd class="text-sm">{data.client.name}</dd>
        </div>

        {#if data.client.company}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Company</dt>
            <dd class="text-sm">{data.client.company}</dd>
          </div>
        {/if}

        {#if data.client.email}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Email</dt>
            <dd class="text-sm">
              <a href="mailto:{data.client.email}" class="hover:text-black transition-colors">
                {data.client.email}
              </a>
            </dd>
          </div>
        {/if}

        <div>
          <dt class="text-xs text-gray-500 mb-1">Currency</dt>
          <dd class="text-sm">{data.client.currency || 'EUR'}</dd>
        </div>
      </div>

      <div class="space-y-5">
        <h2 class="text-sm font-medium pb-2 border-b border-gray-200">Legal Information</h2>

        {#if data.client.legal_name}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Legal Name</dt>
            <dd class="text-sm">{data.client.legal_name}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Legal Name</dt>
            <dd class="text-xs text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.company_address}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Company Address</dt>
            <dd class="text-sm whitespace-pre-wrap">{data.client.company_address}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Company Address</dt>
            <dd class="text-xs text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.tax_id}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Tax ID</dt>
            <dd class="text-sm">{data.client.tax_id}</dd>
          </div>
        {:else}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Tax ID</dt>
            <dd class="text-xs text-gray-400">Not provided</dd>
          </div>
        {/if}

        {#if data.client.notes}
          <div>
            <dt class="text-xs text-gray-500 mb-1">Notes</dt>
            <dd class="text-sm whitespace-pre-wrap">{data.client.notes}</dd>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Back Button -->
  <div>
    <a
      href="/app/clients"
      class="inline-flex items-center text-xs text-gray-500 hover:text-black transition-colors"
    >
      ← Back to Clients
    </a>
  </div>
</div>
