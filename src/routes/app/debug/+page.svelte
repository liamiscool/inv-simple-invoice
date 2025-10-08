<script lang="ts">
  import type { PageData } from './$types';
  import { onMount } from 'svelte';

  let { data }: { data: PageData } = $props();

  let subscriptionInfo = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) return;

      // Get user's org
      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) return;

      // Get subscription
      const { data: sub } = await data.supabase
        .from('plan_subscription')
        .select('*')
        .eq('org_id', profile.org_id)
        .single();

      // Get client counter
      const { data: counter } = await data.supabase
        .from('client_counter')
        .select('*')
        .eq('org_id', profile.org_id)
        .single();

      // Get actual client count
      const { count } = await data.supabase
        .from('client')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id);

      subscriptionInfo = {
        org_id: profile.org_id,
        subscription: sub,
        counter: counter,
        actualClientCount: count
      };
    } catch (err) {
      console.error(err);
      subscriptionInfo = { error: err };
    } finally {
      loading = false;
    }
  });
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-2xl mb-6">Debug: Subscription Info</h1>

  {#if loading}
    <p>Loading...</p>
  {:else if subscriptionInfo}
    <pre class="bg-gray-100 p-4 rounded text-xs overflow-auto">{JSON.stringify(subscriptionInfo, null, 2)}</pre>
  {/if}

  <div class="mt-6">
    <a href="/app/clients" class="text-sm underline">← Back to clients</a>
  </div>
</div>
