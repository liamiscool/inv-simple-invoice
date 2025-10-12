<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import * as pdfjsLib from 'pdfjs-dist';

  // ============================================================================
  // IMPORTANT NOTE: CLIENT-SIDE PDF CONVERSION
  // ============================================================================
  // PDFs are converted to PNG in the BROWSER (not server) to avoid native deps
  // This ensures deployment works on Cloudflare Pages (serverless environment)
  //
  // Future improvements:
  // - Move conversion to Web Worker for better performance
  // - Add progress indicator for large PDFs
  // - Consider external service (CloudConvert, etc.) for production
  // ============================================================================

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  let { data, form }: { data: PageData, form: ActionData } = $props();

  let uploading = $state(false);
  let selectedFile: File | null = $state(null);
  let previewUrl: string | null = $state(null);
  let templateName = $state('');
  let error = $state('');
  let isDragging = $state(false);
  let converting = $state(false);

  async function convertPdfToPng(file: File): Promise<File> {
    converting = true;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1); // First page only

      // Render at 300 DPI (scale ~4.17 from 72 DPI)
      const viewport = page.getViewport({ scale: 300 / 72 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d')!;
      await page.render({ canvasContext: context, viewport }).promise;

      // Convert canvas to Blob then File
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      );

      return new File([blob], file.name.replace('.pdf', '.png'), { type: 'image/png' });
    } finally {
      converting = false;
    }
  }

  async function processFile(file: File) {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      error = 'Invalid file type. Please upload PNG, JPEG, or PDF.';
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

    // Generate preview for PDFs (will be processed server-side for text extraction)
    if (file.type === 'application/pdf') {
      try {
        // Convert to PNG just for preview (original PDF will be used for text extraction)
        const previewFile = await convertPdfToPng(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          previewUrl = e.target?.result as string;
        };
        reader.readAsDataURL(previewFile);

        // Keep original PDF for upload
        selectedFile = file;
        error = '';
        return;
      } catch (err) {
        console.error('PDF preview error:', err);
        error = 'Failed to generate PDF preview.';
        selectedFile = null;
        return;
      }
    }

    error = '';
    selectedFile = file;

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      previewUrl = null; // PDF preview requires PDF.js, skip for now
    }

    // Auto-fill template name from filename (remove extension)
    if (!templateName) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      console.log('🔍 Auto-naming debug:', {
        filename: file.name,
        nameWithoutExt,
        currentTemplateName: templateName,
        templateCount: data.templateCount
      });

      // If filename is too generic or empty, use Template #X format
      if (!nameWithoutExt || nameWithoutExt.toLowerCase() === 'untitled' || nameWithoutExt.toLowerCase() === 'invoice') {
        templateName = `Template #${data.templateCount + 1}`;
        console.log('✅ Set numbered name:', templateName);
      } else {
        templateName = nameWithoutExt;
        console.log('✅ Set filename as name:', templateName);
      }
    } else {
      console.log('⚠️ Template name already set, skipping auto-name:', templateName);
    }
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) processFile(file);
  }

  function handleDragEnter(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const file = event.dataTransfer?.files[0];
    if (file) {
      processFile(file);
      // Try to update the hidden file input - this might not work with all browsers
      try {
        const input = document.getElementById('file') as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        console.log('File added to input:', input.files.length, input.files[0]?.name);
      } catch (e) {
        console.error('Failed to add file to input:', e);
      }
    }
  }

  function clearFile() {
    selectedFile = null;
    previewUrl = null;
    error = '';
    // Clear the file input
    const input = document.getElementById('file') as HTMLInputElement;
    if (input) input.value = '';
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
      Upload your invoice design (PDF, PNG, or JPEG). PDFs are automatically converted to PNG in your browser.
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
    use:enhance={({ formData }) => {
      uploading = true;
      console.log('=== FORM SUBMIT START ===');
      console.log('Template name from form:', formData.get('name'));
      console.log('File from form:', formData.get('file'));

      // Manually add the file if it's missing
      if (!formData.get('file') && selectedFile) {
        console.log('Adding selectedFile manually:', selectedFile.name);
        formData.set('file', selectedFile);
      }

      console.log('Final file in FormData:', formData.get('file'));
      console.log('=========================');

      return async ({ result, update }) => {
        uploading = false;
        console.log('Form result:', result);
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
        <div
          ondragenter={handleDragEnter}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          class="border-2 border-dashed rounded-sm p-8 text-center transition-colors {isDragging ? 'border-black bg-gray-50' : 'border-gray-300'}"
        >
          <input
            id="file"
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            required
            onchange={handleFileSelect}
            class="hidden"
          />
          <label
            for="file"
            class="cursor-pointer inline-flex flex-col items-center gap-3"
          >
            <svg class="w-12 h-12 {isDragging ? 'text-black' : 'text-gray-400'} transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div class="space-y-1">
              <div class="text-xs font-medium">{isDragging ? 'Drop file here' : 'Click to upload or drag & drop'}</div>
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

      {#if form?.error}
        <div class="text-xs text-red-600 bg-red-50 border border-red-200 rounded-sm p-3">
          <strong>Upload failed:</strong> {form.error}
        </div>
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
        disabled={converting || uploading || !selectedFile || !templateName}
        class="px-6 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {converting ? 'Converting PDF...' : uploading ? 'Uploading...' : 'Continue to Mapping'}
      </button>
    </div>
  </form>
</div>
