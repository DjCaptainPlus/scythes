import { ItemComponentHitEntityEvent, ItemComponentMineBlockEvent, ItemComponentUseOnEvent, ItemStack, Player, world } from "@minecraft/server";
import { getItemPropertyTag } from "../ItemUtils";
import { getBlocksInSweep, getEntitiesInSweep, multiHarvestArc } from "../BlockUtils";
import { Vector3 } from "../classes/Vector3";
import { addVectors } from "../vectorUtils";
import { clearHeldItem, setHeldItem } from "../InventoryLibrary(1.1.2)";
import { getRandomInt } from "../main";

export const OnUseOnScytheHarvest = {
	/**
	 * @param {ItemComponentUseOnEvent} event
	 */
	onUseOn: (event) => {
		/**@type {Player} */
		const player = event.source;
		const scythe = event.itemStack;
		const reach = parseInt(getItemPropertyTag(scythe, "reach"));

		let harvestAmount = multiHarvestArc(player, 180, reach);

		if (harvestAmount > 0) {
			if (!scythe.typeId.includes("wooden") && !scythe.typeId.includes("stone")) {
				player.playSound(`scythe.shing`, { pitch: getRandomInt(0.8, 1.4), volume: 0.4 });

				const chanceForTwo = 1 / 5;

				if (Math.random() > chanceForTwo && harvestAmount > 1) {
					player.playSound(`scythe.shing`, { pitch: getRandomInt(0.8, 1.4), volume: 0.2 });
				}
			}

			const modifiedItem = scythe.clone();

			const durability = modifiedItem.getComponent("durability");

			if (durability.damage + 1 > durability.maxDurability) {
				clearHeldItem(player);
				player.playSound("random.break");
				return;
			} else {
				durability.damage += 1;
			}

			setHeldItem(player, modifiedItem);
		}
	}
};
