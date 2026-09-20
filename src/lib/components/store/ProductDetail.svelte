<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { formatMoney } from '$lib/money';
	import type { ProductWithRelations } from '$lib/server/catalog';

	let { product, compact = false }: { product: ProductWithRelations; compact?: boolean } = $props();
</script>

<div class="space-y-6">
	<div class="space-y-3">
		{#if product.subtitle}
			<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				{product.subtitle}
			</p>
		{/if}
		<h1 class="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
			{product.title}
		</h1>
		<div class="flex items-baseline gap-3">
			<span class="font-display text-2xl font-semibold">
				{formatMoney(product.price, product.currency)}
			</span>
			{#if product.compareAtPrice}
				<span class="text-muted-foreground line-through">
					{formatMoney(product.compareAtPrice, product.currency)}
				</span>
				<Badge variant="secondary">Sale</Badge>
			{/if}
		</div>
	</div>

	{#if product.description}
		<div class="prose max-w-none text-[15px] leading-relaxed text-muted-foreground prose-stone">
			{#each product.description.split('\n\n') as para, i (i)}
				<p>{para}</p>
			{/each}
		</div>
	{/if}

	{#if product.details.length > 0 && !compact}
		<div class="space-y-3">
			<h2 class="font-display text-lg font-semibold">The details</h2>
			<dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
				{#each product.details as detail, i (i)}
					<div class="flex items-baseline justify-between gap-4 border-b border-stone-200 pb-2">
						<dt class="shrink-0 text-sm font-medium">{detail.label}</dt>
						<dd class="min-w-0 text-right text-sm text-muted-foreground">{detail.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}
</div>

<Separator class="my-2" />
