import { Container, ContainerSlot, Entity, EntityComponentTypes, ItemStack, Player, world } from "@minecraft/server";
export function compareStringArrays(arr1, arr2) {
	if (arr1.length !== arr2.length) {
		return false;
	}

	const sortedArr1 = arr1.slice().sort();
	const sortedArr2 = arr2.slice().sort();

	return sortedArr1.every((value, index) => value === sortedArr2[index]);
}

/**
 * Retrieves the inventory container of the given entity, if it has an inventory component.
 * If the entity does not have an inventory component, returns undefined.
 *
 * @param {Entity} entity - The entity from which to retrieve the inventory container.
 * @returns {Container | undefined} - The inventory container of the entity, or undefined if no inventory component is present.
 *
 * @example
 * // Add a diamond to a minecart with chest whenever a player interacts with it.
 * world.afterEvents.playerInteractWithEntity.subscribe((eventData) => {
 *     let interactedEntity = eventData.target;
 *
 *     // Check to see if the entity the player interacted with is a minecart with chest.
 *     if (interactedEntity.typeId === "minecraft:chest_minecart") {
 *         // Get the minecart entity's container component.
 *         let minecartContainer = getEntityContainer(interactedEntity);
 *
 *         // Create a new diamond item stack.
 *         let diamond = new ItemStack("minecraft:diamond");
 *
 *         // Place the diamond item in the first slot of the chest.
 *         setEntitySlotItem(interactedEntity, 0, diamond);
 *     }
 * });
 */
export function getEntityContainer(entity) {
	// Get the inventory component from the entity
	let entityInventoryComponent = entity.getComponent(EntityComponentTypes.Inventory);

	// If the entity does not have an inventory component, return undefined.
	if (!entityInventoryComponent) return undefined;

	// Retrieve and return the container from the inventory component.
	let entityContainer = entityInventoryComponent.container;

	// If the entity's inventory does not have a container, return undefined.
	if (!entityContainer) return undefined;

	return entityContainer;
}

/**
 * Returns the inventory slot the given player has currently selected.
 * @param {Player} player
 * @returns {ContainerSlot}
 */
export function getHeldSlot(player) {
	let heldSlotIndex = player.selectedSlotIndex;
	let playerContainer = getEntityContainer(player);

	return playerContainer.getSlot(heldSlotIndex);
}

/**
 * Inserts the specified item stack into the given container slot of an entity's inventory.
 * If the entity does not have a container, the operation is aborted.
 *
 * @param {Entity} entity - The entity whose inventory will be modified.
 * @param {number} slotIndex - The index of the inventory slot to modify.
 * @param {ItemStack} itemStack - The item stack to be placed in the specified slot.
 *
 * @example
 * // Example usage: Give a newly spawned player a diamond sword.
 * world.afterEvents.playerSpawn.subscribe((eventData) => {
 *     const player = eventData.player;
 *
 *     // Create a new item stack for a diamond sword.
 *     let diamondSword = new ItemStack("minecraft:diamond_sword");
 *
 *     // Place the diamond sword in the player's selected slot.
 *     setEntitySlotItem(player, player.selectedSlotIndex, diamondSword);
 * });
 */
export function setEntitySlotItem(entity, slotIndex, itemStack) {
	// Retrieve the container component of the entity's inventory.
	let entityContainer = getEntityContainer(entity);

	// Return early if the entity does not have an inventory or container component.
	if (!entityContainer) return;

	// Access the slot at the specified index within the container.
	let containerSlot = entityContainer.getSlot(slotIndex);

	// Set the item stack in the specified container slot.
	containerSlot.setItem(itemStack);
}

/**
 * Sets the item currently held by the given player to the given itemstack.
 * @param {Player} player
 * @param {itemStack} itemStack
 */
export function setHeldItem(player, itemStack = undefined) {
	let playerHeldSlot = getHeldSlot(player);

	if (itemStack) {
		playerHeldSlot.setItem(itemStack);
	} else {
		playerHeldSlot.setItem();
	}
}

/**
 *
 * @param {Player} player
 */
export function clearHeldItem(player) {
	let playerHeldSlot = getHeldSlot(player);

	playerHeldSlot.setItem();
}

/**
 * Returns an array of slot objects from a container or the container of an entity.
 * Each element contains the slot and its index.
 *
 * @param {Container | Entity} containerOrEntity - The container or entity to retrieve slots from.
 * @returns {Array<{slot: ContainerSlot, index: number}>} - An array of objects where each object has:
 *   - `slot` {ContainerSlot}: The slot in the container.
 *   - `index` {number}: The index of the slot in the container.
 *
 * @example
 * // Example: Get all slots and process them.
 * const slots = getContainerSlots(player);
 * for (let { slot, index } of slots) {
 *     if (slot.isEmpty()) {
 *         console.log(`Slot ${index} is empty.`);
 *     } else {
 *         const item = slot.getItem();
 *         console.log(`Slot ${index} contains ${item.typeId} x${item.amount}.`);
 *     }
 * }
 */
