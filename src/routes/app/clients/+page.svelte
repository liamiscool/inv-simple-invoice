<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let searchQuery = $state('');
  
  // Filter clients based on search query
  const filteredClients = $derived(
    data.clients?.filter(client => 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
  );
  
  async function deleteClient(clientId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return;
    }

    try {
      // Hard delete: permanently remove the client
      const { error } = await data.supabase
        .from('client')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      // Refresh the page data
      window.location.reload();

    } catch (err) {
      alert('Failed to delete client. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Clients - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1 dark:text-white">Clients</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        {data.clients?.length || 0} total
      </p>
    </div>
    <a
      href="/app/clients/new"
      class="px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
    >
      Add Client
    </a>
  </div>

  <!-- Search -->
  <div class="max-w-sm">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search clients..."
      class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-colors dark:bg-dark-input dark:text-white"
    />
  </div>

  {#if !data.clients || data.clients.length === 0}
    <!-- Empty state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-base font-medium dark:text-white">No clients yet</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Add your first client to start creating and sending invoices
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else if filteredClients.length === 0}
    <!-- No search results -->
    <div class="py-12 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No clients match your search for "{searchQuery}"
      </p>
    </div>
  {:else}
    <!-- Desktop: Clients table -->
    <div class="hidden md:block border-t border-b border-gray-200 dark:border-gray-700">
      <table class="w-full">
        <thead class="border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Name</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Company</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Email</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Currency</th>
            <th class="text-left text-sm text-gray-500 dark:text-gray-400 px-4 py-4 font-medium">Added</th>
            <th class="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredClients as client, i}
            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-dark-hover">
              <td class="px-4 py-4">
                <a
                  href="/app/clients/{client.id}"
                  class="text-sm hover:text-black dark:hover:text-white transition-colors font-medium dark:text-white"
                >
                  {client.name}
                </a>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {client.company || '—'}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-600 dark:text-gray-300">
                  {client.email || '—'}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-300">
                  {client.currency || 'EUR'}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm text-gray-500 dark:text-gray-300">
                  {new Date(client.created_at || '').toLocaleDateString()}
                </span>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <a
                    href="/app/clients/{client.id}/edit"
                    class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Edit
                  </a>
                  <button
                    onclick={() => deleteClient(client.id, client.name)}
                    class="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile: Clients cards -->
    <div class="block md:hidden space-y-3">
      {#each filteredClients as client}
        <div class="border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50/50 dark:hover:bg-dark-hover transition-colors">
          <a href="/app/clients/{client.id}" class="block">
            <!-- Name -->
            <div class="text-sm font-medium hover:text-black dark:hover:text-white transition-colors mb-2 dark:text-white">
              {client.name}
            </div>

            <!-- Details -->
            <div class="space-y-1 text-sm mb-3">
              {#if client.company}
                <div class="text-gray-600 dark:text-gray-300">{client.company}</div>
              {/if}
              {#if client.email}
                <div class="text-gray-600 dark:text-gray-300">{client.email}</div>
              {/if}
              <div class="text-gray-500 dark:text-gray-400">
                {client.currency || 'EUR'} • Added {new Date(client.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </a>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <a
              href="/app/clients/{client.id}/edit"
              class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Edit
            </a>
            <button
              onclick={() => deleteClient(client.id, client.name)}
              class="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    </div>

    <!-- Summary -->
    <div class="text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredClients.length} of {data.clients?.length || 0} clients
      </p>
    </div>
  {/if}
</div>