<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';

	export let form: ActionData;
</script>

<div class="container py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">Account Settings</h1>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Change Password</CardTitle>
				<CardDescription>Update your account password</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="post" action="?/password" use:enhance class="space-y-4">
					<div class="grid gap-2">
						<Label for="password">Current Password</Label>
						<Input id="password" name="password" type="password" required />
					</div>

					<div class="grid gap-2">
						<Label for="new_password">New Password</Label>
						<Input id="new_password" name="new_password" type="password" required />
					</div>

					{#if form?.password?.message}
						<p class="text-sm text-destructive">{form.password.message}</p>
					{/if}

					<Button type="submit" variant="default" class="w-full">Update Password</Button>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Change Email</CardTitle>
				<CardDescription>Update your email address</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="post" action="?/email" use:enhance class="space-y-4">
					<div class="grid gap-2">
						<Label for="email">New Email</Label>
						<Input id="email" name="email" type="email" required />
					</div>

					{#if form?.email?.message}
						<p class="text-sm text-destructive">{form.email.message}</p>
					{/if}

					<Button type="submit" variant="default" class="w-full">Update Email</Button>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
