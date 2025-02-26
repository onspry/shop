<script lang="ts">
	import { enhance } from '$app/forms';

	interface ActionData {
		username?: string;
		email?: string;
		message?: string;
	}

	export let form: ActionData;
</script>

<div>
	<div>
		<h2>Create an account</h2>
		<p>Username must be 4-31 characters and password must be at least 8 characters.</p>
	</div>

	<div>
		<form method="post" use:enhance>
			<div>
				<label for="form-signup.username">Username</label>
				<div>
					<input
						id="form-signup.username"
						name="username"
						required
						value={form?.username ?? ''}
						minlength="4"
						maxlength="31"
					/>
				</div>
			</div>

			<div>
				<label for="form-signup.email">Email</label>
				<div>
					<input
						type="email"
						id="form-signup.email"
						name="email"
						autocomplete="email"
						required
						value={form?.email ?? ''}
					/>
				</div>
			</div>

			<div>
				<label for="form-signup.password">Password</label>
				<div>
					<input
						type="password"
						id="form-signup.password"
						name="password"
						autocomplete="new-password"
						required
					/>
				</div>
			</div>

			<div>
				<button type="submit">Create Account</button>
			</div>

			{#if form?.message}
				<p>{form.message}</p>
			{/if}
		</form>

		<p>
			Already have an account?
			<a href="/auth/login">Sign in</a>
		</p>
	</div>
</div>
