import { ethers } from "ethers";
import { PROVIDERS } from "./providers";
import { ADDRESS} from "./address";
import { ABI } from "./abi";
import { CONFIG } from "./config";


interface PairAndVault {
  LIQUIDATIONPAIR: ethers.Contract;
  VAULT: ethers.Contract;
  ASSET: ethers.Contract;
}

interface Boost {
  LIQUIDATIONPAIR: ethers.Contract;
}
type ContractsType = {
  // CLAIMSERVICEFACTORY: {
  //   [key: string]: ethers.Contract;
  // };
  // WINBOOST: {
  //   [key: string]: ethers.Contract;
  // };
  // WINBOOSTER: {
  //   [key: string]: ethers.Contract;
  // };
  DRAWMANAGER: {
    [key: string]: ethers.Contract;
  };
  CLAIMER: {
    [key: string]: ethers.Contract;
  };
  VAULTS: {
    [key: string]: PairAndVault[];
  };
  LIQUIDATIONROUTER: {
    [key: string]: ethers.Contract;
  }; 
  RNG: {
    [key: string]: ethers.Contract;
  }; 
  PRIZETOKEN: {
    [key: string]: ethers.Contract;
  };
  PRIZEPOOL: {
    [key: string]: ethers.Contract;
  };
  TWABCONTROLLER: {
    [key: string]: ethers.Contract;
  };
  BOOSTS: {
    [key: string]: Boost[];
  };
  // RNGRELAYAUCTION: {
  //   [key: string]: ethers.Contract;
  // };

  // RNGAUCTION: {
  //   [key: string]: ethers.Contract;
  // };
  TWABREWARDS: {
    [key: string]: ethers.Contract;
  };

  // LINK: {
  //   [key: string]: ethers.Contract;
  // };

  // CHAINLINKDIRECTAUCTIONHELPER: {
  //   [key: string]: ethers.Contract;
  // };
};

const CONTRACTS: ContractsType = {
  DRAWMANAGER: {
      [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].DRAWMANAGER,
      ABI.DRAWMANAGER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  // WINBOOST: {
  //   [CONFIG.CHAINNAME]: new ethers.Contract(
  //     ADDRESS[CONFIG.CHAINNAME].WINBOOST,
  //     ABI.WINBOOST,
  //     PROVIDERS[CONFIG.CHAINNAME]
  //   ),
  // },
  // WINBOOSTER: {
  //   [CONFIG.CHAINNAME]: new ethers.Contract(
  //     ADDRESS[CONFIG.CHAINNAME].WINBOOSTER,
  //     ABI.WINBOOSTER,
  //     PROVIDERS[CONFIG.CHAINNAME]
  //   ),
  // },
  // },
  //   CLAIMSERVICEFACTORY: {
  //       [CONFIG.CHAINNAME]: new ethers.Contract(
  //         ADDRESS[CONFIG.CHAINNAME].CLAIMSERVICEFACTORY,
  //         ABI.CLAIMSERVICEFACTORY,
  //         PROVIDERS[CONFIG.CHAINNAME]
  //       ),
  //   },
  CLAIMER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].CLAIMER,
      ABI.CLAIMER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },

  // RNGRELAYAUCTION: {
  //   [CONFIG.CHAINNAME]: new ethers.Contract(
  //     ADDRESS[CONFIG.CHAINNAME].RNGRELAYAUCTION,
  //     ABI.RNGRELAYAUCTION,
  //     PROVIDERS[CONFIG.CHAINNAME]
  //   ),
  // },
  // RNGAUCTION: {
  //   MAINNET: new ethers.Contract(
  //     ADDRESS_AUCTION["MAINNET"].RNGAUCTION,
  //     ABI.RNGAUCTION,
  //     PROVIDERS["MAINNET"]
  //   ),
  // },
  // CHAINLINKDIRECTAUCTIONHELPER: {
  //   MAINNET: new ethers.Contract(
  //     ADDRESS_AUCTION.MAINNET.CHAINLINKDIRECTAUCTIONHELPER,
  //     ABI.CHAINLINKDIRECTAUCTIONHELPER,
  //     PROVIDERS["MAINNET"]
  //   ),
  // },
  // LINK: {
  //   MAINNET: new ethers.Contract(
  //     ADDRESS_AUCTION.MAINNET.LINK,
  //     ABI.LINK,
  //     PROVIDERS["MAINNET"]
  //   ),
  // },
  VAULTS: {
    [CONFIG.CHAINNAME]: ADDRESS[CONFIG.CHAINNAME].VAULTS.map((vault) => ({
      LIQUIDATIONPAIR: new ethers.Contract(
        vault.LIQUIDATIONPAIR,
        ABI.LIQUIDATIONPAIR,
        PROVIDERS[CONFIG.CHAINNAME]
      ),
      VAULT: new ethers.Contract(
        vault.VAULT,
        ABI.VAULT,
        PROVIDERS[CONFIG.CHAINNAME]
      ),
      ASSET: new ethers.Contract(
        vault.ASSET,
        ABI.POOL, // should be changed to ERC20 generic
        PROVIDERS[CONFIG.CHAINNAME]
      ),
    })),
  },
  LIQUIDATIONROUTER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].LIQUIDATIONROUTER,
      ABI.LIQUIDATIONROUTER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  }

  ,
  RNG: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].RNG,
      ABI.RNG,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },

  // POOL: {
  //   [CONFIG.CHAINNAME]: new ethers.Contract(
  //     ADDRESS[CONFIG.CHAINNAME].POOL,
  //     ABI.POOL,
  //     PROVIDERS[CONFIG.CHAINNAME]
  //   ),
  // },
  PRIZETOKEN: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].PRIZETOKEN.ADDRESS,
      ABI.ERC20,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  PRIZEPOOL: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].PRIZEPOOL,
      ABI.PRIZEPOOL,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  TWABREWARDS: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].TWABREWARDS,
      ABI.TWABREWARDS,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  TWABCONTROLLER: {
    [CONFIG.CHAINNAME]: new ethers.Contract(
      ADDRESS[CONFIG.CHAINNAME].TWABCONTROLLER,
      ABI.TWABCONTROLLER,
      PROVIDERS[CONFIG.CHAINNAME]
    ),
  },
  BOOSTS: {
    [CONFIG.CHAINNAME]: ADDRESS[CONFIG.CHAINNAME].BOOSTERS.map((boost) => ({
      LIQUIDATIONPAIR: new ethers.Contract(
        boost.LIQUIDATIONPAIR,
        ABI.LIQUIDATIONPAIR,
        PROVIDERS[CONFIG.CHAINNAME]
      ),
    })),
  },
};

export { CONTRACTS };
