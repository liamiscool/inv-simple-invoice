// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>
			safeGetSession(): Promise<{ session: Session | null; user: User | null }>
		}
		interface PageData {
			session: Session | null
		}
		// interface Error {}
		// interface PageState {}
		interface Platform {
			env?: {
				PUBLIC_SUPABASE_URL?: string;
				PUBLIC_SUPABASE_ANON_KEY?: string;
				PUBLIC_SITE_URL?: string;
				SUPABASE_SERVICE_ROLE_KEY?: string;
				RESEND_API_KEY?: string;
			};
		}
	}
}

export {};
