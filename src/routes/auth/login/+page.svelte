<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let email = $state('');
  let isLoading = $state(false);
  let message = $state('');
  
  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    message = '';
    
    try {
      const { error } = await data.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${data.url.origin}/auth/callback`
        }
      });
      
      if (error) {
        message = error.message;
      } else {
        message = 'Check your email for the magic link!';
      }
    } catch (err) {
      message = 'An error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in - inv</title>
</svelte:head>

<div class="min-h-screen flex flex-col items-center justify-center px-4">
  <div class="w-full max-w-sm space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h1 class="text-lg">inv</h1>
      <p class="text-xs text-gray-600">Beautiful invoices for designers</p>
    </div>
    
    <!-- Form -->
    <form onsubmit={handleLogin} class="space-y-4">
      <div>
        <label for="email" class="sr-only">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="Enter your email"
          class="w-full px-3 py-2 text-sm border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
          required
          disabled={isLoading}
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-2 px-4 border border-black text-sm hover:bg-black hover:text-white transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Send magic link'}
      </button>
    </form>
    
    <!-- Message -->
    {#if message}
      <div class="text-center">
        <p class="text-xs {message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}">
          {message}
        </p>
      </div>
    {/if}
    
    <!-- Footer -->
    <div class="text-center pt-4">
      <a 
        href="/" 
        class="text-xs text-gray-600 hover:text-black transition-colors"
      >
        ← Back to home
      </a>
    </div>
  </div>
</div>