<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex min-h-full flex-col justify-center px-6 py-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<h2 class="text-center text-2xl leading-9 font-bold tracking-tight">Account Settings</h2>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<div class="space-y-10">
			<!-- Password Update Form -->
			<form method="post" action="?/password" use:enhance class="space-y-6">
				<h3 class="text-lg font-medium">Change Password</h3>
				<div>
					<label for="password" class="block text-sm font-medium">Current Password</label>
					<div class="mt-2">
						<input
							id="password"
							name="password"
							type="password"
							required
							class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				<div>
					<label for="new_password" class="block text-sm font-medium">New Password</label>
					<div class="mt-2">
						<input
							id="new_password"
							name="new_password"
							type="password"
							required
							class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				<button
					type="submit"
					class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
				>
					Update Password
				</button>

				{#if form?.password?.message}
					<p class="text-center text-sm text-red-400">{form.password.message}</p>
				{/if}
			</form>

			<!-- Email Update Form -->
			<form method="post" action="?/email" use:enhance class="space-y-6">
				<h3 class="text-lg font-medium">Change Email</h3>
				<div>
					<label for="email" class="block text-sm font-medium">New Email</label>
					<div class="mt-2">
						<input
							id="email"
							name="email"
							type="email"
							required
							class="block w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500 focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				<button
					type="submit"
					class="used-look group relative flex w-full justify-center rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors duration-200 hover:bg-[var(--color-accent-hover)]"
				>
					Update Email
				</button>

				{#if form?.email?.message}
					<p class="text-center text-sm text-red-400">{form.email.message}</p>
				{/if}
			</form>
		</div>
	</div>
</div>
