<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Plus } from '@lucide/svelte';
	import { formatMoney } from '$lib/money';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head><title>Products — Flare Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="font-display text-2xl font-semibold">Products</h1>
		<Button href={resolve('/admin/(protected)/products/new')}>
			<Plus class="size-4" /> New product
		</Button>
	</div>

	<Card.Root>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Product</Table.Head>
					<Table.Head>Variants</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Price</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.products as product (product.id)}
					<Table.Row>
						<Table.Cell>
							<div class="flex items-center gap-3">
								{#if product.images[0]}
									<img
										src={product.images[0].url}
										alt={product.title}
										class="size-10 rounded-md object-cover"
									/>
								{:else}
									<div class="size-10 rounded-md bg-stone-200"></div>
								{/if}
								<div class="min-w-0">
									<a
										href={resolve('/admin/(protected)/products/[id]', { id: String(product.id) })}
										class="font-medium hover:underline"
									>
										{product.title}
									</a>
									<p class="text-xs text-muted-foreground">/{product.slug}</p>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell class="text-sm">{product.variants.length}</Table.Cell>
						<Table.Cell>
							<div class="flex gap-1.5">
								<Badge
									variant={product.status === 'active' ? 'secondary' : 'outline'}
									class="capitalize"
								>
									{product.status}
								</Badge>
								{#if product.featured}
									<Badge variant="outline">featured</Badge>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="text-right font-medium">
							{formatMoney(product.price, product.currency)}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={4} class="py-10 text-center text-muted-foreground">
							No products yet — create your first one
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Root>
</div>
