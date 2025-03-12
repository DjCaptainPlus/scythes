import { Vector3 } from "./classes/Vector3";

/**
 * Compares two Vector3 objects and determines if they are equal.
 * @param {Vector3} vector1 - The first vector to compare.
 * @param {Vector3} vector2 - The second vector to compare.
 * @returns {boolean} True if the vectors are identical, false otherwise.
 * @throws {Error} If either argument is not provided or is not an object with x, y, and z properties.
 */
export function areVectorsEqual(vector1, vector2) {
	if (!vector1 || !vector2) {
		throw new Error("Both arguments must be objects with x, y, and z properties.");
	}

	return vector1.x === vector2.x && vector1.y === vector2.y && vector1.z === vector2.z;
}

/**
 * Adds two Vector3 objects and returns a new Vector3 representing the sum.
 * @param {Vector3} vector1 - The first vector to add.
 * @param {Vector3} vector2 - The second vector to add.
 * @returns {Vector3} A new Vector3 object representing the sum of the two vectors.
 * @throws {Error} If either argument is not provided or is not an object with x, y, and z properties.
 */
export function addVectors(vector1, vector2) {
	if (!vector1 || !vector2) {
		throw new Error("Both arguments must be objects with x, y, and z properties.");
	}

	return new Vector3(vector1.x + vector2.x, vector1.y + vector2.y, vector1.z + vector2.z);
}

/**
 * Subtracts one Vector3 object from another and returns a new Vector3 representing the difference.
 * @param {Vector3} vector1 - The vector to subtract from (minuend).
 * @param {Vector3} vector2 - The vector to subtract (subtrahend).
 * @returns {Vector3} A new Vector3 object representing the difference between the two vectors.
 * @throws {Error} If either argument is not provided or is not an object with x, y, and z properties.
 */
export function subtractVectors(vector1, vector2) {
	if (!vector1 || !vector2) {
		throw new Error("Both arguments must be objects with x, y, and z properties.");
	}

	return new Vector3(vector1.x - vector2.x, vector1.y - vector2.y, vector1.z - vector2.z);
}


/**
 * Floors the x, y, and z components of a Vector3 object and returns a new Vector3.
 * @param {Vector3} vector - The vector to floor.
 * @returns {Vector3} A new Vector3 object with all components floored.
 * @throws {Error} If the argument is not provided or is not an object with x, y, and z properties.
 */
export function floorVector(vector) {
	if (!vector) {
		throw new Error("Argument must be an object with x, y, and z properties.");
	}

	return new Vector3(
		Math.floor(vector.x),
		Math.floor(vector.y),
		Math.floor(vector.z)
	);
}