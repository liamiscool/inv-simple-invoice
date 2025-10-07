<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Dashboard - inv</title>
</svelte:head>

<div class="space-y-6">
  <!-- Welcome -->
  <div>
    <h1 class="text-lg mb-2">Dashboard</h1>
    <p class="text-xs text-gray-600">
      Welcome back! {data.session?.user?.email || 'User'}
    </p>
  </div>
  
  <!-- Quick stats -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="border border-thin rounded-sm p-4">
      <div class="text-lg font-light">0</div>
      <div class="text-xs text-gray-600">Draft invoices</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-lg font-light">0</div>
      <div class="text-xs text-gray-600">Sent this month</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-lg font-light">$0</div>
      <div class="text-xs text-gray-600">Outstanding</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-lg font-light">0</div>
      <div class="text-xs text-gray-600">Clients</div>
    </div>
  </div>
  
  <!-- Quick actions -->
  <div class="space-y-4">
    <h2 class="text-sm">Quick actions</h2>
    <div class="flex flex-wrap gap-3">
      <a 
        href="/app/invoices/new"
        class="inline-flex items-center px-4 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75"
      >
        Create invoice
      </a>
      <a 
        href="/app/clients/new"
        class="inline-flex items-center px-4 py-2 border border-thin text-xs hover:border-black transition-colors duration-75"
      >
        Add client
      </a>
      <a 
        href="/app/templates"
        class="inline-flex items-center px-4 py-2 border border-thin text-xs hover:border-black transition-colors duration-75"
      >
        Browse templates
      </a>
    </div>
  </div>
  
  <!-- Recent activity placeholder -->
  <div class="space-y-4">
    <h2 class="text-sm">Recent activity</h2>
    <div class="border border-thin rounded-sm p-8 text-center text-gray-500">
      <p class="text-xs">No recent activity</p>
      <p class="text-xs">Create your first invoice to get started</p>
    </div>
  </div>
</div>