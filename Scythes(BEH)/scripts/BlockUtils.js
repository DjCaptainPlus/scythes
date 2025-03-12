import { Block, BlockTypes, BlockVolume, BlockVolumeBase, Dimension, Entity, ItemStack, Player, system, world } from "@minecraft/server";
import { Vector3 } from "./classes/Vector3";
import { getDropCount, getFortuneLevel, isItemSeed, spawnItems } from "./ItemUtils";
import { getHeldItem, giveEntityItems } from "./InventoryLibrary(1.1.2)";
import { addVectors, floorVector, subtractVectors } from "./vectorUtils";
import { getRandomFloat, getRandomInt } from "./main";
import { scytheDestructable } from "./ScytheDestructable";

/**
 * Determines if a block can be destroyed with a scyth.
 * @param {Block} block
 */
export function isBlockScytheDestructable(block) {
	return scytheDestructable.includes(block.typeId);
}

/**
 * Destroys a block.
 * @param {Block} block
 */
function destroyBlock(block) {
	const dimension = block.dimension;
	const x = block.location.x;
	const y = block.location.y;
	const z = block.location.z;

	dimension.runCommand(`setblock ${x} ${y} ${z} air destroy`);
}

/**
 * Determines if a block is a crop.
 * @param {Block} block
 */
export function isBlockCrop(block) {
	const crops = ["minecraft:wheat", "minecraft:carrots", "minecraft:potatoes", "minecraft:beetroot"];

	return crops.includes(block.typeId);
}

/**
 * Determines if a crop is in it's final stage of growth and ready for harvesting.
 * @param {Block} crop
 */
export function isCropRipe(crop) {
	const growthStage = getBlockState(crop, "growth");

	return growthStage == 7;
}

/**
 * Determines if a block is sugarcane.
 * @param {Block} block
 */
export function isBlockSugarcane(block) {
	// Minecraft Bedrock's id for sugarcane block is "minecraft:reeds"
	// Obviously this is dumb and likely to be changed in the future
	// So this is a failsafe. If the id is changed, reedsBlockType will return undefined
	// And the new id will be used instead.
	const reedsBlocktype = BlockTypes.get("minecraft:reeds");

	let sugarcaneId = "minecraft:reeds";

	if (!reedsBlocktype) {
		sugarcaneId = "minecraft:sugarcane";
	}

	return block.typeId === sugarcaneId;
}

/**
 * Determines if a block is bamboo.
 * @param {Block} block
 */
export function isBlockBamboo(block) {
	return block.typeId === "minecraft:bamboo";
}

/**
 * Gets the id of the item or items a crop should drop.
 * @param {Block} crop
 */
export function getCropDropItemId(crop) {
	let dropIds = [];

	switch (crop.typeId) {
		case "minecraft:carrots": {
			dropIds.push("minecraft:carrot");
			break;
		}
		case "minecraft:potatoes": {
			dropIds.push("minecraft:potato");
			break;
		}
		case "minecraft:wheat": {
			dropIds.push("minecraft:wheat");
			dropIds.push("minecraft:wheat_seeds");
			break;
		}
		case "minecraft:beetroot": {
			dropIds.push("minecraft:beetroot");
			dropIds.push("minecraft:beetroot_seeds");
			break;
		}
	}

	return dropIds;
}

/**
 *
 * @param {Vector3} blockLocation
 * @param {Dimension} dimension
 */
export function getBlock(blockLocation, dimension) {
	return dimension.getBlock(blockLocation);
}

/**
 * Returns the value of a state on the given block. If the block has no such state, returns undefined.
 * @param {Block} block
 * @param {string} stateId
 * @returns {boolean | string | number | undefined}
 */
export function getBlockState(block, stateId) {
	return block.permutation.getState(stateId);
}

/**
 * Harvests a crop and handles giving the drops to the player.
 * @param {Block} crop
 * @param {Player} player
 */
export function harvestCrop(crop, player, playSound = true) {
	const scythe = getHeldItem(player);
	const cropName = crop.typeId.split(":")[1];

	// If crop is not ripe, don't do anything.
	if (!isCropRipe(crop)) {
		return;
	}

	// Get the id's of the item, or items, the crop should drop.
	const dropItemIds = getCropDropItemId(crop);

	// Handle drops for every item in the array.
	dropItemIds.forEach((itemId) => {
		// Get the number of items to drop, based on the fortune level of the scythe.
		let dropQuantity = getDropCount(scythe);

		// If the item is used as a seed, subtract one. This is done because the crop is automatically replanted.
		if (isItemSeed(itemId)) {
			dropQuantity -= 1;
		}

		let remainder = 0;

		// Drop quantity can be 0, if the original number was 1. In this case, the crop will give the player nothing, but still be replanted.
		if (dropQuantity > 0) {
			// Add as many items to the player's inventory as possible. The remaining quantity is stored.
			remainder = giveEntityItems(player, new ItemStack(itemId, dropQuantity));
		}

		// If there is any remainder, spawn them at the crop block.
		if (remainder > 0) {
			spawnItems(crop, itemId, remainder);
		}
	});

	// Replace the crop with a fake block version of it.
	// This fake block will instantly be broken and place a seed version of itself.
	crop.setType(`djc:fake_${cropName}`);
}

