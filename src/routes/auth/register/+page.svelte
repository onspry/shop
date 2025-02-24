<script lang="ts">
	import { enhance } from '$app/forms';

	interface ActionData {
		username?: string;
		email?: string;
		message?: string;
	}

	export let form: ActionData;
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<h2 class="mt-10 text-center text-2xl leading-9 font-bold tracking-tight">Create an account</h2>
		<p class="mt-2 text-center text-sm text-gray-400">
			Username must be 4-31 characters and password must be at least 8 characters.
		</p>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<form method="post" use:enhance class="space-y-6">
			<div>
				<label for="form-signup.username" class="block text-sm font-medium">Username</label>
				<div class="mt-2">
					<input
						id="form-signup.username"
						name="username"
						required
						value={form?.username ?? ''}
						minlength="4"
						maxlength="31"
						class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<label for="form-signup.email" class="block text-sm font-medium">Email</label>
				<div class="mt-2">
					<input
						type="email"
						id="form-signup.email"
						name="email"
						autocomplete="email"
						required
						value={form?.email ?? ''}
						class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<label for="form-signup.password" class="block text-sm font-medium">Password</label>
				<div class="mt-2">
					<input
						type="password"
						id="form-signup.password"
						name="password"
						autocomplete="new-password"
						required
						class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
				>
					Create Account
				</button>
			</div>

			{#if form?.message}
				<p class="text-center text-sm text-red-400">{form.message}</p>
			{/if}
		</form>

		<p class="mt-10 text-center text-sm text-gray-400">
			Already have an account?
			<a href="/auth/login" class="font-semibold text-yellow-500 hover:text-yellow-400">Sign in</a>
		</p>
	</div>
</div>
