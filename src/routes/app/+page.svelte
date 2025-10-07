<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Dashboard - inv</title>
</svelte:head>

<div class="max-w-5xl space-y-6">
  <!-- Welcome -->
  <div>
    <h1 class="text-sm mb-2">Dashboard</h1>
    <p class="text-xs text-gray-600">
      Welcome back, {data.session?.user?.email?.split('@')[0] || 'User'}
    </p>
  </div>
  
  <!-- Quick stats -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="border border-thin rounded-sm p-4">
      <div class="text-2xl font-light mb-1">0</div>
      <div class="text-xs text-gray-600">Draft invoices</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-2xl font-light mb-1">0</div>
      <div class="text-xs text-gray-600">Sent this month</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-2xl font-light mb-1">$0</div>
      <div class="text-xs text-gray-600">Outstanding</div>
    </div>
    <div class="border border-thin rounded-sm p-4">
      <div class="text-2xl font-light mb-1">0</div>
      <div class="text-xs text-gray-600">Clients</div>
    </div>
  </div>
  
  <!-- Quick actions -->
  <div class="space-y-4">
    <h2 class="text-xs">Quick actions</h2>
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
  
  <!-- Getting started guide -->
  <div class="space-y-4">
    <h2 class="text-xs">Get started</h2>
    <div class="border border-thin rounded-sm p-6">
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 border border-thin rounded-sm flex items-center justify-center">
            <div class="w-2 h-2 bg-gray-400 rounded-sm"></div>
          </div>
          <div class="flex-1">
            <div class="text-xs font-normal mb-1">Add your first client</div>
            <div class="text-xs text-gray-600">Add client details to start creating invoices</div>
          </div>
          <a 
            href="/app/clients/new"
            class="text-xs hover:text-black transition-colors text-gray-600"
          >
            Add client →
          </a>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 border border-thin rounded-sm"></div>
          <div class="flex-1">
            <div class="text-xs text-gray-600 mb-1">Create your first invoice</div>
            <div class="text-xs text-gray-600">Choose a template and create an invoice</div>
          </div>
          <span class="text-xs text-gray-400">
            Add client first
          </span>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="w-4 h-4 border border-thin rounded-sm"></div>
          <div class="flex-1">
            <div class="text-xs text-gray-600 mb-1">Send your first invoice</div>
            <div class="text-xs text-gray-600">Email your invoice with one click</div>
          </div>
          <span class="text-xs text-gray-400">
            Create invoice first  
          </span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Recent activity placeholder -->
  <div class="space-y-4">
    <h2 class="text-xs">Recent activity</h2>
    <div class="border border-thin rounded-sm p-8 text-center">
      <p class="text-xs text-gray-600 mb-1">No recent activity</p>
      <p class="text-xs text-gray-600">Your invoice activity will appear here</p>
    </div>
  </div>
</div>