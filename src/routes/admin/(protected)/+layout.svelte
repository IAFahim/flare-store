<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { LayoutDashboard, Package, ShoppingCart, LogOut, Store } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const nav = [
		{ href: resolve('/admin/(protected)'), label: 'Dashboard', icon: LayoutDashboard, exact: true },
		{ href: resolve('/admin/(protected)/orders'), label: 'Orders', icon: ShoppingCart },
		{ href: resolve('/admin/(protected)/products'), label: 'Products', icon: Package }
	];

	const isActive = (href: string, exact?: boolean) =>
		exact ? page.url.pathname === href : page.url.pathname.startsWith(href);
</script>

<div class="flex min-h-svh bg-stone-100/50">
	<aside class="flex w-14 shrink-0 flex-col border-r border-stone-200 bg-card sm:w-56">
		<div class="border-b border-stone-200 px-3 py-4 sm:px-5">
			<a href={resolve('/admin/(protected)')} class="font-display text-lg font-semibold">
				<span class="hidden sm:inline">Flare Admin</span>
				<span class="sm:hidden">F</span>
			</a>
		</div>
		<nav class="flex-1 space-y-1 p-2 sm:p-3">
			{#each nav as item (item.href)}
				<a
					href={item.href}
					title={item.label}
					class={cn(
						'flex items-center justify-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:justify-start sm:px-3',
						isActive(item.href, item.exact) && 'bg-secondary text-foreground'
					)}
				>
					<item.icon class="size-4 shrink-0" />
					<span class="hidden sm:inline">{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="space-y-1 border-t border-stone-200 p-2 sm:p-3">
			<Button
				variant="ghost"
				size="sm"
				href={resolve('/')}
				class="w-full justify-center gap-2 sm:justify-start"
				title="View store"
			>
				<Store class="size-4" /> <span class="hidden sm:inline">View store</span>
			</Button>
			<form method="POST" action="/admin/logout">
				<Button
					variant="ghost"
					size="sm"
					type="submit"
					title="Sign out"
					class="w-full justify-center gap-2 text-destructive hover:text-destructive sm:justify-start"
				>
					<LogOut class="size-4" /> <span class="hidden sm:inline">Sign out</span>
				</Button>
			</form>
		</div>
	</aside>
	<main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
		{@render children()}
	</main>
</div>
