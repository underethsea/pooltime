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
  ACTIVE?: boolean;
  ICON: string; // chain icon
  COLOR: string; // chain color
  CHAINID: number;
  ETHERSCAN: string;
  PRIZETOKEN: PrizeToken; // making it optional so existing objects won't break
  PRIZEPOOLSUBGRAPH: string;
  VAULTS: Address[];
  BOOSTERS: Address[];
  LIQUIDATIONROUTER: string;
  METAREWARDS: string;
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

export interface Addresses {
  [key: string]: ChainAddresses;
}

interface StartBlock {
  [key: string]: {
    [contractName: string]: number;
  };
}

const ADDRESS: Addresses = {
  WORLD: {
    ICON: "/images/world.png",

    COLOR: "#9ed5ee",
    FIRSTDRAWOPENEDAT: 1743112800,
    DRAWPERIODSECONDS: 86400,
    CHAINID: 480,
    TOKENFAUCET: "",
    METAREWARDS: "",
    ETHERSCAN: "https://worldscan.org/",
    PRIZEPOOLSUBGRAPH:
      "https://subgraph.satsuma-prod.com/lonsers-team--313225/pt-v5-world",

    DRAWMANAGER: "0x62800f9bd164ea909224e19b7fdfa33a0f3f6373",
    RNG: "0x4a411d67cd47bfc41395946be069deb97a171437",
    TWABCONTROLLER: "0xa13d89cf3e7f59ba1a2b5b5c260bdfc64dd1044c",
    TWABREWARDS: "0x18e9e34cfccadcac465a8b6eaf337546b0980897",
    LIQUIDATIONROUTER: "0xfde1b3202ae55349bd4fecd38ca886fd1ed38e62",
    VAULTFACTORY: "0x08f8ebc3afc32371d40ef59a951cb7b2da425159",
    PRIZEPOOL: "0x99ffb0a6c0cd543861c8de84dd40e059fd867dcf",
    CLAIMERFACTORY: "0x078b27f64d02b404467d3a560d4acb3d3736c3a6",
    CLAIMER: "0x9035072fe640d5ef80edc41aef47b1a793809070",
    PRIZETOKEN: {
      ADDRESS: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
      SYMBOL: "WLD",
      NAME: "World",
      DECIMALS: 18,
      GECKO: "worldcoin-wld",
      ICON: "https://assets.coingecko.com/coins/images/31069/standard/worldcoin.jpeg?1696529903",
    },
    VAULTS: [
      {
        VAULT: "0x0045cC66eCf34da9D8D89aD5b36cB82061c0907C",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przPOOL",
        NAME: "Prize POOL",
        DECIMALS: 18,
        ASSET: "0x7077C71B4AF70737a08287E279B717Dcf64fdC57",
        ASSETSYMBOL: "POOL",
        GECKO: "pooltogether",
        VAULTICON: "",
        ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
      },
      {
        VAULT: "0x8ad5959c9245b64173d4c0c3cd3ff66dac3cab0e",
        LIQUIDATIONPAIR: "",
        SYMBOL: "przWLD",
        NAME: "Prize WORLD",
        DECIMALS: 18,
        ASSET: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        ASSETSYMBOL: "WLD",
        ICON: "https://assets.coingecko.com/coins/images/31069/standard/worldcoin.jpeg?1696529903",
        GECKO: "worldcoin-wld",
        VAULTICON:
          "https://assets.coingecko.com/coins/images/31069/standard/worldcoin.jpeg?1696529903",
      },
    ],
    BOOSTERS: [
      {
        LIQUIDATIONPAIR: "0xd7C720269aBd189cDdCceDb4339D75A4eb8a72A3",
        SYMBOL: "wldBooster",
        NAME: "wldbooster",
        DECIMALS: 18,
        ASSET: "0x2cFc85d8E48F8EAB294be644d9E25C3030863003",
        ASSETSYMBOL: "WLD",
        GECKO: "worldcoin-world",
        VAULT: "",
        ICON: "",
      },
    ],
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
    METAREWARDS: "0xF4c47dacFda99bE38793181af9Fd1A2Ec7576bBF",
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
      {
        VAULT: "0x4e42f783db2d0c5bdff40fdc66fcae8b1cda4a43",
        LIQUIDATIONPAIR: "0xC8598b5fdEEe42A129D515b3f3a67E9D74481fFa",
        SYMBOL: "przWETH",
        NAME: "Prize WETH - Aave",
        DECIMALS: 18,
        ASSET: "0x4200000000000000000000000000000000000006",
        ASSETSYMBOL: "WETH",
        ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
        GECKO: "ethereum",
        VAULTICON: "https://app.cabana.fi/icons/przWETH.svg",
      },

      {
        VAULT: "0x78adc13c9ab327c79d10cab513b7c6bd3b346858",
        LIQUIDATIONPAIR: "0xB092742AB775D6A2832A605547f95433607F83F2",
        SYMBOL: "przsuperOETHb",
        NAME: "Prize superOETHb",
        DECIMALS: 18,
        ASSET: "0xDBFeFD2e8460a6Ee4955A68582F85708BAEA60A3",
        ASSETSYMBOL: "superOETHb",
        ICON: "https://assets.coingecko.com/coins/images/39828/standard/Super_OETH.png?1724208268",
        GECKO: "super-oeth",
        VAULTICON: "",
      },
    ],
    BOOSTERS: [],
  },

  OPTIMISM: {
    ICON: "/images/optimism.svg",
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
    METAREWARDS: "0x36be31e7acd4b0d755bcc7858ef04848a3ec66c6",
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
        VAULT: "0x9b4c0de59628c64b02d7ce86f21db9a579539d5a",
        LIQUIDATIONPAIR: "0x1eceF235f5354DBDf53e32912921ed086cDa49E2",
        SYMBOL: "przWSTETH-ETH",
        NAME: "Prize WSTETH-ETH Beefy",
        DECIMALS: 18,
        ASSET: "0x6dA98Bde0068d10DDD11b468b197eA97D96F96Bc",
        ASSETSYMBOL: "vAMMV2-wstETH/WETH",
        ICON: "",
        GECKO: "",
        VAULTICON: "https://app.cabana.fi/icons/przVELO.svg",
      },
      {
        VAULT: "0x11271bF9855B679Bc484a0C80a69D8cc72fcEf89",
        LIQUIDATIONPAIR: "0xDB3DC8693cCAf73826d99C14324B2fb74eC9C39f",
        SYMBOL: "USDCwinETH",
        NAME: "USDC winETH",
        DECIMALS: 6,
        ASSET: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        ASSETSYMBOL: "USDC",
        ICON: "",
        GECKO: "usd-coin",
        VAULTICON: "https://app.cabana.fi/icons/przUSDC.svg",
      },
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
  GNOSIS: {
    ICON: "/images/gnosis.svg",
    COLOR: "#07795b",
    ETHERSCAN: "https://gnosisscan.io/",
    CHAINID: 100,
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/63100/pt-v5-gnosis/version/latest",
    FIRSTDRAWOPENEDAT: 1726783200,
    DRAWPERIODSECONDS: 86400,
    PRIZETOKEN: {
      ADDRESS: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
      SYMBOL: "WXDAI",
      NAME: "WXDAI",
      DECIMALS: 18,
      GECKO: "xdai",
      ICON: "https://assets.coingecko.com/coins/images/11062/standard/Identity-Primary-DarkBG.png?1696511004",
    },
    TOKENFAUCET: "",
    DRAWMANAGER: "0x146efc8d651dc015225cc2e74707d87aa4d09067",
    RNG: "0x47c9212cc5c0836521346ce9b3d03ca91edf1123",
    TWABCONTROLLER: "0x84090aea5370565b88108c4ffed378672a8afde6",
    TWABREWARDS: "0x1742157e6ef6e0cf7e49904f2c0d0fe38a276942",
    METAREWARDS: "0x0d51a33975024e8afc55fde9f6b070c10aa71dd9",
    LIQUIDATIONROUTER: "0x1664485e6b51ee1a4d4dd35dbec79544a5d006c9",
    VAULTFACTORY: "0xc3ae3fe36a2645a93b2fe350d81e80a14831e2a6",
    PRIZEPOOL: "0x0c08c2999e1a14569554eddbcda9da5e1918120f",
    CLAIMERFACTORY: "0x22e3857db02c4db38870dddc286d0543869ea47e",
    CLAIMER: "0x0cffb70cdd335cc5380cb58166699edaa2b0bbfa",
    VAULTS: [
      {
        VAULT: "0xB75AF20eCadabed9049cc2f50E38bAd2768b35cf",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przPOOL",
        NAME: "Prize POOL",
        DECIMALS: 18,
        ASSET: "0x216a7d520992eD198593A16e0b17c784c9cdc660",
        ASSETSYMBOL: "POOL",
        ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
        GECKO: "pooltogether",
        VAULTICON: "https://app.cabana.fi/icons/przPOOL.svg",
      },
      {
        VAULT: "0xBB7E99abCCCE01589Ad464Ff698aD139b0705d90",
        LIQUIDATIONPAIR: "0x6F4eDb3736D6e2Fea33d86e9865898Fbe3C6dEAa",
        SYMBOL: "przWXDAI",
        NAME: "Prize WXDAI - DAI Savings Rate",
        DECIMALS: 18,
        ASSET: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
        ASSETSYMBOL: "WXDAI",
        ICON: "",
        GECKO: "xdai",
        VAULTICON: "https://app.cabana.fi/icons/pDAI.svg",
      },
    ],
    BOOSTERS: [],
  },
  ETHEREUM: {
    ICON: "/images/eth.png",
    COLOR: "black",
    FIRSTDRAWOPENEDAT: 1725573600,
    DRAWPERIODSECONDS: 2419200,
    CHAINID: 1,
    ETHERSCAN: "https://etherscan.io/",
    TOKENFAUCET: "",
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/63100/pt-v5-ethereum/version/latest",
    PRIZETOKEN: {
      ADDRESS: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      SYMBOL: "WETH",
      NAME: "WETH",
      DECIMALS: 18,
      GECKO: "weth",
      ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
    },
    DRAWMANAGER: "0x98305eb9a29d45ec93ce44ba02b315b631c675a7",
    RNG: "0xf93329e78feff1145fce03a79d5b356588dea215",
    TWABCONTROLLER: "0x4d5f2cd31701f3e5de77b3f89ee7b80eb87b4acc",
    TWABREWARDS: "0x2589ff8614f74704741ee3b51851b4ae812f1a21",
    METAREWARDS: "0x3341dac0912b630f1a8c237b64f6861e9fa11d79",
    LIQUIDATIONROUTER: "0x7c210be12bcef8090610914189a0de43e2192ea0",
    VAULTFACTORY: "0x29c102109d6cb2d866cfec380e0e10e9a287a75f",
    PRIZEPOOL: "0x7865d01da4c9ba2f69b7879e6d2483ab6b354d95",
    CLAIMERFACTORY: "0x4457025dff44e3d9085d9195828e7d53fe6a7088",
    CLAIMER: "0x98cc81798954c35c39b960dfca3d8b170154aa7e",
    VAULTS: [
      {
        VAULT: "0x9ee31e845ff1358bf6b1f914d3918c6223c75573",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przPOOL",
        NAME: "Prize POOL",
        DECIMALS: 18,
        ASSET: "0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e",
        ASSETSYMBOL: "POOL",
        ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
        GECKO: "pooltogether",
        VAULTICON: "",
      },
      {
        VAULT: "0x96fE7B5762bD4405149a9A313473e68a8E870F6C",
        LIQUIDATIONPAIR: "0x7d888E2119F687666e8c1d84cf7974CbdD8cD817",
        SYMBOL: "przUSDC",
        NAME: "Prize USDC - Aave",
        DECIMALS: 6,
        ASSET: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        ASSETSYMBOL: "USDC",
        ICON: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389",
        GECKO: "usd-coin",
        VAULTICON: "https://app.cabana.fi/icons/pUSDC.e.svg",
      },
      {
        VAULT: "0x3acd377dA549010a197b9Ed0F271e1f621e4b62e",
        LIQUIDATIONPAIR: "0x7cC51678ae7a0C9E63D22a589281a737117BcE3C",
        SYMBOL: "przWETH",
        NAME: "Prize WETH - Aave Lido Market",
        DECIMALS: 18,
        ASSET: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        ASSETSYMBOL: "WETH",
        ICON: "https://uploads-ssl.webflow.com/631993187031511c025c721d/633c1ccea93ff4709ab091c2_633be870ec7f86530e8e5419_WETH.png",
        GECKO: "ethereum",
        VAULTICON: "https://app.cabana.fi/icons/pWETH.svg",
      },
      {
        VAULT: "0x64a60f6117E02914bbcB07dAc14Be2e1CC9Ef04c",
        LIQUIDATIONPAIR: "0x0000000000000000000000000000000000000000",
        SYMBOL: "przSTETH",
        NAME: "Prize stETH - Lido",
        DECIMALS: 18,
        ASSET: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        ASSETSYMBOL: "stETH",
        ICON: "https://assets.coingecko.com/coins/images/13442/standard/steth_logo.png?1696513206",
        GECKO: "staked-ether",
        VAULTICON: "",
      },
    ],
    BOOSTERS: [],
  },
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
    METAREWARDS: "0x0d51a33975024e8afc55fde9f6b070c10aa71dd9",
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
    //       },
  },
  SCROLL: {
    TOKENFAUCET: "",
    ICON: "/images/scroll.svg",
    COLOR: "#dab68d",
    FIRSTDRAWOPENEDAT: 1726178400,
    DRAWPERIODSECONDS: 86400,
    CHAINID: 534352,
    ETHERSCAN: "https://scrollscan.com/",
    PRIZEPOOLSUBGRAPH:
      "https://api.studio.thegraph.com/query/63100/pt-v5-scroll/version/latest",
    PRIZETOKEN: {
      ADDRESS: "0x5300000000000000000000000000000000000004",
      SYMBOL: "WETH",
      NAME: "WETH",
      DECIMALS: 18,
      GECKO: "weth",
      ICON: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
    },
    DRAWMANAGER: "0xa75474749055f71560eb5dcff33605766c69ddf2",
    RNG: "0x4d971a28bb23c6354f7cf1f4666c34b00e94f608",
    TWABCONTROLLER: "0x5ec48e749768aea9956cb38542a9837ec714537d",
    TWABREWARDS: "0x0e71a9a2bd4546e7fc2af47a015747daeb48780d",
    METAREWARDS: "0x0d51a33975024e8afc55fde9f6b070c10aa71dd9",
    LIQUIDATIONROUTER: "0x6f0b0ad2047f349594c8755ac080de9288d6ef7b",
    VAULTFACTORY: "0x3fdd8bfdf2f589c10c58457cdae989c7943a30a5",
    PRIZEPOOL: "0xa6ecd65c3eecdb59c2f74956ddf251ab5d899845",
    CLAIMERFACTORY: "0x9cfe09ae8a5ff3ad386475407833837d0ee38f66",
    CLAIMER: "0xb04d5c80a3f6da11532d3a67184bb7be11f00285",
    VAULTS: [
      {
        VAULT: "0xFEb0Fe9850ABa3A52E72a8a694d422C2B47a5888",
        LIQUIDATIONPAIR: "0xe0030789c3A0547310965A439cB189dfB2f2b745",
        SYMBOL: "przWETH",
        NAME: "Prize WETH - Aave",
        DECIMALS: 18,
        ASSET: "0x5300000000000000000000000000000000000004",
        ASSETSYMBOL: "WETH",
        ICON: "https://uploads-ssl.webflow.com/631993187031511c025c721d/633c1ccea93ff4709ab091c2_633be870ec7f86530e8e5419_WETH.png",
        GECKO: "ethereum",
        VAULTICON: "https://app.cabana.fi/icons/pWETH.svg",
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
  beefy:
    "https://assets.coingecko.com/coins/images/12704/standard/bifi.png?1698202580",
  aave: "https://assets.coingecko.com/coins/images/12645/standard/AAVE.png?1696512452",
  hop: "https://assets.coingecko.com/coins/images/25445/standard/hop.png?1696524577",
  velodrome:
    "https://assets.coingecko.com/coins/images/25783/standard/velo.png?1696524870",
  usdc: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  "usdc.e":
    "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  eth: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png?1696501628",
  thales:
    "https://assets.coingecko.com/coins/images/18388/standard/CLVZJN_C_400x400.png?1696517879",
  lusd: "https://assets.coingecko.com/coins/images/14666/standard/Group_3.png?1696514341",
  wbtc: "https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png?1696507857",
  weth: "https://www.iconarchive.com/download/i109534/cjdowner/cryptocurrency-flat/Ethereum-ETH.1024.png",
  dai: "https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png?1696509996",
  "rocket pool":
    "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  pool: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
  lonser:
    "https://cdn.discordapp.com/avatars/202181199937011712/db0c72d4715f2507d3f60ec1b59f3253?size=1024",
  op: "https://assets.coingecko.com/coins/images/25244/standard/Optimism.png?1696524385",
  timbit:
    "https://cdn.discordapp.com/emojis/1012391997924966491.webp?size=240&quality=lossless",
  aero: "https://assets.coingecko.com/coins/images/31745/standard/token.png?1696530564",
  reth: "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  wreth:
    "https://assets.coingecko.com/coins/images/20764/standard/reth.png?1696520159",
  wsteth:
    "https://assets.coingecko.com/coins/images/18834/standard/wstETH.png?1696518295",
  steth:
    "https://assets.coingecko.com/coins/images/13442/standard/steth_logo.png?1696513206",
  cbeth:
    "https://assets.coingecko.com/coins/images/27008/standard/cbeth.png?1709186989",
  banklessdao:
    "https://assets.coingecko.com/coins/images/15227/standard/j4WEJrwU.png?1696514882",
  moonwell:
    "https://assets.coingecko.com/coins/images/26133/standard/WELL.png?1696525221",
  usdt: "https://assets.coingecko.com/coins/images/325/standard/Tether.png?1696501661",
  angle:
    "https://assets.coingecko.com/coins/images/19060/standard/ANGLE_Token-light.png?1696518509",
  usda: "https://assets.coingecko.com/coins/images/34510/standard/agUSD-coingecko.png?1705288392",
  degen:
    "https://assets.coingecko.com/coins/images/34515/standard/android-chrome-512x512.png?1706198225",
  higher:
    "https://assets.coingecko.com/coins/images/36084/standard/200x200logo.png?1710427814",
  based:
    "https://assets.coingecko.com/coins/images/39669/standard/BASED.jpg?1723603780",
  eurc: "https://assets.coingecko.com/coins/images/26045/standard/euro.png?1696525125",
  world:
    "https://assets.coingecko.com/coins/images/31069/standard/worldcoin.jpeg?1696529903",
};

const WHITELIST_VAULTS = [
  "0x1f16d3ccf568e96019cedc8a2c79d2ca6257894e",
  "0x03d3ce84279cb6f54f5e6074ff0f8319d830dafe", // usdc op
  "0xa52e38a9147f5ea9e0c5547376c21c9e3f3e5e1f",
  "0x2998c1685e308661123f64b333767266035f5020",
  "0x3e8dbe51da479f7e8ac46307af99ad5b4b5b41dc",
  // "0xf1d934d5a3c6e530ac1450c92af5ba01eb90d4de", // op beefy sonne
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
  // "0x6Bb041d7E70b7040611ef688b5e707a799ADe60A", // angle stUSD base
  // "0xcadeacae6976bee87ec5ba44b0a5608a2259c517", // degen
  "0x4e42f783db2d0c5bdff40fdc66fcae8b1cda4a43", // base aave weth
  // "0xfdd33b8413a69ba9ce140b479f27ee7ab133850e", //OP Silo Beefy
  // "0x7affb8cb92ddf9f9d0ba6fdcd7cd7905cb6d2ec1", //rETH Silo Beefy
  // "0xa58163334eba40fa6e81a77c2b36f252a945928a", //Prize WETH - WETH Silo Beefy
  // "0xcc3fefb704be360245f8dd0386ac206941e66467", //WstETH Silo Beefy
  "0x9b4c0de59628c64b02d7ce86f21db9a579539d5a", //WSTETH Beefy
  // "0xb4911efd3d53352f658536afd37e7897cb7dd7f6", //TBTC WBTC Beefy
  "0xa99ec0a1018bf964931c7dc421a5de8bca0e32f1", // USDC Aave Base
  "0x3acd377dA549010a197b9Ed0F271e1f621e4b62e", // ethereum weth
  "0x96fE7B5762bD4405149a9A313473e68a8E870F6C", // eth usdc
  "0x64a60f6117E02914bbcB07dAc14Be2e1CC9Ef04c", // eth steth
  "0xFEb0Fe9850ABa3A52E72a8a694d422C2B47a5888", // eth scroll
  "0x9ee31e845ff1358bf6b1f914d3918c6223c75573", // pool ethereum
  "0x29499e2eb8ff1d076a35c275aeddd613afb1fa9b", // pool scroll
  "0xb75af20ecadabed9049cc2f50e38bad2768b35cf", // ppool gnosis
  "0xbb7e99abccce01589ad464ff698ad139b0705d90", // DAI op
  "0x11271bF9855B679Bc484a0C80a69D8cc72fcEf89", // wineth
  "0xada66220fe59c7374ea6a93bd211829d5d0af75d", // morpho usdc
  "0xdd5e858c0aa9311c4b49bc8d35951f7f069ff46a", // morpho eurc
  "0xD56F6f32473D6321512956a1351D4BceC07914cb", // morpho eth
  "0x78adc13c9ab327c79d10cab513b7c6bd3b346858", // superOETHb
  // "0x8ad5959c9245b64173d4c0c3cd3ff66dac3cab0e", // wld
  "0x0045cC66eCf34da9D8D89aD5b36cB82061c0907C", // pool on wld
];

const WHITELIST_REWARDS: {
  [chain: string]: {
    TOKEN: string;
    SYMBOL: string;
    GECKO: string;
    ICON: string;
  }[];
} = {
  ETHEREUM: [
    {
      TOKEN: "0x0cec1a9154ff802e7934fc916ed7ca50bde6844e",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
  ],

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
    {
      TOKEN: "0x395Ae52bB17aef68C2888d941736A71dC6d4e125",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
  ],
  ARBITRUM: [
    {
      TOKEN: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      SYMBOL: "ARB",
      GECKO: "arbitrum",
      ICON: "https://assets.coingecko.com/coins/images/16547/standard/photo_2023-03-29_21.47.00.jpeg?1696516109",
    },
    {
      TOKEN: "0xCF934E2402A5e072928a39a956964eb8F2B5B79C",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
  ],
  GNOSIS: [
    {
      TOKEN: "0x216a7d520992eD198593A16e0b17c784c9cdc660",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
  ],
  BASE: [
    {
      TOKEN: "0x0578d8A44db98B23BF096A382e016e29a5Ce0ffe",
      SYMBOL: "HIGHER",
      GECKO: "higher",
      ICON: "https://assets.coingecko.com/coins/images/36084/standard/200x200logo.png?1710427814",
    },
    {
      TOKEN: "0xd652C5425aea2Afd5fb142e120FeCf79e18fafc3",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
    {
      TOKEN: "0x32e0f9d26d1e33625742a52620cc76c1130efde6",
      SYMBOL: "BASED",
      GECKO: "based-2",
      ICON: "https://assets.coingecko.com/coins/images/39669/standard/BASED.jpg?1723603780",
    },
  ],
  SCROLL: [
    {
      TOKEN: "0xF9Af83FC41e0cc2af2fba93644D542Df6eA0F2b7",
      SYMBOL: "POOL",
      GECKO: "pooltogether",
      ICON: "https://assets.coingecko.com/coins/images/14003/standard/PoolTogether.png?1696513732",
    },
  ],
};

export { ADDRESS, STARTBLOCK, ICONS, WHITELIST_REWARDS, WHITELIST_VAULTS };
