<script>
	import "boxicons";
	import { fly, scale } from "svelte/transition";
	import { toasts } from "../lib/stores";
	import { onMount } from "svelte";

	export let toastMessage;

	const { title, message, type, id } = toastMessage;

	const style = {
		info: { icon: "info-circle", color: "currentColor" },
		warn: { icon: "error", color: "var(--yellow)" },
		error: { icon: "error-circle", color: "var(--red)" },
	}[type || "info"];

	export let timeout = 8000;

	const close = () => toasts.update((t) => t.filter((t) => t.id !== id));

	onMount(() => {
		setTimeout(close, timeout);
	});
</script>

{#if $toasts.some((t) => t.id === id)}
	<div
		role="alert"
		class="horiz toast"
		in:fly={{ y: -100, opacity: 1, duration: 240 }}
		out:fly={{ y: -100, opacity: 0, duration: 240 }}
	>
		<box-icon style="flex-shrink: 0" name={style.icon} color={style.color} />
		<p style="text-overflow: ellipsis; max-height: 100%; overflow: hidden;">
			<strong>{title || "Message"}</strong><br />
			<span style="white-space: nowrap; text-overflow: ellipses">{message}</span>
		</p>
		<box-icon
			name="x"
			color="currentColor"
			role="button"
			tabindex="0"
			style="cursor: pointer; margin-left: auto;"
			on:click={close}
			on:keydown={close}
		/>
	</div>
{/if}

<style>
	.toast {
		background: #222;
		margin: var(--spacing);
		height: var(--top-height);
		padding: var(--spacing);
		box-sizing: border-box;
		border-radius: var(--rounding);
		font-size: 0.7em;
		max-width: 300px;
		z-index: 1000;
		box-shadow: 0 0 5px 0 var(--bg);
	}
</style>
