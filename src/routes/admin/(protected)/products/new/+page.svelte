<script lang="ts">
	import ProductForm from '$lib/components/admin/ProductForm.svelte';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import { resolve } from '$app/paths';

	let { form } = $props();
</script>

<svelte:head><title>New product — Flare Admin</title></svelte:head>

<Breadcrumb.Root class="mb-6">
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href={resolve('/admin/(protected)/products')}>Products</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		<Breadcrumb.Item><Breadcrumb.Page>New</Breadcrumb.Page></Breadcrumb.Item>
	</Breadcrumb.List>
</Breadcrumb.Root>

<h1 class="mb-6 font-display text-2xl font-semibold">New product</h1>
<ProductForm {form} />
