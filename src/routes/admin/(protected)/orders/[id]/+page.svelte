<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Table from '$lib/components/ui/table';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { formatMoney } from '$lib/money';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data, form } = $props();
	const order = $derived(data.order);

	$effect(() => {
		if (form?.success) toast.success('Order updated');
		if (form?.error) toast.error(form.error);
	});

	const LABELS: Record<string, string> = {
		pending: 'Pending',
		confirmed: 'Confirm',
		shipped: 'Mark shipped',
		delivered: 'Mark delivered',
		cancelled: 'Cancel order'
	};
</script>

<svelte:head><title>{order.publicId} — Orders — Flare Admin</title></svelte:head>

<Breadcrumb.Root class="mb-6">
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/admin/(protected)/orders')}>Orders</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item><Breadcrumb.Page>{order.publicId}</Breadcrumb.Page></Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
	<div class="min-w-0 space-y-6">
		<Card.Root>
			<Card.Header class="flex-row items-center justify-between space-y-0">
				<div>
					<Card.Title>{order.publicId}</Card.Title>
					<Card.Description>{order.createdAt.toLocaleString()}</Card.Description>
				</div>
				<div class="flex gap-2">
					<Badge
						variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}
						class="capitalize"
					>
						{order.status}
					</Badge>
					<Badge variant="outline" class="capitalize">{order.paymentStatus}</Badge>
				</div>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Item</Table.Head>
							<Table.Head class="text-center">Qty</Table.Head>
							<Table.Head class="text-right">Price</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each order.items as item (item.id)}
							<Table.Row>
								<Table.Cell>
									{item.title}
									{#if item.variantName}
										<span class="text-muted-foreground">— {item.variantName}</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-center">{item.quantity}</Table.Cell>
								<Table.Cell class="text-right">
									{formatMoney(item.lineTotal, order.currency)}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
				<Separator class="my-4" />
				<div class="space-y-1 text-sm">
					<div class="flex justify-between text-muted-foreground">
						<span>Items</span><span>{formatMoney(order.itemsTotal, order.currency)}</span>
					</div>
					<div class="flex justify-between text-muted-foreground">
						<span>Shipping — {order.shippingZoneName}</span>
						<span>{formatMoney(order.shippingFee, order.currency)}</span>
					</div>
					<div class="flex justify-between pt-1 text-base font-semibold">
						<span>Total</span><span>{formatMoney(order.grandTotal, order.currency)}</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header><Card.Title class="text-base">Timeline</Card.Title></Card.Header>
			<Card.Content>
				<ol class="space-y-4">
					{#each [...order.events].reverse() as event (event.id)}
						<li class="flex gap-3 text-sm">
							<div class="mt-1 size-2 shrink-0 rounded-full bg-foreground/70"></div>
							<div class="min-w-0">
								<p class="font-medium">{event.type}</p>
								{#if event.note}
									<p class="text-muted-foreground">{event.note}</p>
								{/if}
								<p class="text-xs text-muted-foreground">
									{event.createdAt.toLocaleString()} · {event.actor}
								</p>
							</div>
						</li>
					{/each}
				</ol>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="min-w-0 space-y-6">
		<Card.Root>
			<Card.Header><Card.Title class="text-base">Customer</Card.Title></Card.Header>
			<Card.Content class="space-y-1 text-sm">
				<p class="font-medium">{order.customerName}</p>
				<p class="text-muted-foreground">{order.customerPhone}</p>
				<p class="whitespace-pre-line text-muted-foreground">{order.customerAddress}</p>
				{#if order.customerNote}
					<p class="pt-2 text-muted-foreground italic">“{order.customerNote}”</p>
				{/if}
				<p class="pt-2 text-xs text-muted-foreground">
					Payment method: <span class="font-medium uppercase">{order.paymentMethod}</span>
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header><Card.Title class="text-base">Actions</Card.Title></Card.Header>
			<Card.Content class="space-y-3">
				{#if data.nextStatuses.length > 0}
					{#each data.nextStatuses as next (next)}
						<form
							method="POST"
							action="?/transition"
							use:enhance={() =>
								async ({ update }) => {
									await update();
									invalidateAll();
								}}
						>
							<input type="hidden" name="to" value={next} />
							<Button
								type="submit"
								variant={next === 'cancelled' ? 'destructive' : 'default'}
								class="w-full"
							>
								{LABELS[next] ?? next}
							</Button>
						</form>
					{/each}
				{:else}
					<p class="text-sm text-muted-foreground">No further status transitions.</p>
				{/if}

				{#if order.paymentStatus !== 'paid' && order.status !== 'cancelled'}
					<Separator />
					<form
						method="POST"
						action="?/payment"
						use:enhance={() =>
							async ({ update }) => {
								await update();
								invalidateAll();
							}}
					>
						<input type="hidden" name="to" value="paid" />
						<Button type="submit" variant="outline" class="w-full">Mark payment received</Button>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>

		<p class="text-xs text-muted-foreground">
			Public tracking link:
			<a
				href={resolve('/order/[id]', { id: order.publicId })}
				class="underline"
				target="_blank"
				rel="noopener"
			>
				/order/{order.publicId}
			</a>
		</p>
	</div>
</div>
