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
	import * as m from '$lib/paraglide/messages';

	export let form: ActionData;
</script>

<div class="container py-8">
	<div class="mb-6">
		<h1>{m.account_settings()}</h1>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>{m.settings_change_password_title()}</CardTitle>
				<CardDescription>{m.settings_change_password_description()}</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="post" action="?/password" use:enhance class="space-y-4">
					<div class="grid gap-2">
						<Label for="password">{m.settings_current_password_label()}</Label>
						<Input id="password" name="password" type="password" required />
					</div>

					<div class="grid gap-2">
						<Label for="new_password">{m.settings_new_password_label()}</Label>
						<Input id="new_password" name="new_password" type="password" required />
					</div>

					{#if form?.password?.message}
						<p class="text-sm text-destructive">{form.password.message}</p>
					{/if}

					<Button type="submit" variant="default" class="w-full"
						>{m.settings_update_password_button()}</Button
					>
				</form>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>{m.settings_change_email_title()}</CardTitle>
				<CardDescription>{m.settings_change_email_description()}</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="post" action="?/email" use:enhance class="space-y-4">
					<div class="grid gap-2">
						<Label for="email">{m.settings_new_email_label()}</Label>
						<Input id="email" name="email" type="email" required />
					</div>

					{#if form?.email?.message}
						<p class="text-sm text-destructive">{form.email.message}</p>
					{/if}

					<Button type="submit" variant="default" class="w-full"
						>{m.settings_update_email_button()}</Button
					>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