export function getContainerSlots(containerOrEntity) {
	// Get the container if the first argument is an entity.
	const container = containerOrEntity instanceof Entity ? getEntityContainer(containerOrEntity) : containerOrEntity;

	// If no container is found, return an empty array.
	if (!container) {
		return [];
	}

	// Collect all slots and their indices into an array.
	const slots = [];
	for (let i = 0; i < container.size; i++) {
		const slot = container.getSlot(i);
		slots.push({ slot, index: i });
	}

	return slots;
}

/**
 * Compares two ItemStacks based on various criteria specified in options.
 *
 * @param {ItemStack} itemStackA - The first ItemStack to compare.
 * @param {ItemStack} itemStackB - The second ItemStack to compare.
 * @param {Object} options - Comparison options.
 * @param {boolean} [options.matchQuantity=false] - Whether to compare item quantities.
 * @param {boolean} [options.matchTags=false] - Whether to compare item tags.
 * @param {boolean} [options.matchDynamicProperties=true] - Whether to compare dynamic properties.
 * @param {boolean} [options.matchLore=false] - Whether to compare lore.
 * @returns {boolean} - Returns true if all specified criteria match, otherwise false.
 *
 * @example
 * let itemA = new ItemStack("minecraft:sand",1);
 * let itemB = new ItemStack("minecraft:sand",5);
 *
 * if (compareItemStacks(itemA,itemB,{matchQuantity:true})) {
 * 		world.sendMessage("Items match.");
 * } else {
 * 		world.sendMessage("Items do not match.");
 * }
 */
export function compareItemStacks(itemStackA, itemStackB, options = { matchQuantity: false, matchTags: false, matchDynamicProperties: true, matchLore: false }) {
	let testResults = [];

	// Compare the id of the itemStacks.
	testResults.push(itemStackA.typeId === itemStackB.typeId);

	// Compare item quantities.
	if (options.matchQuantity) {
		testResults.push(itemStackA.amount === itemStackB.amount);
	}

	// Compare tags.
	if (options.matchTags) {
		testResults.push(compareStringArrays(itemStackA.getTags(), itemStackB.getTags()));
	}

	// Compare lore.
	if (options.matchLore) {
		testResults.push(compareStringArrays(itemStackA.getLore(), itemStackB.getLore()));
	}

	// Compare dynamic properties.
	if (options.matchDynamicProperties) {
		// Get the list of dynamic property id's from each item.
		let propertyNamesA = itemStackA.getDynamicPropertyIds();
		let propertyNamesB = itemStackB.getDynamicPropertyIds();

		// First check if the arrays of strings are the same. If they're not, they don't have matching properties.
		if (!compareStringArrays(propertyNamesA, propertyNamesB)) {
			return false;
		}

		testResults.push(propertyNamesA.every((propertyID) => itemStackA.getDynamicProperty(propertyID) === itemStackB.getDynamicProperty(propertyID)));
	}
	return testResults.every((result) => result === true);
}

/**
 * Retrieves a list of slots in the container that contain item stacks identical to the specified item stack,
 * excluding the quantity in the comparison.
 *
 * @param {ItemStack} itemStack - The target item stack to compare against other item stacks in the container.
 * @param {Container | Entity} containerOrEntity - The container or entity to check for matching item stacks.
 *
 * @returns {Array<ContainerSlot>} An array of slots that contain item stacks identical to the given item stack.
 */
export function getIdenticalItemStacks(itemStack, containerOrEntity) {
	// Get the slots of the container.
	let slots = getContainerSlots(containerOrEntity);

	// Array to store slots with matching item stacks.
	let matchingSlots = [];

	// Options for comparing item stacks, excluding quantity.
	let comparisonOptions = {
		matchQuantity: false,
		matchTags: true,
		matchDynamicProperties: true,
		matchLore: true
	};

	// Loop through each slot in the container.
	for (let { slot } of slots) {
		let containerSlotItemStack = slot.getItem();

		// If the current slot is empty, skip to the next one.
		if (!containerSlotItemStack) continue;

		// Compare the current slot's item stack with the target item stack using the specified options.
		let comparisonResult = compareItemStacks(itemStack, containerSlotItemStack, comparisonOptions);

		// If the item stacks are identical (except for quantity), add the current slot to the list.
		if (comparisonResult) {
			matchingSlots.push(slot);
		}
	}

	// Return the array of slots containing identical item stacks.
	return matchingSlots;
}

