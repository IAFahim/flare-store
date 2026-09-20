<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { MessageCircle, ShoppingCart } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let {
		brand = 'Flare Store',
		whatsapp = '',
		cartCount = 0
	}: { brand?: string; whatsapp?: string; cartCount?: number } = $props();
</script>

<header class="sticky top-0 z-40 border-b border-stone-200/60 bg-background/80 backdrop-blur">
	<div class="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
		<a href={resolve('/')} class="font-display text-xl font-semibold tracking-tight">{brand}</a>
		<nav class="flex items-center gap-1.5">
			{#if whatsapp}
				<Button
					variant="ghost"
					size="sm"
					href="https://wa.me/{whatsapp}"
					target="_blank"
					rel="noopener"
				>
					<MessageCircle class="size-4" />
					<span class="hidden sm:inline">WhatsApp</span>
				</Button>
			{/if}
			<a
				href="{resolve('/')}#order"
				class="relative inline-flex size-9 touch-manipulation items-center justify-center rounded-full transition hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
				aria-label="Your order — {cartCount} item{cartCount === 1 ? '' : 's'}"
			>
				<ShoppingCart class="size-5" />
				{#if cartCount > 0}
					<span
						class="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background tabular-nums"
					>
						{cartCount > 9 ? '9+' : cartCount}
					</span>
				{/if}
			</a>
		</nav>
	</div>
</header>
