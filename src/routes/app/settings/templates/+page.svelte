<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let isCreating = $state(false);
  let newFieldLabel = $state('');
  let showCreateForm = $state(false);
</script>

<svelte:head>
  <title>Template Settings - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-8">
  <!-- Header -->
  <div>
    <div class="flex items-center gap-3 mb-2">
      <a href="/app/settings" class="text-xs text-gray-600 hover:text-black">
        ← Back to Settings
      </a>
    </div>
    <h1 class="text-base font-medium mb-1">Template Settings</h1>
    <p class="text-xs text-gray-500">
      Manage custom fields for your invoice templates
    </p>
  </div>

  <!-- Custom Fields Section -->
  <div class="space-y-5">
    <div class="flex items-center justify-between pb-2 border-b border-gray-200">
      <h2 class="text-sm font-medium">Custom Fields</h2>
      <button
        type="button"
        onclick={() => showCreateForm = !showCreateForm}
        class="px-3 py-1 text-xs bg-black text-white hover:bg-gray-800 transition-colors"
      >
        {showCreateForm ? 'Cancel' : '+ New Custom Field'}
      </button>
    </div>

    <!-- Create Form -->
    {#if showCreateForm}
      <div class="border border-gray-300 rounded-sm p-4 bg-gray-50">
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            isCreating = true;
            return async ({ update, result }) => {
              await update();
              isCreating = false;
              if (result.type === 'success') {
                newFieldLabel = '';
                showCreateForm = false;
              }
            };
          }}
          class="space-y-3"
        >
          <div>
            <label for="field_label" class="block text-xs text-gray-500 mb-1.5">
              Field Label
            </label>
            <input
              id="field_label"
              name="field_label"
              type="text"
              bind:value={newFieldLabel}
              placeholder="e.g., Project Code, PO Number, Reference"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 focus:outline-none focus:border-black"
              required
              autofocus
            />
            <p class="text-xs text-gray-400 mt-1">
              This will create a custom field that can be used across all your templates
            </p>
          </div>

          <div class="flex gap-2">
            <button
              type="submit"
              disabled={isCreating || !newFieldLabel.trim()}
              class="px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Custom Field'}
            </button>
            <button
              type="button"
              onclick={() => { showCreateForm = false; newFieldLabel = ''; }}
              class="px-4 py-1.5 border border-gray-300 text-xs hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    {/if}

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="border border-green-300 bg-green-50 text-green-700 px-4 py-2 text-xs rounded-sm">
        {form.message}
      </div>
    {/if}

    {#if form?.error}
      <div class="border border-red-300 bg-red-50 text-red-700 px-4 py-2 text-xs rounded-sm">
        {form.error}
      </div>
    {/if}

    <!-- Custom Fields List -->
    {#if data.customFields.length === 0}
      <div class="border border-dashed border-gray-300 rounded-sm p-8 text-center">
        <p class="text-xs text-gray-500">
          No custom fields yet. Create one to get started.
        </p>
      </div>
    {:else}
      <div class="border border-gray-200 rounded-sm divide-y divide-gray-200">
        {#each data.customFields as field}
          <div class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div>
              <div class="text-xs font-medium font-mono">{field.field_label}</div>
              <div class="text-xs text-gray-500 mt-0.5">
                Field name: <code class="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{field.field_name}</code>
              </div>
            </div>

            <form
              method="POST"
              action="?/delete"
              use:enhance={() => {
                return async ({ update }) => {
                  if (confirm(`Delete custom field "${field.field_label}"? This will remove it from all templates using it.`)) {
                    await update();
                  }
                };
              }}
            >
              <input type="hidden" name="field_id" value={field.id} />
              <button
                type="submit"
                class="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded-sm transition-colors"
              >
                Delete
              </button>
            </form>
          </div>
        {/each}
      </div>

      <div class="text-xs text-gray-500 p-4 bg-blue-50 border border-blue-200 rounded-sm">
        <strong>Note:</strong> Custom fields are available across all templates in your organization.
        When you map a custom field in a template, it will be saved and available for reuse.
      </div>
    {/if}
  </div>
</div>
