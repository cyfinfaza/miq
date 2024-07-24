<script>
	export let modalName;
	import { showingModal } from "../lib/stores";
	const closeModal = (_) => ($showingModal = null);
</script>

<div class="modal" class:showing={$showingModal === modalName}>
	<button class="closeModalButton" on:click={closeModal}>esc</button>
	<slot {closeModal} />
</div>

<style lang="scss">
	.modal {
		// background-color: var(--bg);
		opacity: 0;
		position: absolute;
		transform: scale(1.2);
		transition: var(--modal-transition);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: min(860px, 100%);
		min-height: min(100%, 400px);
		width: 100%;
		max-height: 100%;
		overflow: auto;
		padding: 12px;
		box-sizing: border-box;
		gap: var(--spacing);
		pointer-events: none;
		&.showing {
			opacity: 1;
			transform: scale(1);
			pointer-events: auto;
		}
	}
	.closeModalButton {
		background: var(--bg);
		box-shadow: 0 0 5px 0 var(--bg);
		aspect-ratio: 1;
		padding: 0.75em;
		flex-shrink: 0;
		position: sticky;
		top: 0;
	}
</style>