/**
 *
 * @param {Block} block
 * @param {Player} player
 */
export function harvestSugarcane(block, player) {
	const supportBlock = getSupportBlock(block);
	const bottomSugarcane = supportBlock.above();

	// Get a list of all sugarcane blocks in the volume.
	const sugarcaneBlocks = getStackedPlant(bottomSugarcane);

	// Handle harvesting each block.
	sugarcaneBlocks.forEach((sugarCane) => {
		harvestSinglePlant(player, sugarCane, "minecraft:sugar_cane", "djc:fake_sugar_cane");
	});
}

/**
 *
 * @param {Block} block
 * @param {Player} player
 */
export function harvestBamboo(block, player) {
	const supportBlock = getSupportBlock(block);
	const bottomBamboo = supportBlock.above();

	// Get a list of all sugarcane blocks in the volume.
	const bambooBlocks = getStackedPlant(bottomBamboo);

	// Handle harvesting each block.
	bambooBlocks.forEach((bamboo) => {
		harvestSinglePlant(player, bamboo, "minecraft:bamboo", "djc:fake_bamboo");
	});
}

/**
 * Harvests a single plant block and manages the resulting drops.
 *
 * @param {Player} player - The player harvesting the plant. Used to determine held item for fortune level and inventory management.
 * @param {Block} block - The block being harvested. Determines the location for spawning items or replacement effects.
 * @param {string} dropId - The ID of the item to drop when the plant is harvested.
 * @param {string} fakeBlockId - The ID of the block used for replacement when within proximity to simulate particle and sound effects.
 * @param {number} [defaultQuantity=1] - The default number of items to drop before applying fortune effects. Defaults to 1 if not specified.
 */
function harvestSinglePlant(player, block, dropId, fakeBlockId, defaultQuantity = 1) {
	const fortuneLevel = getFortuneLevel(getHeldItem(player));

	// Attempt to insert drops directly into the player's inventory.
	// If the inventory can't fit the entire stack, return the remainder.
	const remainder = giveEntityItems(player, new ItemStack(dropId, defaultQuantity + getRandomInt(0, fortuneLevel)));

	// If there are leftover items, spawn them at the block's location.
	if (remainder > 0) {
		spawnItems(block, dropId, remainder);
	}

	// Handle the block breaking logic.
	if (isBlockWithinDistance(block, player, 10)) {
		// Replace the block with a fake block for particle and sound effects.
		block.setType(fakeBlockId);
	} else {
		// Simply remove the block by setting it to air.
		block.setType("minecraft:air");
	}
}

/**
 * Gets the blocks that comprise a stacked plant, such as sugarcane or bamboo.
 * @param {Block} bottomPlant - The bottom block of the plant.
 * @returns {Block[]} - An array of blocks that make up the stacked plant.
 */
function getStackedPlant(bottomPlant) {
	const dimension = bottomPlant.dimension;
	const location = bottomPlant.location;
	const id = bottomPlant.typeId;

	let proceed = true;
	let step = 1;
	let blocks = [];
	const maxY = 319; // Define the maximum Y value allowed.

	// March upwards from the bottom plant block, checking each block until we find one that is not part of the plant or exceed the max Y value.
	while (proceed) {
		const currentLocation = addVectors(location, new Vector3(0, step, 0));

		// Stop the loop if the current step would exceed the max Y value.
		if (currentLocation.y > maxY) {
			proceed = false;
			break;
		}

		let currentBlock = dimension.getBlock(currentLocation);

		// If the current block could not be retrieved, or it is not part of the plant, stop the loop.
		// Otherwise, store the current block and increment the step.
		if (!currentBlock || currentBlock.typeId !== id) {
			proceed = false;
		} else {
			blocks.push(currentBlock);
			step++;
		}
	}

	return blocks;
}

/**
 * Gets the support block for a stacked plant, like sugarcane or bamboo.
 * @param {Block} startBlock - The block from which the raycast originates.
 * @returns {Block | undefined} - The supporting block, or `undefined` if not found.
 */
