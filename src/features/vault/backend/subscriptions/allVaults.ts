import { appQueryCache } from "@core/queries/client";

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
