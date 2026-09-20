<script lang="ts">
	import SiteHeader from '$lib/components/store/SiteHeader.svelte';
	import SiteFooter from '$lib/components/store/SiteFooter.svelte';
	import ProductGallery from '$lib/components/store/ProductGallery.svelte';
	import ProductDetail from '$lib/components/store/ProductDetail.svelte';
	import OrderForm from '$lib/components/store/OrderForm.svelte';
	import Faq from '$lib/components/store/Faq.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { formatMoney } from '$lib/money';
	import { Truck, Banknote, RefreshCcw } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	let { data, form } = $props();

	const featured = $derived(data.featured);
	const others = $derived(data.products.filter((p) => p.id !== featured?.id));
	const colorOption = $derived(featured?.options.find((o) => /colou?r/i.test(o.name)));

	let quantities = $state<Record<number, number>>({});
	const cartCount = $derived(Object.values(quantities).reduce((s, q) => s + q, 0));
</script>

<SiteHeader brand={data.brand} whatsapp={data.whatsapp} {cartCount} />

<main class="mx-auto w-full max-w-7xl px-4 sm:px-6">
	{#if featured}
		<!-- Hero -->
		<section class="grid items-center gap-8 py-10 sm:py-16 lg:grid-cols-2 lg:gap-16">
			<div class="space-y-6">
				{#if featured.subtitle}
					<p class="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
						{featured.subtitle}
					</p>
				{/if}
				<h1 class="font-display text-4xl font-semibold text-balance sm:text-5xl">
					{featured.title}
				</h1>
				<p class="font-display text-2xl font-semibold">
					{formatMoney(featured.price, featured.currency)}
					{#if featured.compareAtPrice}
						<span class="ml-2 text-base font-normal text-muted-foreground line-through">
							{formatMoney(featured.compareAtPrice, featured.currency)}
						</span>
						<Badge variant="secondary" class="ml-2 align-middle">Sale</Badge>
					{/if}
				</p>
				{#if featured.description}
					<p class="max-w-prose leading-relaxed text-muted-foreground">
						{featured.description.split('\n\n')[0]}
					</p>
				{/if}
				<div class="flex flex-wrap items-center gap-3">
					<Button size="lg" href="{resolve('/')}#order">
						<Banknote class="size-4" /> Order — cash on delivery
					</Button>
					<span
						class="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 px-3.5 text-sm text-muted-foreground"
					>
						<Truck class="size-4" /> Home delivery available
					</span>
				</div>
			</div>
			<div class="min-w-0">
				<ProductGallery
					images={featured.images}
					title={featured.title}
					autoplay
					thumbnails={false}
				/>
			</div>
		</section>

		<!-- USP strip -->
		<section class="grid gap-3 border-y border-stone-200/70 py-5 sm:grid-cols-3">
			{#each [{ icon: Banknote, title: 'Cash on delivery', text: 'Pay when your order arrives' }, { icon: Truck, title: 'Home delivery', text: 'Nationwide shipping, 2–4 days' }, { icon: RefreshCcw, title: 'Easy returns', text: 'Check at the door, return instantly' }] as usp (usp.title)}
				<div class="flex items-center gap-3">
					<div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
						<usp.icon class="size-4.5" />
					</div>
					<div class="min-w-0">
						<p class="text-sm font-medium">{usp.title}</p>
						<p class="text-xs text-muted-foreground">{usp.text}</p>
					</div>
				</div>
			{/each}
		</section>

		<!-- Other products -->
		{#if others.length > 0}
			<section class="space-y-6 py-10">
				<h2 class="font-display text-2xl font-semibold">Also in the shop</h2>
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each others as product (product.id)}
						<a
							href={resolve('/products/[slug]', { slug: product.slug })}
							class="group min-w-0 space-y-3"
						>
							<div class="overflow-hidden rounded-xl bg-stone-100">
								{#if product.images[0]}
									<img
										src={product.images[0].url}
										alt={product.images[0].alt || product.title}
										width="800"
										height="1000"
										class="aspect-[4/5] w-full object-cover transition group-hover:scale-[1.02]"
										loading="lazy"
									/>
								{/if}
							</div>
							<div class="space-y-1">
								<p class="font-medium group-hover:underline">{product.title}</p>
								{#if product.description}
									<p class="line-clamp-2 text-sm text-muted-foreground">
										{product.description.split('\n\n')[0]}
									</p>
								{/if}
								<p class="text-sm font-medium tabular-nums">
									{formatMoney(product.price, product.currency)}
								</p>
							</div>
						</a>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Details + order -->
		<section class="grid gap-10 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
			<div class="min-w-0 space-y-8 self-start lg:sticky lg:top-20">
				<ProductDetail product={featured} />

				{#if colorOption}
					<div class="space-y-4">
						<h2 class="font-display text-lg font-semibold">Colourways</h2>
						<div class="grid grid-cols-3 gap-3">
							{#each colorOption.values as color (color)}
								{@const img =
									featured.images.find((i) => i.colorKey === color) ?? featured.images[0]}
								<figure class="min-w-0 space-y-2">
									{#if img}
										<img
											src={img.url}
											alt="{featured.title} — {color}"
											width="800"
											height="800"
											class="aspect-square w-full rounded-lg object-cover"
											loading="lazy"
										/>
									{/if}
									<figcaption class="text-center text-sm text-muted-foreground">
										{color}
									</figcaption>
								</figure>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<div class="min-w-0">
				<OrderForm
					product={featured}
					zones={data.zones}
					paymentMethods={data.paymentMethods}
					{form}
					bind:quantities
				/>
			</div>
		</section>
	{:else}
		<section class="py-20 text-center">
			<h1 class="font-display text-4xl font-semibold">{data.brand}</h1>
			<p class="mt-3 text-muted-foreground">New arrivals are on the way.</p>
		</section>
	{/if}

	<!-- FAQ -->
	<section class="mx-auto max-w-3xl py-10">
		<Faq items={data.faq} />
	</section>
</main>

<SiteFooter brand={data.brand} whatsapp={data.whatsapp} />
