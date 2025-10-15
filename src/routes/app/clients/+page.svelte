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
      <h1 class="text-base font-medium mb-1">Clients</h1>
      <p class="text-xs text-gray-500">
        {data.clients?.length || 0} total
      </p>
    </div>
    <a
      href="/app/clients/new"
      class="px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
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
      class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black transition-colors"
    />
  </div>

  {#if !data.clients || data.clients.length === 0}
    <!-- Empty state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-sm font-medium">No clients yet</h2>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          Add your first client to start creating and sending invoices
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else if filteredClients.length === 0}
    <!-- No search results -->
    <div class="py-12 text-center">
      <p class="text-xs text-gray-500">
        No clients match your search for "{searchQuery}"
      </p>
    </div>
  {:else}
    <!-- Clients table -->
    <div class="border-t border-b border-gray-200">
      <table class="w-full">
        <thead class="border-b border-gray-200">
          <tr>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Name</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Company</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Email</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Currency</th>
            <th class="text-left text-xs text-gray-500 px-4 py-3 font-medium">Added</th>
            <th class="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredClients as client, i}
            <tr class="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
              <td class="px-4 py-3">
                <a
                  href="/app/clients/{client.id}"
                  class="text-xs hover:text-black transition-colors font-medium"
                >
                  {client.name}
                </a>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {client.company || '—'}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {client.email || '—'}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-500">
                  {client.currency || 'EUR'}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-500">
                  {new Date(client.created_at || '').toLocaleDateString()}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <a
                    href="/app/clients/{client.id}/edit"
                    class="text-xs text-gray-500 hover:text-black transition-colors"
                  >
                    Edit
                  </a>
                  <button
                    onclick={() => deleteClient(client.id, client.name)}
                    class="text-xs text-gray-500 hover:text-red-600 transition-colors"
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

    <!-- Summary -->
    <div class="text-center">
      <p class="text-xs text-gray-500">
        Showing {filteredClients.length} of {data.clients?.length || 0} clients
      </p>
    </div>
  {/if}
</div>