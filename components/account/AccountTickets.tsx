import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import IconDisplay from "../icons";
import Image from "next/image";
import { GetVaultBalances } from "../../utils/getVaultBalances";
import { GetChainName, GetChainIcon } from "../../utils/getChain";
import {
  VaultData,
  groupVaultsByChain,
} from "../../utils/vaultHelpers";
import { vaultsAPIFormatted } from "../../utils/vaultsFromConstantsAdapter";
import { CropDecimals, NumberWithCommas } from "../../utils/tokenMaths";

interface AccountTicketsProps {
  address?: string;
  prefetchedVaults?: VaultData[];
  prefetchedTicketVaults?: VaultData[];
  loadingOverride?: boolean;
}

const AccountTickets: React.FC<AccountTicketsProps> = ({
  address: addressProp,
  prefetchedVaults,
  prefetchedTicketVaults,
  loadingOverride,
}) => {
  const { address: connectedAddress } = useAccount();
  const address = addressProp || connectedAddress;

  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [ticketVaults, setTicketVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (prefetchedVaults) {
      setVaults(prefetchedVaults);
      return;
    }

    let cancelled = false;

    const loadVaults = async () => {
      setLoading(true);
      let vaultList: VaultData[] = vaultsAPIFormatted as any;
      try {
        const resp = await fetch("https://poolexplorer.xyz/vaults");
        if (resp.ok) {
          vaultList = await resp.json();
        }
      } catch (err) {
        console.error("Failed to fetch vault list, using defaults", err);
      } finally {
        if (!cancelled) {
          setVaults(vaultList);
          setLoading(false);
        }
      }
    };

    loadVaults();

    return () => {
      cancelled = true;
    };
  }, [prefetchedVaults]);

  useEffect(() => {
    if (prefetchedTicketVaults) {
      setTicketVaults(prefetchedTicketVaults);
      return;
    }

    let cancelled = false;

    const loadBalances = async () => {
      if (!address || vaults.length === 0) {
        setTicketVaults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const grouped = groupVaultsByChain(vaults);

        const balanceResults = await Promise.all(
          grouped.map(async ({ chainId, vaults: chainVaults }) => {
            const vaultAddresses = chainVaults.map((vault) => vault.vault);
            const assetAddresses = chainVaults.map((vault) => vault.asset);
            const balances = await GetVaultBalances(
              address,
              vaultAddresses,
              assetAddresses,
              GetChainName(chainId)
            );
            return { chainVaults, balances };
          })
        );

        const flattened = balanceResults.flatMap(({ chainVaults, balances }) =>
          chainVaults.map((vault) => {
            const balance = balances[vault.vault.toLowerCase()];
            const formattedVaultBalance = balance?.vaultBalance
              ? ethers.utils.formatUnits(balance.vaultBalance, vault.decimals)
              : "0";
            const numericVaultBalance = parseFloat(formattedVaultBalance);

            return {
              ...vault,
              vaultBalance: balance?.vaultBalance,
              formattedVaultBalance,
              numericVaultBalance,
            };
          })
        );

        const filtered = flattened
          .filter(
            (vault) => vault.vaultBalance && !vault.vaultBalance.isZero()
          )
          .sort(
            (a, b) => (b.numericVaultBalance || 0) - (a.numericVaultBalance || 0)
          );

        if (!cancelled) {
          setTicketVaults(filtered);
        }
      } catch (err) {
        console.error("Failed to load ticket balances", err);
        if (!cancelled) {
          setTicketVaults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBalances();

    return () => {
      cancelled = true;
    };
  }, [address, vaults, prefetchedTicketVaults]);

  const renderBody = () => {
    if (!address) {
      return <p style={styles.bodyText}>Connect a wallet to view tickets.</p>;
    }

    if (loading) {
      return (
        <div className="vault-table-body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="vault-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="vault-cell vault-left-align">
                <div className="skeleton-item" style={{ width: '70%', height: '20px' }}></div>
              </div>
              <div className="vault-cell vault-deposits-tvl">
                <div className="skeleton-item" style={{ width: '100px', height: '20px', marginLeft: 'auto' }}></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (ticketVaults.length === 0) {
      return <p style={styles.bodyText}>No tickets yet.</p>;
    }

    return (
      <div className="vault-table-body">
        {ticketVaults.map((vault) => {
          const chainIcon = GetChainIcon(vault.c);
          return (
          <Link
            key={`${vault.vault}-${vault.c}`}
            href={`/vault?chain=${vault.c}&address=${vault.vault}`}
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <div className="vault-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="vault-cell vault-left-align" style={styles.ticketCell}>
                <div style={styles.left}>
                  <div style={styles.iconStack}>
                    {chainIcon && (
                      <Image
                        src={chainIcon}
                        alt={GetChainName(vault.c)}
                        width={20}
                        height={20}
                        style={{ borderRadius: "50%" }}
                      />
                    )}
                    <IconDisplay name={vault.assetSymbol} size={22} />
                  </div>
                  <div style={styles.vaultName}>
                    <span>{vault.name}</span>
                  </div>
                </div>
              </div>
              <div className="vault-cell vault-deposits-tvl" style={styles.ticketCell}>
                <div style={styles.right}>
                  <FontAwesomeIcon
                    icon={faTicket}
                    size="sm"
                    style={{ color: "#7b68c4", marginRight: "6px" }}
                  />
                  {NumberWithCommas(
                    CropDecimals(vault.formattedVaultBalance || "0")
                  )}
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Tickets</h2>
        <span style={styles.caption}>Your current prize tickets by vault</span>
      </div>
      {loadingOverride ?? loading ? (
        <div className="vault-table-body">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="vault-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div className="vault-cell vault-left-align">
                <div className="skeleton-item" style={{ width: '70%', height: '20px' }}></div>
              </div>
              <div className="vault-cell vault-deposits-tvl">
                <div className="skeleton-item" style={{ width: '100px', height: '20px', marginLeft: 'auto' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        renderBody()
      )}
    </div>
  );
};

const styles: any = {
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #ebebeb",
    borderRadius: "12px",
    padding: "18px",
    color: "#1a405d",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "19px",
    color: "#1a405d",
    fontWeight: 600,
  },
  caption: {
    color: "#7b68c4",
    fontSize: "14px",
  },
  bodyText: {
    color: "#1a405d",
    margin: 0,
    fontSize: "19px",
  },
  ticketCell: {
    display: "flex",
    alignItems: "center",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  iconStack: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    fontWeight: 600,
    color: "#1a405d",
    fontSize: "19px",
  },
  vaultName: {
    display: "flex",
    flexDirection: "column",
    fontSize: "19px",
    color: "#1a405d",
  },
  chainName: {
    color: "#7b68c4",
    fontSize: "14px",
  },
};

export default AccountTickets;

