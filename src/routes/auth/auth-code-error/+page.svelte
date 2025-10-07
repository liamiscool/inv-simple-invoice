<svelte:head>
  <title>Authentication Error - inv</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center px-4">
  <div class="w-full max-w-sm space-y-6 text-center">
    <div class="space-y-2">
      <h1 class="text-lg">Authentication Error</h1>
      <p class="text-xs text-gray-600">
        There was an issue signing you in. Please try again.
      </p>
    </div>
    
    <div class="space-y-3">
      <a 
        href="/auth/login"
        class="block w-full py-2 px-4 border border-black text-sm hover:bg-black hover:text-white transition-colors duration-75"
      >
        Try again
      </a>
      
      <a 
        href="/"
        class="block text-xs text-gray-600 hover:text-black transition-colors"
      >
        ← Back to home
      </a>
    </div>
  </div>
</div>