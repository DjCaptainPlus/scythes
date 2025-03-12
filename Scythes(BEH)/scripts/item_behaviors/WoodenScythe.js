import { ItemComponentUseOnEvent } from "@minecraft/server";
import { harvestCrop, isBlockCrop, isCropRipe } from "../BlockUtils";

export const WoodenScythe = {
	/**
	 * @param {ItemComponentUseOnEvent} event
	 */
	onUseOn: (event) => {
		const block = event.block;
		const player = event.source;

		harvestCrop(block, player);
	}
};
