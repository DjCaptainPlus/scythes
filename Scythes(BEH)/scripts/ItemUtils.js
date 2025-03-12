import { ItemComponentTypes, ItemStack, world } from "@minecraft/server";

/**
 * Spawns the specified number of items at the given block location.
 *
 * @param {Block} block - The block from which items are dropped.
 * @param {string} itemId - The ID of the item to spawn.
 * @param {number} quantity - The number of items to spawn.
 */
export function spawnItems(block, itemId, quantity) {
	// Spawn the item stack at the block's center.
	block.dimension.spawnItem(new ItemStack(itemId, quantity), block.center());
}

/**
 * Calculates the total number of items to drop based on the Fortune level.
 *
 * @param {number} fortuneLevel - The level of the Fortune enchantment (0 to 3).
 * @returns {number} - The total number of items to drop.
 */
export function calculateDrops(fortuneLevel = 0) {
	// Validate and clamp the fortune level between 0 and 3.
	const clampedFortune = Math.max(0, Math.min(fortuneLevel, 3));

	// Calculate the initial drops based on Fortune level.
	const initialDrops = Math.floor(Math.random() * (clampedFortune + 1)) + 1;

	// Determine the number of binomial trials based on Fortune level.
	const trials = 3 + clampedFortune; // Each Fortune level adds one trial.
	const successProbability = 8 / 15; // Approximately 53%

	// Calculate additional drops using a binomial distribution.
	let additionalDrops = 0;
	for (let i = 0; i < trials; i++) {
		if (Math.random() < successProbability) {
			additionalDrops++;
		}
	}

	// Return the total number of drops.
	return initialDrops + additionalDrops;
}

/**
 * Returns the level of fortune the given item has.
 * @param {ItemStack} itemStack
 */
export function getFortuneLevel(itemStack) {
	const enchantComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);

	// If the item doesn't have the enchantable component, or doesn't have fortune, return 0.
	if (!enchantComponent || !enchantComponent.hasEnchantment("fortune")) {
		return 0;
	}

	return enchantComponent.getEnchantment("fortune").level;
}

/**
 * Calculates a number of drops based on the fortune level of the held item, if any.
 * @param {ItemStack} itemStack
 */
export function getDropCount(itemStack) {
	// Initialize fortune level to 0.
	let fortuneLevel = 0;

	// If the player is holding an item, get a new fortune level based on it.
	if (itemStack) {
		fortuneLevel = getFortuneLevel(itemStack);
	}

	// Get a drop number based on the level of fortune.
	return calculateDrops(fortuneLevel);
}

/**
 * Determines if an item is a seed.
 * @param {string} itemId
 */
export function isItemSeed(itemId) {
	return ["minecraft:wheat_seeds", "minecraft:beetroot_seeds", "minecraft:carrot", "minecraft:potato"].includes(itemId);
}

/**
 * Gets the value of a tag property from an item.
 * @param {ItemStack} itemStack
 * @param {string} propertyName
 */
export function getItemPropertyTag(itemStack, propertyName) {
	// Get a list of tags on the item.
	const itemTags = itemStack.getTags();

	// If the item doesn't have a tag with the given property name, return undefined.
	if (!itemTags.some((tag) => tag.startsWith(propertyName))) {
		return undefined;
	}

	return itemTags.find((tag) => tag.startsWith(propertyName)).split(":")[1];
}