/**
 * Calculates and returns the total available space in the container for a given type of item stack.
 *
 * @param {Container | Entity} containerOrEntity - The container or entity to check.
 * @param {ItemStack} itemstack - The item stack type to check for space availability.
 * @param {boolean} [onlyConsiderExistingStacks=false] - Whether to only consider existing item stacks of the same type
 * and ignore empty slots when calculating available space. Defaults to false.
 *
 * @returns {number} The total number of items of the specified type that can be added to the container.
 */
export function getAvailableSpaceForItemStack(containerOrEntity, itemstack, onlyConsiderExistingStacks = false) {
	// Get all slots from the container.
	const slots = getContainerSlots(containerOrEntity);

	// The maximum number of items that can fit in a stack for the given item type.
	const itemStackMaxCount = itemstack.maxAmount;

	let totalAvailableSpace = 0; // Initialize total available space to 0.

	// Iterate through all slots.
	for (let { slot } of slots) {
		// Get the current item in the slot.
		let currentSlotItem = slot.getItem();

		if (!currentSlotItem) {
			// If the slot is empty and we are considering empty slots, add the full stack size.
			if (!onlyConsiderExistingStacks) {
				totalAvailableSpace += itemStackMaxCount;
			}
		} else if (currentSlotItem.typeId === itemstack.typeId) {
			// Add the remaining space in the stack if the item types match.
			totalAvailableSpace += itemStackMaxCount - currentSlotItem.amount;
		}
	}

	// Return the total available space.
	return totalAvailableSpace;
}

/**
 * Checks if any item in the container (or the container of an entity) has any of the specified tags.
 *
 * @param {Entity | Container} entityOrContainer - The entity or container to check for items with tags.
 * @param {string[]} tags - The array of tags to search for in the container's items.
 * @returns {boolean} - Returns true if any item in the container has any of the tags, false otherwise.
 */
export function containerHasAnyItemTag(entityOrContainer, tags) {
	// Get all slots from the container.
	let slots = getContainerSlots(entityOrContainer);

	// Iterate over the container slots.
	for (let { slot } of slots) {
		let item = slot.getItem();
		if (!item) continue;

		// Retrieve the item's tags as an array.
		const itemTags = item.getTags();

		// Check if the item contains any of the specified tags.
		if (tags.some((tag) => itemTags.includes(tag))) {
			return true;
		}
	}

	return false;
}

/**
 * Checks if any item in the container (or the container of an entity) has all of the specified tags.
 *
 * @param {Entity | Container} entityOrContainer - The entity or container to check for items with tags.
 * @param {string[]} tags - The array of tags to search for in the container's items.
 * @returns {boolean} - Returns true if any item in the container has all of the tags, false otherwise.
 */
export function containerHasAllItemTags(entityOrContainer, tags) {
	// Get all slots from the container.
	let slots = getContainerSlots(entityOrContainer);

	// Iterate over the container slots.
	for (let { slot } of slots) {
		let item = slot.getItem();
		if (!item) continue;

		// Retrieve the item's tags as an array.
		const itemTags = item.getTags();

		// Check if the item contains all the specified tags.
		if (tags.every((tag) => itemTags.includes(tag))) {
			return true;
		}
	}

	return false;
}

/**
 * Checks if the item in the given slot has any of the specified tags.
 *
 * @param {ContainerSlot} slot - The container slot to check.
 * @param {string[]} tags - The array of tags to search for.
 * @returns {boolean} - Returns true if the slot contains an item with any of the tags, false otherwise.
 */
export function slotHasAnyTag(slot, tags) {
	// Get the item from the slot.
	const item = slot.getItem();

	// Return false if the slot is empty (no item).
	if (!item) return false;

	// Retrieve the item's tags as an array.
	const itemTags = item.getTags();

	// Check if the item contains any of the specified tags.
	return tags.some((tag) => itemTags.includes(tag));
}

/**
 * Checks if the item in the given slot has all of the specified tags.
 *
 * @param {ContainerSlot} slot - The container slot to check.
 * @param {string[]} tags - The array of tags to search for.
 * @returns {boolean} - Returns true if the slot contains an item with all of the tags, false otherwise.
 */
export function slotHasAllTags(slot, tags) {
	// Get the item from the slot.
	const item = slot.getItem();

	// Return false if the slot is empty (no item).
	if (!item) return false;

	// Retrieve the item's tags as an array.
	const itemTags = item.getTags();

	// Check if the item contains all of the specified tags.
	return tags.every((tag) => itemTags.includes(tag));
}

