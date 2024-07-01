import { ADDRESS, CONFIG } from "./constants/constants";
import { CONTRACTS } from "./constants/contracts";

async function go() {
  let vaults = [];
  for (
    let index = 0;
    index < ADDRESS[CONFIG.CHAINNAME].VAULTS.length;
    index++
  ) {
    const vault = ADDRESS[CONFIG.CHAINNAME].VAULTS[index];
    const name = await CONTRACTS.VAULTS[CONFIG.CHAINNAME][index].VAULT.name();
    const symbol = await CONTRACTS.VAULTS[CONFIG.CHAINNAME][
      index
    ].VAULT.symbol();

    vaults.push({
      VAULT: vault.VAULT,
      LIQUIDATIONPAIR: vault.LIQUIDATIONPAIR,
      SYMBOL: symbol,
      NAME: name,
    });
  }
}

go().catch((error) => {
  console.error(error);
});
