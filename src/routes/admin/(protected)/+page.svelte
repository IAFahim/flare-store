<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { formatMoney } from '$lib/money';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const stats = $derived([
		{ label: 'Pending', value: data.counts['pending'] ?? 0 },
		{ label: 'Confirmed', value: data.counts['confirmed'] ?? 0 },
		{ label: 'Shipped', value: data.counts['shipped'] ?? 0 },
		{ label: 'Delivered', value: data.counts['delivered'] ?? 0 },
		{ label: 'Products', value: data.productCount }
	]);
</script>

<svelte:head><title>Dashboard — Flare Admin</title></svelte:head>

<div class="space-y-8">
	<h1 class="font-display text-2xl font-semibold">Dashboard</h1>

	<div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
		{#each stats as stat (stat.label)}
			<Card.Root>
				<Card.Content class="p-5">
					<p class="text-sm text-muted-foreground">{stat.label}</p>
					<p class="mt-1 font-display text-3xl font-semibold">{stat.value}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent orders</Card.Title>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Order</Table.Head>
						<Table.Head>Customer</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Total</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.recent as order (order.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href={resolve('/admin/(protected)/orders/[id]', { id: String(order.id) })}
									class="font-medium hover:underline"
								>
									{order.publicId}
								</a>
								<p class="text-xs text-muted-foreground">
									{order.createdAt.toLocaleString()}
								</p>
							</Table.Cell>
							<Table.Cell>
								{order.customerName}
								<p class="text-xs text-muted-foreground">{order.customerPhone}</p>
							</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary" class="capitalize">{order.status}</Badge>
							</Table.Cell>
							<Table.Cell class="text-right font-medium">
								{formatMoney(order.grandTotal, order.currency)}
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={4} class="py-8 text-center text-muted-foreground">
								No orders yet
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
