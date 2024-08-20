export interface PrizeToken {
  NAME: string;
  DECIMALS: number;
  ADDRESS: string;
  GECKO: string;
  SYMBOL: string;
  ICON: string;
}

export interface Address {
  VAULT: string;
  LIQUIDATIONPAIR: string;
  ASSET: string;
  ASSETSYMBOL: string;
  SYMBOL: string;
  NAME: string;
  DECIMALS: number;
  GECKO: string;
  ICON: string;
  VAULTICON?: string;
  UNIV2?: boolean;
}

interface ChainAddresses {
  ICON: string; // chain icon
  COLOR: string; // chain color
  CHAINID: number;
  ETHERSCAN: string;
  PRIZETOKEN: PrizeToken; // making it optional so existing objects won't break
  PRIZEPOOLSUBGRAPH: string;
  VAULTS: Address[];
  BOOSTERS: Address[];
  LIQUIDATIONROUTER: string;
  // LIQUIDATIONPAIRFACTORY: string;
  VAULTFACTORY: string;
  CLAIMERFACTORY: string;
  DRAWMANAGER: string;
  // REMOTEOWNER: string;
  PRIZEPOOL: string;
  CLAIMER: string;
  // POOL: string;
  // POOLTOKEN?: string;
  TOKENFAUCET: string;
  TWABCONTROLLER: string;
  RNG: string;
  TWABREWARDS: string;
  FIRSTDRAWOPENEDAT: number;
  DRAWPERIODSECONDS: number;
  // RNGRELAYAUCTION: string;
  // CLAIMSERVICEFACTORY: string;
  // WINBOOST: string;
  // WINBOOSTER: string;
}

interface Addresses {
  [key: string]: ChainAddresses;
}

interface StartBlock {
  [key: string]: {
    [contractName: string]: number;
  };
}

