import { appQueryCache, appQueryClient } from "@core/queries/client";
import { QueryObserver } from "@tanstack/react-query";
import { getAllVaultsQueryKey } from "../queries/getAllVaults";

let unsubscribe: (() => void) | undefined;
export function setupAllVaultsSubscription() {
  unsubscribe = appQueryCache.subscribe((event) => {
    console.log({ event });
  });

  console.log("all vaults subscription set up");
}

export function removeAllVaultsSubscription() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = undefined;
  }
}
