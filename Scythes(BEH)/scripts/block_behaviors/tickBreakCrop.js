import { BlockComponentTickEvent, system, world } from "@minecraft/server";

export const TickBreakCrop = {
	/**
	 * @param {BlockComponentTickEvent} event
	 */
	onTick: (event) => {
		const block = event.block;
		const blockId = block.typeId.split("fake_")[1];

		block.dimension.runCommand(`setblock ${block.location.x} ${block.location.y} ${block.location.z} air destroy`);

		block.setType(`minecraft:${blockId}`);
		block.setPermutation(block.permutation.withState("growth", 0));
	}
};