const ADDRESS: Addresses = {
  ARBITRUM: {
    ICON: "/images/arbitrum.png",
    COLOR: "#203147",
    FIRSTDRAWOPENEDAT: 1717106400,
    DRAWPERIODSECONDS: 86400,
    CHAINID: 42161,
    ETHERSCAN: "https://arbiscan.io/",
    TOKENFAUCET: "",
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/63100/pt-v5-arbitrum/version/latest",
    DRAWMANAGER: "0xc00146957ff55fad7d27deb69ff95d79fdcd37e6",
    RNG: "0xad1b8ec0151f13ba563226092b5f7308d8dc107b",
    PRIZETOKEN: {
      ADDRESS: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      SYMBOL: "WETH",
      NAME: "WETH",
      DECIMALS: 18,
      GECKO: "weth",
      ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
    },
    TWABCONTROLLER: "0x971ecc4e75c5fcfd8fc3eadc8f0c900b5914dc75",
    TWABREWARDS: "0xe21ac38a7e80104c4f6512ce4908a22bc09c59be",
    LIQUIDATIONROUTER: "0x7b4a60964994422bf19ae48a90fbff806767db73",
    VAULTFACTORY: "0x44be003e55e7ce8a2e0ecc3266f8a9a9de2c07bc",
    PRIZEPOOL: "0x52e7910c4c287848c8828e8b17b8371f4ebc5d42",
    CLAIMERFACTORY: "0xc4824b6b0bb0559d919a606f258ee68a890757da",
    CLAIMER: "0x1e68e5e92d22aefdc791a61c874c06831023e571",
    VAULTS: [
      {
        VAULT: "0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e",
        LIQUIDATIONPAIR: "0xf682c61Ef4a718491C446b259e1723eCa0Cc371C",
        SYMBOL: "przUSDC",
        NAME: "Prize USDC - Aave",
        DECIMALS: 6,
        ASSET: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        ASSETSYMBOL: "USDC",
        ICON: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
        GECKO: "usd-coin",
        VAULTICON: "https://app.cabana.fi/icons/przUSDC.svg",
      },
      {
        VAULT: "0xCACBa8Be4bc225FB8d15a9A3b702f84ca3EBa991",
        LIQUIDATIONPAIR: "0x46a3f4BA04aBE1c8fe9A86fE9f247f599A953558",
        SYMBOL: "przUSDT",
        NAME: "Prize USDT - Aave",
        DECIMALS: 6,
        ASSET: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        ASSETSYMBOL: "USDT",
        ICON: "",
        GECKO: "tether",
        VAULTICON: "https://app.cabana.fi/icons/przUSDT.svg",
      },
      {
        VAULT: "0x7b0949204e7da1b0bed6d4ccb68497f51621b574",
        LIQUIDATIONPAIR: "0x8F6C7737036A9743C8A569CADa41e4E8ED86AA6A",
        SYMBOL: "przWETH",
        NAME: "Prize WETH - Aave",
        DECIMALS: 18,
        ASSET: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        ASSETSYMBOL: "WETH",
        ICON: "https://uploads-ssl.webflow.com/631993187031511c025c721d/633c1ccea93ff4709ab091c2_633be870ec7f86530e8e5419_WETH.png",
        GECKO: "ethereum",
        VAULTICON: "https://app.cabana.fi/icons/przWETH.svg",
      },
    ],

    BOOSTERS: [
      {
        VAULT: "",
        LIQUIDATIONPAIR: "0x6A6Cfef8D19C6bC99115Bf66A1879D8cf4eCc95f",
        SYMBOL: "wethBooster",
        NAME: "booster",
        DECIMALS: 18,
        ASSET: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        ASSETSYMBOL: "WETH",
        GECKO: "ethereum",
        ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
      },
      {
        VAULT: "",
        LIQUIDATIONPAIR: "0xf94BA45DDdFB1352B580A6a122E2ABA48B8D1107",
        SYMBOL: "wethBooster",
        NAME: "booster",
        DECIMALS: 18,
        ASSET: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        ASSETSYMBOL: "WETH",
        GECKO: "ethereum",
        ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
      },
      {
        VAULT: "",
        LIQUIDATIONPAIR: "0x646EE92a46DA3b9fe89492212c9A0eeb6Bb6a203",
        SYMBOL: "wethBooster",
        NAME: "booster",
        DECIMALS: 18,
        ASSET: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        ASSETSYMBOL: "WETH",
        GECKO: "ethereum",
        ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
      },
    ],
    // PAIRS: [{
    //         VAULT: "0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e",
    //         LIQUIDATIONPAIR: "0x3Ff4944F934300EBEc0e22474f3BD47D05874dB9",
    //         SYMBOL: "AaveUSDCARBReward",
    //         NAME: "Aave USDC ARB Rewards",
    //         DECIMALS: 18,
    //         ASSET: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    //         ASSETSYMBOL: "ARB",
    //         GECKO: "arbitrum",
    //         NOVAULT: true,
    //       },]
  },

  BASE: {
    ICON: "/images/base.png",
    COLOR: "#437bf6",
    FIRSTDRAWOPENEDAT: 1715896800,
    DRAWPERIODSECONDS: 86400,
    CHAINID: 8453,
    ETHERSCAN: "https://basescan.org/",
    TOKENFAUCET: "",
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/41211/pt-v5-base/version/latest",
    // GASORACLE: "0x420000000000000000000000000000000000000F",
    // SWAPPER: "0x374cBE30c0CFece0a4c2A28E0E7c40c86D517aAa",
    PRIZETOKEN: {
      ADDRESS: "0x4200000000000000000000000000000000000006",
      SYMBOL: "WETH",
      NAME: "WETH",
      DECIMALS: 18,
      GECKO: "weth",
      ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
    },
    DRAWMANAGER: "0x8a2782bedc79982ebfa3b68b315a2ee40daf6ab0",
    RNG: "0x74ebf391831c0757b5a4335f2f3abbb1499d18f0",
    TWABCONTROLLER: "0x7e63601f7e28c758feccf8cdf02f6598694f44c6",
    TWABREWARDS: "0x86f0923d20810441efc593eb0f2825c6bff2dc09",
    LIQUIDATIONROUTER: "0xa9c937a0d1d22ad79099aea10efa62a270dfc22c",
    VAULTFACTORY: "0xe32f6344875494ca3643198d87524519dc396ddf",
    PRIZEPOOL: "0x45b2010d8a4f08b53c9fa7544c51dfd9733732cb",
    CLAIMERFACTORY: "0xd58a04fc8d34ce6b3633bf81ee7d5d25c71401e3",
    CLAIMER: "0x5ffeee76d1e2d2d1d18ba0bc77d8d047b85e1e87",
    VAULTS: [
      {
        VAULT: "0x6B5a5c55E9dD4bb502Ce25bBfbaA49b69cf7E4dd",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przPOOL",
        NAME: "Prize POOL",
        DECIMALS: 18,
        ASSET: "0xd652C5425aea2Afd5fb142e120FeCf79e18fafc3",
        ASSETSYMBOL: "POOL",
        ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
        GECKO: "pooltogether",
        VAULTICON: "https://app.cabana.fi/icons/przPOOL.svg",
      },
      {
        VAULT: "0x7f5C2b379b88499aC2B997Db583f8079503f25b9",
        LIQUIDATIONPAIR: "0xEBa6Aa26ea2C51874a467cc310181617B3a4A266",
        SYMBOL: "przUSDC",
        NAME: "Prize USDC - Moonwell",
        DECIMALS: 6,
        ASSET: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        ASSETSYMBOL: "USDC",
        ICON: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
        GECKO: "usd-coin",
        VAULTICON: "https://app.cabana.fi/icons/przUSDC.svg",
      },
      {
        VAULT: "0x8d1322CaBe5Ef2949f6bf4941Cc7765187C1091A",
        LIQUIDATIONPAIR: "0xa0297868d4e7c886BdeB8C258767c0a6fC80dc6d",
        SYMBOL: "przAERO",
        NAME: "Prize AERO - Moonwell",
        DECIMALS: 18,
        ASSET: "0x940181a94A35A4569E4529A3CDfB74e38FD98631",
        ASSETSYMBOL: "AERO",
        ICON: "",
        GECKO: "aerodrome-finance",
        VAULTICON: "https://app.cabana.fi/icons/przAERO.svg",
      },
      {
        VAULT: "0x5b623C127254C6fec04b492ecDF4b11c45FBB9D5",
        LIQUIDATIONPAIR: "0xeBD0A1161e833c090F88D57159c91eEC371E7e67",
        SYMBOL: "przCBETH",
        NAME: "Prize cbETH - Moonwell",
        DECIMALS: 18,
        ASSET: "0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22",
        ASSETSYMBOL: "cbETH",
        ICON: "",
        GECKO: "coinbase-wrapped-staked-eth",
        VAULTICON: "https://app.cabana.fi/icons/przCBETH.svg",
      },
      {
        VAULT: "0x75D700F4C21528A2bb603b6Ed899ACFdE5c4B086",
        LIQUIDATIONPAIR: "0xF94F69EeDDDF0A088f0A16D9aC569C1729F6444F",
        SYMBOL: "przWSTETH",
        NAME: "Prize wstETH - Moonwell",
        DECIMALS: 18,
        ASSET: "0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452",
        ASSETSYMBOL: "wstETH",
        ICON: "",
        GECKO: "wrapped-steth",
        VAULTICON: "https://app.cabana.fi/icons/przSTETH.svg",
      },
    ],
    BOOSTERS: [],
  },

  OPTIMISM: {
    ICON: "/images/op.png",
    COLOR: "#f64154",
    FIRSTDRAWOPENEDAT: 1713477600,
    DRAWPERIODSECONDS: 86400,
    CHAINID: 10,
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/63100/pt-v5-op-sepolia/version/latest",
    ETHERSCAN: "https://optimistic.etherscan.io/",
    PRIZETOKEN: {
      ADDRESS: "0x4200000000000000000000000000000000000006",
      SYMBOL: "WETH",
      NAME: "WETH",
      DECIMALS: 18,
      GECKO: "ethereum",
      ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
    },
    TOKENFAUCET: "",
    //  GASORACLE: '0x420000000000000000000000000000000000000F',
    TWABREWARDS: "0x90D383dEA4dcE52D3e5D3C93dE75eF36da3Ea9Ea",
    DRAWMANAGER: "0x7eED7444dE862c4F79c5820ff867FA3A82641857",
    RNG: "0x3d2Ef6C091f7CB69f06Ec3117F36A28BC596aa7B",
    TWABCONTROLLER: "0xCB0672dE558Ad8F122C0E081f0D35480aB3be167",
    LIQUIDATIONROUTER: "0x7766b5E6839a1a218Fc861b0810C504490876136",
    VAULTFACTORY: "0xF0F151494658baE060034c8f4f199F74910ea806",
    PRIZEPOOL: "0xF35fE10ffd0a9672d0095c435fd8767A7fe29B55",
    CLAIMERFACTORY: "0x498C92bEF017A91018ecCAE29b3b3C531e3f4794",
    CLAIMER: "0x0b5a1dc536D5A67C66D00B337E6b189385BD8438",
    VAULTS: [
      {
        VAULT: "0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe",
        LIQUIDATIONPAIR: "0x7d72e1043FBaCF54aDc0610EA8649b23055462f0",
        SYMBOL: "przUSDC",
        NAME: "Prize USDC",
        DECIMALS: 6,
        ASSET: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        ASSETSYMBOL: "USDC",
        ICON: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
        GECKO: "usd-coin",
        VAULTICON: "https://app.cabana.fi/icons/przUSDC.svg",
      },
      {
        VAULT: "0xa52e38a9147f5eA9E0c5547376c21c9E3F3e5e1f",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przPOOL",
        NAME: "Prize POOL",
        DECIMALS: 18,
        ASSET: "0x395Ae52bB17aef68C2888d941736A71dC6d4e125",
        ASSETSYMBOL: "POOL",
        ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
        GECKO: "pooltogether",
        VAULTICON:
          "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
      },
      {
        VAULT: "0x3e8DBe51DA479f7E8aC46307af99AD5B4B5b41Dc",
        LIQUIDATIONPAIR: "0xC9a3ebe8D34941eC7974b439a346D5F6880A70e8",
        SYMBOL: "przDAI",
        NAME: "Prize DAI",
        DECIMALS: 18,
        ASSET: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        ASSETSYMBOL: "DAI",
        ICON: "https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696509996",
        GECKO: "dai",
        VAULTICON: "https://app.cabana.fi/icons/przDAI.svg",
      },
      {
        VAULT: "0x1F16D3CCF568e96019cEdc8a2c79d2ca6257894E",
        LIQUIDATIONPAIR: "0xf040A530fE669Fc334ba924b1fC9971c17301281",
        SYMBOL: "przLUSD",
        NAME: "Prize LUSD",
        DECIMALS: 18,
        ASSET: "0xc40F949F8a4e094D1b49a23ea9241D289B7b2819",
        ASSETSYMBOL: "LUSD",
        ICON: "https://assets.coingecko.com/coins/images/14666/standard/Group_3.png?1696514341",
        GECKO: "liquity-usd",
        VAULTICON:
          "https://assets.coingecko.com/coins/images/14666/standard/Group_3.png?1696514341",
      },
      {
        VAULT: "0x2998c1685E308661123F64B333767266035f5020",
        LIQUIDATIONPAIR: "0x006e714accBFEecD561a9B590e919402e871a91D",
        SYMBOL: "przWETH",
        NAME: "Prize WETH",
        DECIMALS: 18,
        ASSET: "0x4200000000000000000000000000000000000006",
        ASSETSYMBOL: "WETH",
        ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
        GECKO: "ethereum",
        VAULTICON: "https://app.cabana.fi/icons/przWETH.svg",
      },
      {
        VAULT: "0xF1d934D5A3c6E530ac1450c92Af5Ba01eb90d4dE",
        LIQUIDATIONPAIR: "0x9CE27e482C76D69B70bde25626Df5b8308Bff2F1",
        SYMBOL: "przOP",
        NAME: "Prize OP - Beefy Sonne",
        DECIMALS: 18,
        ASSET: "0x4200000000000000000000000000000000000042",
        ASSETSYMBOL: "OP",
        GECKO: "optimism",
        ICON: "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png?1696524385",
        VAULTICON: "",
      },
      {
        VAULT: "0x9b53ef6f13077727d22cb4acad1119c79a97be17",
        LIQUIDATIONPAIR: "0x055bFA086ecEbC21e6D6De0BB2e2b6BcE0401d58",
        SYMBOL: "przPOOLWETH",
        NAME: "Prize POOL/WETH Beefy",
        DECIMALS: 18,
        ASSET: "0xDB1FE6DA83698885104DA02A6e0b3b65c0B0dE80",
        ASSETSYMBOL: "vAMMV2-POOL/WETH",
        GECKO: "",
        ICON: "",
        VAULTICON: "",
        UNIV2: true,
      },
    ],
    BOOSTERS: [],
  },
};

