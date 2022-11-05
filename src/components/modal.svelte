<script>
	export let modalName;
	import { showingModal } from "../lib/stores";
</script>

<div class="modal" class:showing={$showingModal[0]===modalName}>
	<button style="aspect-ratio: 1; padding: 0.75em;" on:click={_=>$showingModal = $showingModal.filter(item=>item!==modalName)}>esc</button>
	<slot></slot>
</div>

<style lang="scss">
	.modal {
		opacity: 0;
		position: absolute;
		transform: scale(0.8);
		transition: var(--modal-transition);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: min(860px, 100%);
		width: 100%;
		max-height: 100%;
		overflow: auto;
		padding: 12px;
		box-sizing: border-box;
		gap: 12px;
		pointer-events: none;
		&.showing {
			opacity: 1;
			transform: scale(1);
			pointer-events: auto;
		}
	}
</style>