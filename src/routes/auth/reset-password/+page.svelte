<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let password = $state('');
  let confirmPassword = $state('');
  let isLoading = $state(false);
  let message = $state('');
  let success = $state(false);

  async function handleResetPassword(e: Event) {
    e.preventDefault();

    if (password !== confirmPassword) {
      message = 'Passwords do not match';
      return;
    }

    if (password.length < 6) {
      message = 'Password must be at least 6 characters';
      return;
    }

    isLoading = true;
    message = '';

    try {
      const { error } = await data.supabase.auth.updateUser({
        password: password
      });

      if (error) {
        message = error.message;
      } else {
        success = true;
        message = 'Password updated successfully! Redirecting...';
        setTimeout(() => {
          window.location.href = '/app';
        }, 2000);
      }
    } catch (err) {
      message = 'An error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password - inv</title>
</svelte:head>

<div class="min-h-screen flex flex-col px-4 pt-4">
  <!-- Back to home - top left -->
  <div class="mb-8">
    <a
      href="/"
      class="text-xs text-gray-600 hover:text-black transition-colors inline-flex items-center gap-1"
    >
      ← inv
    </a>
  </div>

  <div class="flex-1 flex items-center justify-center">
    <div class="w-full max-w-sm space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-lg">Reset your password</h1>
        <p class="text-xs text-gray-600">Enter your new password below</p>
      </div>

      <!-- Form -->
      {#if !success}
        <form onsubmit={handleResetPassword} class="space-y-4">
          <div>
            <label for="password" class="sr-only">New Password</label>
            <input
              id="password"
              type="password"
              bind:value={password}
              placeholder="Enter new password (min 6 characters)"
              minlength="6"
              class="w-full px-3 py-2 text-sm border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label for="confirm-password" class="sr-only">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              bind:value={confirmPassword}
              placeholder="Confirm new password"
              minlength="6"
              class="w-full px-3 py-2 text-sm border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            class="w-full py-2 px-4 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      {/if}

      <!-- Message -->
      {#if message}
        <div class="text-center">
          <p class="text-xs {success ? 'text-green-600' : 'text-red-600'}">
            {message}
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