const STARTBLOCK: StartBlock = {
  OPTIMISM: {
    PRIZEPOOL: 118900268,
  },
  BASE: {
    PRIZEPOOL: 14506826,
  },
  ARBITRUM: { PRIZEPOOL: 216345250 },
  // BASESEPOLIA: {
  //   PRIZEPOOL: 9156245,
  // }
};

const ICONS: { [key: string]: string } = {
  "beefy": "https://assets.coingecko.com/coins/images/12704/standard/bifi.png?1698202580",
  "aave": "https://assets.coingecko.com/coins/images/12645/standard/AAVE.png?1696512452",
  "hop": "https://assets.coingecko.com/coins/images/25445/standard/hop.png?1696524577",
  "velodrome": "https://assets.coingecko.com/coins/images/25783/standard/velo.png?1696524870",
  "usdc": "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  "usdc.e": "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  "eth": "https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628",
  "thales": "https://assets.coingecko.com/coins/images/18388/standard/CLVZJN_C_400x400.png?1696517879",
  "lusd": "https://assets.coingecko.com/coins/images/14666/standard/Group_3.png?1696514341",
  "wbtc": "https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857",
  "weth": "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
  "dai": "https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696509996",
  "rocket pool": "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  "pool": "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
  "lonser": "https://sjc6.discourse-cdn.com/standard11/user_avatar/gov.pooltogether.com/lonser/288/591_2.png",
  "op": "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png?1696524385",
  "timbit": "https://cdn.discordapp.com/emojis/1012391997924966491.webp?size=240&quality=lossless",
  "aero": "https://assets.coingecko.com/coins/images/31745/standard/token.png?1696530564",
  "reth": "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  "wreth": "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  "wsteth": "https://assets.coingecko.com/coins/images/18834/standard/wstETH.png?1696518295",
  "cbeth": "https://assets.coingecko.com/coins/images/27008/standard/cbeth.png?1709186989",
  "banklessdao": "https://assets.coingecko.com/coins/images/15227/standard/j4WEJrwU.png?1696514882",
  "moonwell": "https://assets.coingecko.com/coins/images/26133/standard/WELL.png?1696525221",
  "usdt": "https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661",
  "angle": "https://assets.coingecko.com/coins/images/19060/standard/ANGLE_Token-light.png?1696518509",
  "usda": "https://assets.coingecko.com/coins/images/34510/standard/agUSD-coingecko.png?1705288392",
  "degen": "https://assets.coingecko.com/coins/images/34515/standard/android-chrome-512x512.png?1706198225",
  "higher": "https://assets.coingecko.com/coins/images/36084/standard/200x200logo.png?1710427814",
  "based": "https://assets.coingecko.com/coins/images/39669/standard/BASED.jpg?1723603780"
};

