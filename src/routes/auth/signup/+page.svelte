<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let message = $state('');

  async function handleSignup(e: Event) {
    e.preventDefault();
    isLoading = true;
    message = '';

    try {
      const { error } = await data.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${data.url.origin}/auth/callback`
        }
      });

      if (error) {
        message = error.message;
      } else {
        message = 'Account created! Redirecting...';
        setTimeout(() => {
          window.location.href = '/app/invoices';
        }, 1000);
      }
    } catch (err) {
      message = 'An error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign up - inv</title>
</svelte:head>

<div class="min-h-screen bg-white dark:bg-dark-bg flex flex-col">
  <!-- Back to home - top left -->
  <div class="px-4 py-3 mb-8">
    <a
      href="/"
      class="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-2"
    >
      <span class="text-base">←</span> Back
    </a>
  </div>

  <div class="flex-1 flex items-start md:items-center justify-center pt-8 md:pt-16">
    <div class="w-full max-w-sm space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h1 class="text-2xl font-medium dark:text-white">Sign up</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Beautiful invoices for designers</p>
      </div>

    <!-- Form -->
    <form onsubmit={handleSignup} class="space-y-6">
      <div>
        <label for="email" class="sr-only">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="Enter your email"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 dark:bg-dark-input dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label for="password" class="sr-only">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="Create a password (min 6 characters)"
          minlength="6"
          class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-700 dark:bg-dark-input dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>

      <div class="text-center text-sm">
        <span class="text-gray-600 dark:text-gray-400">Already have an account?</span>
        {' '}
        <a href="/auth/login" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">Sign in</a>
      </div>
    </form>

    <!-- Message -->
    {#if message}
      <div class="text-center">
        <p class="text-sm {message.includes('created') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
          {message}
        </p>
      </div>
    {/if}
    </div>
  </div>
</div>