/**
 * Retrieves the item from a specific slot in an entity's or container's inventory.
 *
 * @param {Entity | Container} containerOrEntity - The entity or container to retrieve the item from.
 * @param {number} slotIndex - The index of the slot to retrieve the item from.
 * @returns {ItemStack | undefined} - The item stack in the specified slot, or undefined if the slot is empty or does not exist.
 *
 * @example
 * let item = getInventoryItem(player, 0);
 * if (item) {
 *     console.log(`Slot 0 contains ${item.typeId} x${item.amount}.`);
 * } else {
 *     console.log("Slot 0 is empty or does not exist.");
 * }
 */
export function getInventoryItem(containerOrEntity, slotIndex) {
	// Get the container if the first argument is an entity.
	const container = containerOrEntity instanceof Entity ? getEntityContainer(containerOrEntity) : containerOrEntity;

	// If no container is found, return undefined.
	if (!container) return undefined;

	// Check if the slot index is within bounds.
	if (slotIndex < 0 || slotIndex >= container.size) return undefined;

	// Retrieve the item stack in the specified slot.
	const slot = container.getSlot(slotIndex);

	// Return the item in the slot, or undefined if the slot is empty.
	return slot.getItem() || undefined;
}

/**
 * Checks if the given item has any of the specified tags.
 *
 * @param {ItemStack} item - The item to check.
 * @param {string[]} tags - The array of tags to search for.
 * @returns {boolean} - Returns true if the item has any of the specified tags, false otherwise.
 *
 * @example
 * const item = new ItemStack("minecraft:diamond_sword");
 * if (itemHasAnyTag(item, ["rare", "epic"])) {
 *     console.log("The item has at least one of the specified tags.");
 * } else {
 *     console.log("The item does not have any of the specified tags.");
 * }
 */
export function itemHasAnyTag(item, tags) {
	// Return false if the item is undefined or null.
	if (!item) return false;

	// Retrieve the item's tags as an array.
	const itemTags = item.getTags();

	// Check if the item contains any of the specified tags.
	return tags.some((tag) => itemTags.includes(tag));
}

/**
 * Checks if the given item has all of the specified tags.
 *
 * @param {ItemStack} item - The item to check.
 * @param {string[]} tags - The array of tags to search for.
 * @returns {boolean} - Returns true if the item has all of the specified tags, false otherwise.
 *
 * @example
 * const item = new ItemStack("minecraft:diamond_sword");
 * if (itemHasAllTags(item, ["rare", "legendary"])) {
 *     console.log("The item has all the specified tags.");
 * } else {
 *     console.log("The item does not have all the specified tags.");
 * }
 */
export function itemHasAllTags(item, tags) {
	// Return false if the item is undefined or null.
	if (!item) return false;

	// Retrieve the item's tags as an array.
	const itemTags = item.getTags();

	// Check if the item contains all the specified tags.
	return tags.every((tag) => itemTags.includes(tag));
}

/**
 * Retrieves the item currently held by the given player.
 *
 * @param {Player} player - The player whose held item will be retrieved.
 * @returns {ItemStack | undefined} - The item stack currently held by the player, or undefined if the slot is empty.
 *
 * @example
 * const heldItem = getHeldItem(player);
 * if (heldItem) {
 *     console.log(`Player is holding ${heldItem.typeId} x${heldItem.amount}.`);
 * } else {
 *     console.log("Player is not holding anything.");
 * }
 */
export function getHeldItem(player) {
	// Get the player's currently selected slot.
	const heldSlot = getHeldSlot(player);

	// Return the item in the slot, or undefined if the slot is empty.
	return heldSlot.getItem() || undefined;
}

/**
 * Gives an entity items, ensuring the container has enough room.
 * If the container cannot fit the entire stack, adds as much as possible
 * and returns the remainder.
 *
 * @param {Entity} entity - The entity to give items to.
 * @param {ItemStack} itemStack - The item stack to give.
 * @returns {number} - The remainder of items that could not fit, or 0 if all items were added.
 */
export function giveEntityItems(entity, itemStack) {
	// Get the container of the entity.
	const container = getEntityContainer(entity);

	// Return the full stack amount as the remainder if there's no container.
	if (!container) {
		return itemStack.amount;
	}

	// Calculate the available space for the given item stack in the container.
	const availableSpace = getAvailableSpaceForItemStack(container, itemStack);

	// Determine how many items can actually be added.
	const itemsToAdd = Math.min(itemStack.amount, availableSpace);

	// Add items to the container if space is available.
	if (itemsToAdd > 0) {
		const partialStack = new ItemStack(itemStack.typeId, itemsToAdd);

		container.addItem(partialStack);
	}

	// Return the number of items that could not be added (remainder).
	return itemStack.amount - itemsToAdd;
}