const WHITELIST_VAULTS = [
  "0x1f16d3ccf568e96019cedc8a2c79d2ca6257894e",
  "0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe",
  "0xa52e38a9147f5ea9e0c5547376c21c9e3f3e5e1f",
  "0x2998c1685e308661123f64b333767266035f5020",
  "0x3e8dbe51da479f7e8ac46307af99ad5b4b5b41dc",
  "0xf1d934d5a3c6e530ac1450c92af5ba01eb90d4de",
  "0x9b53ef6f13077727d22cb4acad1119c79a97be17",
  "0x6b5a5c55e9dd4bb502ce25bbfbaa49b69cf7e4dd",
  "0x7f5c2b379b88499ac2b997db583f8079503f25b9",
  "0x8d1322cabe5ef2949f6bf4941cc7765187c1091a",
  "0x75d700f4c21528a2bb603b6ed899acfde5c4b086",
  "0x850ec48d2605aad9c3de345a6a357a9a14b8cf1b",
  "0x5b623c127254c6fec04b492ecdf4b11c45fbb9d5",
  "0x3c72a2a78c29d1f6454caa1bcb17a7792a180a2e",
  "0x7b0949204e7da1b0bed6d4ccb68497f51621b574",
  "0xcacba8be4bc225fb8d15a9a3b702f84ca3eba991",
  "0x97a9c02cfbbf0332d8172331461ab476df1e8c95",
  "0x8653084e01Bd8c9e24B9a8fEb2036251Ee0C16A9", // angle stUSD arbitrum
  "0x6Bb041d7E70b7040611ef688b5e707a799ADe60A", // angle stUSD base
  "0xcadeacae6976bee87ec5ba44b0a5608a2259c517", // degen
  "0x4e42f783db2d0c5bdff40fdc66fcae8b1cda4a43", // base aave weth
  // "0xfdd33b8413a69ba9ce140b479f27ee7ab133850e", //OP Silo Beefy
  // "0x7affb8cb92ddf9f9d0ba6fdcd7cd7905cb6d2ec1", //rETH Silo Beefy
  // "0xa58163334eba40fa6e81a77c2b36f252a945928a", //Prize WETH - WETH Silo Beefy
  // "0xcc3fefb704be360245f8dd0386ac206941e66467", //WstETH Silo Beefy
  "0x9b4c0de59628c64b02d7ce86f21db9a579539d5a", //WSTETH Beefy
  "0xb4911efd3d53352f658536afd37e7897cb7dd7f6", //TBTC WBTC Beefy
  "0xa99ec0a1018bf964931c7dc421a5de8bca0e32f1", // USDC Aave Base

  "0x52ee27824a64430cbd1be03794d4eb92e4b8bbd0", //BASED Vault

];


