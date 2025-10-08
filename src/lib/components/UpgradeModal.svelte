<script lang="ts">
  import { browser } from '$app/environment';

  interface Props {
    show: boolean;
    reason?: 'client_limit' | 'template_upload' | 'general';
    onClose: () => void;
    monthlyLink: string;
    yearlyLink: string;
  }

  let { show = $bindable(), reason = 'general', onClose, monthlyLink, yearlyLink }: Props = $props();

  const reasons = {
    client_limit: {
      title: 'Client Limit Reached',
      message: 'You\'ve reached the limit of 3 clients on the free plan. Upgrade to Pro for unlimited clients.'
    },
    template_upload: {
      title: 'Pro Feature',
      message: 'Custom template uploads are available on the Pro plan. Upgrade to create your own invoice designs.'
    },
    general: {
      title: 'Upgrade to Pro',
      message: 'Unlock unlimited clients, custom templates, and more with inv Pro.'
    }
  };

  const currentReason = $derived(reasons[reason]);

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function handleUpgrade(link: string) {
    if (browser) {
      window.location.href = link;
    }
  }
</script>

{#if show}
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <div class="bg-white rounded-sm max-w-lg w-full p-8 border border-thin">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-light mb-2">{currentReason.title}</h2>
        <p class="text-sm text-gray-600">{currentReason.message}</p>
      </div>

      <!-- Plans -->
      <div class="space-y-3 mb-6">
        <!-- Monthly Plan -->
        <button
          onclick={() => handleUpgrade(monthlyLink)}
          class="w-full text-left p-4 border border-thin rounded-sm hover:border-black transition-colors group"
        >
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="text-lg font-medium">Monthly</div>
              <div class="text-xs text-gray-600">Pay monthly, cancel anytime</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-light">$10</div>
              <div class="text-xs text-gray-600">/month</div>
            </div>
          </div>
          <div class="text-xs text-gray-500 group-hover:text-black transition-colors">
            Choose Monthly →
          </div>
        </button>

        <!-- Yearly Plan -->
        <button
          onclick={() => handleUpgrade(yearlyLink)}
          class="w-full text-left p-4 border-2 border-black rounded-sm hover:bg-black hover:text-white transition-all group relative"
        >
          <div class="absolute -top-2 right-4 bg-black text-white text-xs px-2 py-0.5 rounded-sm group-hover:bg-white group-hover:text-black">
            Save 20%
          </div>
          <div class="flex justify-between items-start mb-2">
            <div>
              <div class="text-lg font-medium">Yearly</div>
              <div class="text-xs opacity-60">Best value - 2 months free</div>
            </div>
            <div class="text-right">
              <div class="text-2xl font-light">$96</div>
              <div class="text-xs opacity-60">/year</div>
            </div>
          </div>
          <div class="text-xs opacity-60 group-hover:opacity-100">
            Choose Yearly →
          </div>
        </button>
      </div>

      <!-- Features -->
      <div class="mb-6 pb-6 border-b border-thin">
        <div class="text-xs font-medium mb-3 text-gray-600">What's included:</div>
        <ul class="space-y-2 text-xs text-gray-700">
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span>Unlimited clients</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span>Unlimited invoices</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span>Custom invoice template uploads</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2">✓</span>
            <span>Priority support</span>
          </li>
        </ul>
      </div>

      <!-- Cancel -->
      <button
        onclick={onClose}
        class="w-full text-sm text-gray-600 hover:text-black transition-colors"
      >
        Maybe later
      </button>
    </div>
  </div>
{/if}
