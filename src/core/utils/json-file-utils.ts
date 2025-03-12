import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Utility functions for reading and writing JSON files with Zod validation
 */

/**
 * Read and parse a JSON file with Zod validation
 * @param filePath Path to the JSON file
 * @param schema Zod schema to validate against
 * @param defaultValue Optional default value to return if file doesn't exist
 */
export async function readJsonFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  defaultValue?: T
): Promise<T> {
  try {
    // Ensure directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Try to read the file
    const data = await fs.readFile(filePath, 'utf8');
    
    try {
      // Parse and validate the JSON data
      const parsedData = JSON.parse(data);
      return schema.parse(parsedData);
    } catch (parseError) {
      console.error(`Error parsing or validating JSON file ${filePath}:`, parseError);
      
      // If validation fails but we have a default value, return it
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      throw parseError;
    }
  } catch (error) {
    // Handle file not found
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      
      throw new Error(`File not found: ${filePath}`);
    }
    
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write data to a JSON file with Zod validation
 * @param filePath Path to the JSON file
 * @param data Data to write
 * @param schema Zod schema to validate against
 */
export async function writeJsonFile<T>(
  filePath: string,
  data: T,
  schema: z.ZodType<T>
): Promise<void> {
  try {
    // Validate the data before writing
    const validatedData = schema.parse(data);
    
    // Ensure directory exists
    const directory = path.dirname(filePath);
    await fs.mkdir(directory, { recursive: true });
    
    // Write the file
    await fs.writeFile(filePath, JSON.stringify(validatedData, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Update a JSON file with Zod validation
 * @param filePath Path to the JSON file
 * @param updateFn Function that takes the current data and returns updated data
 * @param schema Zod schema to validate against
 * @param defaultValue Optional default value to use if file doesn't exist
 */
export async function updateJsonFile<T>(
  filePath: string,
  updateFn: (currentData: T) => T,
  schema: z.ZodType<T>,
  defaultValue: T
): Promise<T> {
  try {
    // Read current data
    const currentData = await readJsonFile(filePath, schema, defaultValue);
    
    // Update the data
    const updatedData = updateFn(currentData);
    
    // Validate and write the updated data
    await writeJsonFile(filePath, updatedData, schema);
    
    return updatedData;
  } catch (error) {
    console.error(`Error updating JSON file ${filePath}:`, error);
    throw error;
  }
} 