const WHITELIST_REWARDS: { [chain: string]: { TOKEN: string; SYMBOL: string; GECKO: string; ICON: string; }[] } = {
  OPTIMISM: [
    {
      TOKEN: "0x4200000000000000000000000000000000000042",
      SYMBOL: "OP",
      GECKO: "optimism",
      ICON: "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png?1696524385",
    },
    {
      TOKEN: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      SYMBOL: "USDC",
      GECKO: "usd-coin",
      ICON: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
    },
  ],
  ARBITRUM: [
    {
      TOKEN: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      SYMBOL: "ARB",
      GECKO: "arbitrum",
      ICON: "https://assets.coingecko.com/coins/images/16547/standard/photo_2023-03-29_21.47.00.jpeg?1696516109",
    },
  ],
  BASE: [
    {
      TOKEN: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe",
      SYMBOL: "HIGHER",
      GECKO: "higher",
      ICON: "https://assets.coingecko.com/coins/images/36084/standard/200x200logo.png?1710427814",
    },
    {TOKEN: "0xd652C5425aea2Afd5fb142e120FeCf79e18fafc3",
     SYMBOL: "POOL",
     GECKO: "pooltogether",
     ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
    {TOKEN: "0x32e0f9d26d1e33625742a52620cc76c1130efde6",
     SYMBOL: "BASED",
     GECKO: "based-2",
     ICON: "https://assets.coingecko.com/coins/images/39669/standard/BASED.jpg?1723603780",
    },
  ],
};

export { ADDRESS, STARTBLOCK, ICONS, WHITELIST_REWARDS, WHITELIST_VAULTS };
