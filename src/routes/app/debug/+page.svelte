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
        .single() as { data: any };

      if (!profile) return;

      // Get subscription
      const { data: sub } = await data.supabase
        .from('plan_subscription')
        .select('*')
        .eq('org_id', profile.org_id)
        .maybeSingle();

      // Get client counter
      const { data: counter } = await data.supabase
        .from('client_counter')
        .select('*')
        .eq('org_id', profile.org_id)
        .maybeSingle();

      // Get actual client count
      const { count } = await data.supabase
        .from('client')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id)
        .is('deleted_at', null);

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

<div class="max-w-6xl space-y-6">
  <div>
    <h1 class="text-base font-medium mb-1">Debug: Subscription Info</h1>
    <p class="text-xs text-gray-500">Development debugging information</p>
  </div>

  {#if loading}
    <p class="text-xs text-gray-500">Loading...</p>
  {:else if subscriptionInfo}
    <pre class="bg-gray-50 p-4 text-xs overflow-auto border border-gray-200">{JSON.stringify(subscriptionInfo, null, 2)}</pre>
  {/if}

  <div>
    <a href="/app/clients" class="text-xs text-gray-500 hover:text-black transition-colors">← Back to clients</a>
  </div>
</div>
