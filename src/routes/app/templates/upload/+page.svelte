<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let uploading = $state(false);
  let selectedFile: File | null = $state(null);
  let previewUrl: string | null = $state(null);
  let templateName = $state('');
  let error = $state('');

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      error = 'Invalid file type. Please upload PNG, JPEG, SVG, or PDF.';
      selectedFile = null;
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      error = 'File too large. Maximum size is 10MB.';
      selectedFile = null;
      return;
    }

    error = '';
    selectedFile = file;

    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      previewUrl = null; // PDF preview requires PDF.js, skip for now
    }

    // Auto-fill template name from filename
    if (!templateName) {
      templateName = file.name.replace(/\.[^/.]+$/, '');
    }
  }

  function clearFile() {
    selectedFile = null;
    previewUrl = null;
    error = '';
  }
</script>

<svelte:head>
  <title>Upload Custom Template - inv</title>
</svelte:head>

<div class="max-w-3xl space-y-6">
  <!-- Header -->
  <div>
    <div class="flex items-center gap-3 mb-2">
      <a href="/app/templates" class="text-xs text-gray-600 hover:text-black transition-colors">
        ← Back to Templates
      </a>
    </div>
    <h1 class="text-sm mb-2">Upload Custom Template</h1>
    <p class="text-xs text-gray-600">
      Upload your own invoice design (PDF, PNG, JPEG, SVG) and map dynamic areas
    </p>
  </div>

  <!-- Instructions -->
  <div class="border border-thin rounded-sm p-6 bg-gray-50 space-y-3">
    <h2 class="text-xs font-medium">How it works</h2>
    <ol class="text-xs text-gray-600 space-y-2 list-decimal list-inside">
      <li>Upload your invoice design file (designed in Figma, Illustrator, etc.)</li>
      <li>Map the dynamic areas (client name, invoice number, line items, totals)</li>
      <li>Configure fonts, colors, and positioning for each area</li>
      <li>Save and use your custom template for all future invoices</li>
    </ol>
  </div>

  <!-- Upload Form -->
  <form
    method="POST"
    action="?/upload"
    enctype="multipart/form-data"
    use:enhance={() => {
      uploading = true;
      return async ({ result, update }) => {
        uploading = false;
        await update();
      };
    }}
    class="border border-thin rounded-sm p-6 space-y-6"
  >
    <!-- Template Name -->
    <div class="space-y-2">
      <label for="name" class="block text-xs font-medium">
        Template Name *
      </label>
      <input
        id="name"
        name="name"
        type="text"
        required
        bind:value={templateName}
        placeholder="e.g. My Agency Invoice"
        class="w-full px-3 py-2 border border-thin rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-black"
      />
    </div>

    <!-- File Upload -->
    <div class="space-y-2">
      <label for="file" class="block text-xs font-medium">
        Design File *
      </label>

      {#if !selectedFile}
        <div class="border-2 border-dashed border-gray-300 rounded-sm p-8 text-center">
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.svg"
            required
            onchange={handleFileSelect}
            class="hidden"
          />
          <label
            for="file"
            class="cursor-pointer inline-flex flex-col items-center gap-3"
          >
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div class="space-y-1">
              <div class="text-xs font-medium">Click to upload</div>
              <div class="text-xs text-gray-500">PDF, PNG, JPEG, or SVG (max 10MB)</div>
            </div>
          </label>
        </div>
      {:else}
        <div class="border border-thin rounded-sm p-4 space-y-4">
          <!-- File info -->
          <div class="flex items-start justify-between">
            <div class="space-y-1">
              <div class="text-xs font-medium">{selectedFile.name}</div>
              <div class="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
              </div>
            </div>
            <button
              type="button"
              onclick={clearFile}
              class="text-xs text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </div>

          <!-- Preview -->
          {#if previewUrl}
            <div class="border border-thin rounded-sm p-2 bg-gray-50 overflow-hidden">
              <img
                src={previewUrl}
                alt="Preview"
                class="max-w-full h-auto max-h-96 mx-auto object-contain"
              />
            </div>
          {/if}
        </div>
      {/if}

      {#if error}
        <div class="text-xs text-red-600">{error}</div>
      {/if}
    </div>

    <!-- File Requirements -->
    <div class="bg-blue-50 border border-blue-200 rounded-sm p-4 space-y-2">
      <div class="text-xs font-medium text-blue-900">File Requirements</div>
      <ul class="text-xs text-blue-700 space-y-1 list-disc list-inside">
        <li>Maximum file size: 10MB</li>
        <li>Supported formats: PDF, PNG, JPEG, SVG</li>
        <li>Recommended: High-resolution PNG or PDF for best quality</li>
        <li>A4 size (210×297mm) or Letter size recommended</li>
      </ul>
    </div>

    <!-- Submit -->
    <div class="flex items-center justify-between pt-4 border-t border-thin">
      <a
        href="/app/templates"
        class="text-xs text-gray-600 hover:text-black transition-colors"
      >
        Cancel
      </a>

      <button
        type="submit"
        disabled={uploading || !selectedFile || !templateName}
        class="px-6 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Continue to Mapping'}
      </button>
    </div>
  </form>
</div>