function getSupportBlock(startBlock) {
	const id = startBlock.typeId;
	const dimension = startBlock.dimension;
	const origin = startBlock.center();
	const direction = new Vector3(0, -1, 0);

	// Perform a raycast straight down from the start block, ignoring blocks of it's own type.
	const rayCastResult = dimension.getBlockFromRay(origin, direction, { excludeTypes: [`${id}`] });

	// If for some reason the raycast could not hit a block, return undefined.
	if (!rayCastResult) {
		console.warn(`Support block could not be found for: ${id}`);
		return undefined;
	}

	// If the raycast was successful, return the support block.
	return rayCastResult.block;
}

/**
 * Harvests crops in an area around a block.
 * @param {Block} centerBlock
 * @param {number} width
 * @param {Player} player
 */
export function multiHarvestArc(player, arcWidth, arcRange) {
	// Get a list of blocks around the center to harvest.
	const blocksToHarvest = getBlocksInSweep(player, arcWidth, arcRange);

	// Play whooshing sound
	player.playSound("scythe.whoosh", { pitch: getRandomFloat(1, 1.5) });

	let processedBlockCount = 0;

	for (let block of blocksToHarvest) {
		if (isBlockCrop(block)) {
			if (isCropRipe(block)) {
				harvestCrop(block, player, false);
				processedBlockCount++;
			}
		} else if (isBlockSugarcane(block)) {
			harvestSugarcane(block, player);
			processedBlockCount++;
		} else if (isBlockBamboo(block)) {
			harvestBamboo(block, player);
			processedBlockCount++;
		} else if (isBlockScytheDestructable(block)) {
			destroyBlock(block);
			processedBlockCount++;
		}
	}

	return processedBlockCount;
}

/**
 *
 * @param {Player} player
 * @param {number} arcWidth
 * @param {number} arcRange
 */
export function destroyBlocksArc(player, arcWidth, arcRange) {
	const blocksToDestroy = getBlocksInSweep(player, arcWidth, arcRange);

	player.playSound("scythe.whoosh", { pitch: getRandomFloat(1, 1.5) });

	let processedBlockCount = 0;

	for (let block of blocksToDestroy) {
		if (scytheDestructable.includes(block.typeId)) {
			destroyBlock(block);
			processedBlockCount++;
		}
	}

	return processedBlockCount;
}

/**
 * Retrieves blocks in a narrow, sweeping arc directly in front of the player, including blocks one level above.
 *
 * @param {Player} player - The player whose location is the center of the arc.
 * @param {number} arcWidth - The angular width (in degrees) of the arc centered on the player's view direction.
 * @param {number} arcRange - The maximum distance (radius) of the arc from the player.
 * @returns {Block[]} An array of blocks within the specified sweeping arc on both levels.
 */
export function getBlocksInSweep(player, arcWidth, arcRange) {
	const playerLocation = player.location;
	const playerDimension = player.dimension;

	// Extract player's coordinates
	const centerX = Math.floor(playerLocation.x);
	const centerY = Math.floor(playerLocation.y);
	const centerZ = Math.floor(playerLocation.z);

	const viewDirection = player.getViewDirection(); // Normalized Vector3 {x, y, z}

	// Extract only the X-Z direction from the view direction (ignore Y component)
	const horizontalViewDirection = {
		x: viewDirection.x,
		z: viewDirection.z
	};

	// Normalize the horizontal view direction
	const horizontalMagnitude = Math.sqrt(horizontalViewDirection.x ** 2 + horizontalViewDirection.z ** 2);
	horizontalViewDirection.x /= horizontalMagnitude;
	horizontalViewDirection.z /= horizontalMagnitude;

	// Calculate the cosine of half the arc width (used for dot product check)
	const halfArcWidthCos = Math.cos((arcWidth / 2) * (Math.PI / 180)); // Convert to radians

	const blocks = [];

	// Focus only on blocks close to the player (1 to arcRange distance)
	for (let distance = 1; distance <= arcRange; distance++) {
		for (let angle = -arcWidth / 2; angle <= arcWidth / 2; angle += 1) {
			// Calculate the direction vector for this angle
			const angleRadians = angle * (Math.PI / 180);
			const sweepVector = {
				x: horizontalViewDirection.x * Math.cos(angleRadians) - horizontalViewDirection.z * Math.sin(angleRadians),
				z: horizontalViewDirection.x * Math.sin(angleRadians) + horizontalViewDirection.z * Math.cos(angleRadians)
			};

			// Scale the vector by the distance
			const targetX = centerX + Math.round(sweepVector.x * distance);
			const targetZ = centerZ + Math.round(sweepVector.z * distance);

			// Add the block at this position (current level)
			const currentLevelBlockLocation = { x: targetX, y: centerY, z: targetZ };
			const currentLevelBlock = getBlock(currentLevelBlockLocation, playerDimension);

			// Add the block one level up
			const upperLevelBlockLocation = { x: targetX, y: centerY + 1, z: targetZ };
			const upperLevelBlock = getBlock(upperLevelBlockLocation, playerDimension);

			// Add blocks to the list, avoiding duplicates
			const isCurrentDuplicate = blocks.some((b) => b.x === currentLevelBlockLocation.x && b.y === currentLevelBlockLocation.y && b.z === currentLevelBlockLocation.z);
			const isUpperDuplicate = blocks.some((b) => b.x === upperLevelBlockLocation.x && b.y === upperLevelBlockLocation.y && b.z === upperLevelBlockLocation.z);

			if (!isCurrentDuplicate) blocks.push(currentLevelBlock);
			if (!isUpperDuplicate) blocks.push(upperLevelBlock);
		}
	}

	blocks.push(getBlock(addVectors(player.location, new Vector3(0, 1, 0)), player.dimension));

	return blocks;
}

