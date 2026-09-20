<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { formatMoney } from '$lib/money';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const tabs = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
</script>

<svelte:head><title>Orders — Flare Admin</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="font-display text-2xl font-semibold">Orders</h1>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each tabs as tab (tab)}
			<Button
				variant={data.status === tab ? 'default' : 'outline'}
				size="sm"
				href="{resolve('/admin/(protected)/orders')}{tab === 'all' ? '' : `?status=${tab}`}"
				class="capitalize"
			>
				{tab}
			</Button>
		{/each}
	</div>

	<Card.Root>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Order</Table.Head>
					<Table.Head>Customer</Table.Head>
					<Table.Head>Items</Table.Head>
					<Table.Head>Payment</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head class="text-right">Total</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.orders as order (order.id)}
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
						<Table.Cell class="text-sm">
							{order.items.reduce((s, i) => s + i.quantity, 0)}
						</Table.Cell>
						<Table.Cell>
							<Badge variant="outline" class="capitalize">{order.paymentStatus}</Badge>
							<p class="mt-0.5 text-xs text-muted-foreground">{order.paymentMethod}</p>
						</Table.Cell>
						<Table.Cell>
							<Badge
								variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}
								class="capitalize"
							>
								{order.status}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-right font-medium">
							{formatMoney(order.grandTotal, order.currency)}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={6} class="py-10 text-center text-muted-foreground">
							No orders found
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Root>
</div>
