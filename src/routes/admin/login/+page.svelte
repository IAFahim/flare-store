<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { enhance } from '$app/forms';

	let { form } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Admin sign in — Flare Store</title></svelte:head>

<main class="flex min-h-svh items-center justify-center bg-stone-100/60 px-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="font-display text-2xl">Admin</Card.Title>
			<Card.Description>Sign in to manage the store</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				{#if form?.error}
					<p class="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{form.error}
					</p>
				{/if}
				<div class="space-y-1.5">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" required autocomplete="username" />
				</div>
				<div class="space-y-1.5">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
					/>
				</div>
				<Button type="submit" class="w-full" disabled={submitting}>
					{submitting ? 'Signing in…' : 'Sign in'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</main>