/**
 * Retrieves entities in a narrow, sweeping arc directly in front of the player,
 * excluding the player themselves. This version only checks the player’s current level.
 *
 * @param {Player} player - The player whose location is the center of the arc.
 * @param {number} arcWidth - The angular width (in degrees) of the arc centered on the player's view direction.
 * @param {number} arcRange - The maximum distance (radius) of the arc from the player.
 * @returns {Entity[]} An array of unique entities within the specified sweeping arc on the player's current level.
 */
export function getEntitiesInSweep(player, arcWidth, arcRange) {
	const playerLocation = player.location;
	const playerDimension = player.dimension;

	// Extract player's coordinates
	const centerX = Math.floor(playerLocation.x);
	const centerY = Math.floor(playerLocation.y);
	const centerZ = Math.floor(playerLocation.z);

	const viewDirection = player.getViewDirection(); // Normalized Vector3 { x, y, z }

	// Extract only the X-Z direction from the view direction (ignore Y component)
	const horizontalViewDirection = {
		x: viewDirection.x,
		z: viewDirection.z
	};

	// Normalize the horizontal view direction
	const horizontalMagnitude = Math.sqrt(horizontalViewDirection.x ** 2 + horizontalViewDirection.z ** 2);
	horizontalViewDirection.x /= horizontalMagnitude;
	horizontalViewDirection.z /= horizontalMagnitude;

	const foundEntities = new Set();

	for (let distance = 1; distance <= arcRange; distance++) {
		for (let angle = -arcWidth / 2; angle <= arcWidth / 2; angle += 1) {
			const angleRadians = angle * (Math.PI / 180);
			const sweepVector = {
				x: horizontalViewDirection.x * Math.cos(angleRadians) - horizontalViewDirection.z * Math.sin(angleRadians),
				z: horizontalViewDirection.x * Math.sin(angleRadians) + horizontalViewDirection.z * Math.cos(angleRadians)
			};

			const targetX = centerX + Math.round(sweepVector.x * distance);
			const targetZ = centerZ + Math.round(sweepVector.z * distance);

			// Current level block
			const currentLevelLocation = { x: targetX, y: centerY, z: targetZ };
			const entitiesAtCurrent = playerDimension.getEntitiesAtBlockLocation(currentLevelLocation);

			for (const entity of entitiesAtCurrent) {
				// Exclude the player
				if (entity.id !== player.id) {
					foundEntities.add(entity);
				}
			}
		}
	}

	return Array.from(foundEntities);
}

/**
 * Determines if the specified block is within a certain distance from the player.
 *
 * @param {Block} block - The reference block.
 * @param {Player} player - The player object, which has a .location property (Vector3).
 * @param {number} distance - The maximum allowable distance.
 * @returns {boolean} True if the block is within the specified distance of the player's location; otherwise, false.
 */
function isBlockWithinDistance(block, player, distance) {
	// Get the locations of the block and the player
	const blockLocation = block.location;
	const playerLocation = player.location;

	// Calculate the squared distance to avoid unnecessary square root calculation
	const squaredDistance = Math.pow(blockLocation.x - playerLocation.x, 2) + Math.pow(blockLocation.y - playerLocation.y, 2) + Math.pow(blockLocation.z - playerLocation.z, 2);

	// Compare the squared distance to the squared maximum distance
	return squaredDistance <= Math.pow(distance, 2);
}
