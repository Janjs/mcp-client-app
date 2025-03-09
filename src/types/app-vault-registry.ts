/**
 * The app vault registry is a registry of all the vaults that the application has knowledge of.
 * This is stored as a configuration file in the application's data folder.
 *
 * The data structured described here is used to represent the vaults in memory and on disk.
 */

import { ConfiguredVault } from "./vault";

export interface AppVaultRegistry {
  vaults: ConfiguredVault[];
}
