<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div>
	<div>
		<h2>Account Settings</h2>
	</div>

	<div>
		<div>
			<form method="post" action="?/password" use:enhance>
				<h3>Change Password</h3>
				<div>
					<label for="password">Current Password</label>
					<div>
						<input id="password" name="password" type="password" required />
					</div>
				</div>

				<div>
					<label for="new_password">New Password</label>
					<div>
						<input id="new_password" name="new_password" type="password" required />
					</div>
				</div>

				<button type="submit">Update Password</button>

				{#if form?.password?.message}
					<p>{form.password.message}</p>
				{/if}
			</form>

			<form method="post" action="?/email" use:enhance>
				<h3>Change Email</h3>
				<div>
					<label for="email">New Email</label>
					<div>
						<input id="email" name="email" type="email" required />
					</div>
				</div>

				<button type="submit">Update Email</button>

				{#if form?.email?.message}
					<p>{form.email.message}</p>
				{/if}
			</form>
		</div>
	</div>
</div>
