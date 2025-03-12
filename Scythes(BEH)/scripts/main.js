import { BlockVolume, Player, system, world } from "@minecraft/server";
import { WoodenScythe } from "./item_behaviors/WoodenScythe";
import { destroyBlocksArc, getBlock, getBlocksInSweep, getEntitiesInSweep } from "./BlockUtils";
import { TickBreakCrop } from "./block_behaviors/tickBreakCrop";
import { OnUseOnScytheHarvest } from "./item_behaviors/OnUseOnScytheHarvest";
import { clearHeldItem, getHeldItem, setHeldItem } from "./InventoryLibrary(1.1.2)";
import { getItemPropertyTag } from "./ItemUtils";

world.beforeEvents.worldInitialize.subscribe((eventData) => {
	eventData.itemComponentRegistry.registerCustomComponent("djc:wooden_scythe", WoodenScythe);

	eventData.itemComponentRegistry.registerCustomComponent("djc:on_use_on_scythe_harvest", OnUseOnScytheHarvest);

	eventData.blockComponentRegistry.registerCustomComponent("djc:tick_break_crop", TickBreakCrop);
});

world.afterEvents.entityHurt.subscribe((eventData) => {
	const damage = eventData.damage;
	const source = eventData.damageSource;
	const hurtEntity = eventData.hurtEntity;

	// If the damage did not come from a player, or the player is not holding an item, return.
	if (!source.damagingEntity) {
		return;
	}

	if (source.damagingEntity.typeId !== "minecraft:player") {
		return;
	}

	if (!getHeldItem(source.damagingEntity)) {
		return;
	}

	/**@type {Player} */
	const player = source.damagingEntity;

	const heldItem = getHeldItem(player);

	if (!heldItem.getTags().includes("scythe")) {
		return;
	}

	const reach = parseInt(getItemPropertyTag(heldItem, "reach"));

	const mobs = getEntitiesInSweep(player, 100, reach);

	mobs.forEach((mob) => {
		mob.applyDamage(damage * getRandomFloat(0.3, 0.5), { damagingEntity: player, cause: "entityAttack" });
	});

	player.playSound(`scythe.shing`, { pitch: getRandomInt(1, 1.4), volume: 0.5 });

	const chanceForTwo = 1 / 5;

	if (mobs.length > 1) {
		player.playSound(`scythe.slash`, { pitch: getRandomInt(1, 1.4), volume: 0.5 });
	}
});

// Handles scythe destruction
world.afterEvents.entityHitBlock.subscribe((eventData) => {
	const entity = eventData.damagingEntity;
	const block = eventData.hitBlock;

	// If the entity that hit a block is not a player, return.
	if (entity.typeId !== "minecraft:player") {
		return;
	}

	// If the player is not holding an item, return.
	if (!getHeldItem(entity)) {
		return;
	}

	const heldItem = getHeldItem(entity);

	// If the held item is not a scythe, return.
	if (!heldItem.getTags().includes("scythe")) {
		return;
	}

	// Wooden scythe behaves a little differently
	if (heldItem.typeId !== "djc:wooden_scythe") {
		const reach = parseInt(getItemPropertyTag(heldItem, "reach"));

		let processedBlockCount = destroyBlocksArc(entity, 180, reach);

		if (processedBlockCount > 0) {
			const modifiedItem = heldItem.clone();

			const durability = modifiedItem.getComponent("durability");

			if (durability.damage + 1 > durability.maxDurability) {
				clearHeldItem(entity);
				entity.playSound("random.break");
				return;
			} else {
				durability.damage += 1;
			}

			setHeldItem(entity, modifiedItem);
		}
	}
});

export function getRandomFloat(min, max) {
	// Ensure min and max are numbers
	if (typeof min !== "number" || typeof max !== "number") {
		throw new Error("Both min and max must be numbers.");
	}

	// Ensure min is less than or equal to max
	if (min > max) {
		throw new Error("Min should not be greater than max.");
	}

	// Generate a random float between min and max
	const randomFloat = Math.random() * (max - min) + min;

	// Round to one decimal point
	return Math.round(randomFloat * 10) / 10;
}

export function getRandomInt(min, max) {
	if (typeof min !== "number" || typeof max !== "number") {
		throw new Error("Both min and max must be numbers");
	}
	if (min > max) {
		throw new Error("min should be less than or equal to max");
	}

	return Math.floor(Math.random() * (max - min + 1)) + min;
}
