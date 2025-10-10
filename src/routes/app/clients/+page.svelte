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

<div class="max-w-5xl space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-sm mb-1">Clients</h1>
      <p class="text-xs text-gray-600">
        {data.clients?.length || 0} clients total
      </p>
    </div>
    <a
      href="/app/clients/new"
      class="px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium"
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
      class="w-full px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
    />
  </div>
  
  {#if !data.clients || data.clients.length === 0}
    <!-- Empty state -->
    <div class="border border-thin rounded-sm p-12 text-center">
      <div class="space-y-3">
        <h2 class="text-xs">No clients yet</h2>
        <p class="text-xs text-gray-600 max-w-sm mx-auto">
          Add your first client to start creating and sending invoices
        </p>
        <a
          href="/app/clients/new"
          class="inline-flex items-center px-4 py-2 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75 font-medium"
        >
          Add Your First Client
        </a>
      </div>
    </div>
  {:else if filteredClients.length === 0}
    <!-- No search results -->
    <div class="border border-thin rounded-sm p-8 text-center">
      <p class="text-xs text-gray-600">
        No clients match your search for "{searchQuery}"
      </p>
    </div>
  {:else}
    <!-- Clients table -->
    <div class="border border-thin rounded-sm overflow-hidden">
      <table class="w-full">
        <thead class="border-b border-thin bg-gray-50">
          <tr>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Name</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Company</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Email</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Currency</th>
            <th class="text-left text-xs text-gray-600 px-4 py-3 font-normal">Added</th>
            <th class="w-16"></th>
          </tr>
        </thead>
        <tbody>
          {#each filteredClients as client, i}
            <tr class="border-b border-thin last:border-b-0 hover:bg-gray-50">
              <td class="px-4 py-3">
                <a 
                  href="/app/clients/{client.id}"
                  class="text-xs hover:text-black transition-colors"
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
                <span class="text-xs text-gray-600">
                  {client.currency || 'EUR'}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs text-gray-600">
                  {new Date(client.created_at || '').toLocaleDateString()}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <a 
                    href="/app/clients/{client.id}/edit"
                    class="text-xs text-gray-600 hover:text-black transition-colors"
                  >
                    Edit
                  </a>
                  <button
                    onclick={() => deleteClient(client.id, client.name)}
                    class="text-xs text-gray-600 hover:text-red-600 transition-colors"
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
      <p class="text-xs text-gray-600">
        Showing {filteredClients.length} of {data.clients?.length || 0} clients
      </p>
    </div>
  {/if}
</div>