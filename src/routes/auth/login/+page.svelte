<script lang="ts">
  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let useMagicLink = $state(false);
  let showResetPassword = $state(false);

  // Check for email verification success
  onMount(() => {
    if ($page.url.searchParams.get('email_verified') === 'true') {
      message = 'Email verified successfully! Please log in with your new email address.';
      // Clean up the URL
      window.history.replaceState({}, '', '/auth/login');
    }
  });

  async function handlePasswordLogin(e: Event) {
    e.preventDefault();
    isLoading = true;
    message = '';

    try {
      const { error } = await data.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        message = error.message;
      } else {
        window.location.href = '/app/invoices';
      }
    } catch (err) {
      message = 'An error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handleMagicLink(e: Event) {
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

  async function handleResetPassword(e: Event) {
    e.preventDefault();
    isLoading = true;
    message = '';

    try {
      const { error } = await data.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${data.url.origin}/auth/reset-password`
      });

      if (error) {
        message = error.message;
      } else {
        message = 'Check your email for the password reset link!';
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

  <div class="flex-1 flex items-center justify-center">
    <div class="w-full max-w-sm space-y-8">
      <!-- Header -->
      <div class="text-center space-y-3">
        <h1 class="text-2xl font-medium dark:text-white">Sign in</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Beautiful invoices for designers</p>
      </div>
    
    <!-- Form -->
    {#if showResetPassword}
      <!-- Reset Password -->
      <form onsubmit={handleResetPassword} class="space-y-6">
        <div>
          <label for="email-reset" class="sr-only">Email</label>
          <input
            id="email-reset"
            type="email"
            bind:value={email}
            placeholder="Enter your email"
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
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>

        <div class="text-center">
          <button
            type="button"
            onclick={() => showResetPassword = false}
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </form>
    {:else if !useMagicLink}
      <!-- Password Login (Default) -->
      <form onsubmit={handlePasswordLogin} class="space-y-6">
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
            placeholder="Enter your password"
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
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div class="flex items-center justify-between text-sm">
          <button
            type="button"
            onclick={() => showResetPassword = true}
            class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Forgot password?
          </button>
          <a href="/auth/signup" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            Sign up
          </a>
        </div>

        <div class="text-center pt-2">
          <button
            type="button"
            onclick={() => useMagicLink = true}
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Use magic link instead
          </button>
        </div>
      </form>
    {:else}
      <!-- Magic Link Login -->
      <form onsubmit={handleMagicLink} class="space-y-6">
        <div>
          <label for="email-magic" class="sr-only">Email</label>
          <input
            id="email-magic"
            type="email"
            bind:value={email}
            placeholder="Enter your email"
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
          {isLoading ? 'Sending...' : 'Send magic link'}
        </button>

        <div class="text-center">
          <button
            type="button"
            onclick={() => useMagicLink = false}
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            ← Back to password login
          </button>
        </div>
      </form>
    {/if}

    <!-- Message -->
    {#if message}
      <div class="text-center">
        <p class="text-sm {message.includes('Check your email') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
          {message}
        </p>
      </div>
    {/if}
    </div>
  </div>
</div>