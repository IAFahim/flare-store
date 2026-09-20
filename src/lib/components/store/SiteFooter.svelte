<script lang="ts">
	import { MessageCircle, Phone } from '@lucide/svelte';

	let {
		brand = 'Flare Store',
		note = 'Home delivery · Cash on delivery',
		whatsapp = ''
	}: { brand?: string; note?: string; whatsapp?: string } = $props();

	const displayNumber = $derived(
		whatsapp ? whatsapp.replace(/(\d{3})(\d{4})(\d+)/, '+$1 $2-$3') : ''
	);
</script>

<footer class="border-t border-stone-200/60 py-10">
	<div
		class="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6"
	>
		<div>
			<p class="font-display text-lg font-semibold">{brand}</p>
			<p class="text-sm text-muted-foreground">{note}</p>
		</div>
		{#if whatsapp}
			<div class="flex flex-col items-center gap-1.5 sm:items-end">
				<p class="text-xs tracking-wide text-muted-foreground uppercase">Contact us</p>
				<a
					href="https://wa.me/{whatsapp}"
					target="_blank"
					rel="noopener"
					class="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					<MessageCircle class="size-4" /> WhatsApp {displayNumber}
				</a>
				<a
					href="tel:+{whatsapp}"
					class="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					<Phone class="size-4" /> Call {displayNumber}
				</a>
			</div>
		{/if}
	</div>
</footer>

{#if whatsapp}
	<a
		href="https://wa.me/{whatsapp}"
		target="_blank"
		rel="noopener"
		class="fixed right-5 bottom-5 z-50 flex size-13 touch-manipulation items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
		aria-label="Chat with us on WhatsApp"
	>
		<MessageCircle class="size-6" />
	</a>
{/if}
