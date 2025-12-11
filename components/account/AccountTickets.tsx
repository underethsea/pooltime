import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import LoadGrid from "../loadGrid";
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
        <div style={{ padding: "10px 0" }}>
          <LoadGrid />
        </div>
      );
    }

    if (ticketVaults.length === 0) {
      return <p style={styles.bodyText}>No tickets yet.</p>;
    }

    return (
      <div style={styles.list}>
        {ticketVaults.map((vault) => (
          <Link
            key={`${vault.vault}-${vault.c}`}
            href={`/vault?chain=${vault.c}&address=${vault.vault}`}
            style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
            <div style={styles.row}>
              <div style={styles.left}>
                <div style={styles.iconStack}>
                  <Image
                    src={GetChainIcon(vault.c)}
                    alt={GetChainName(vault.c)}
                    width={20}
                    height={20}
                    style={{ borderRadius: "50%" }}
                  />
                  <IconDisplay name={vault.assetSymbol} size={22} />
                </div>
                <div style={styles.vaultName}>
                  <span>{vault.name}</span>
                </div>
              </div>
              <div style={styles.right}>
                <FontAwesomeIcon
                  icon={faTicket}
                  size="sm"
                  style={{ color: "#7ec9f6", marginRight: "6px" }}
                />
                {NumberWithCommas(
                  CropDecimals(vault.formattedVaultBalance || "0")
                )}
              </div>
            </div>
          </Link>
        ))}
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
        <div style={{ padding: "10px 0" }}>
          <LoadGrid />
        </div>
      ) : (
        renderBody()
      )}
    </div>
  );
};

const styles: any = {
  card: {
    backgroundColor: "#0b1a2a",
    border: "1px solid #24364c",
    borderRadius: "12px",
    padding: "18px",
    color: "#ffffff",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
  },
  caption: {
    color: "#96b0c8",
    fontSize: "13px",
  },
  bodyText: {
    color: "#cdd7e4",
    margin: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#112538",
    border: "1px solid #213349",
    borderRadius: "10px",
    padding: "10px 12px",
    transition: "border-color 0.15s ease, transform 0.15s ease",
    cursor: "pointer",
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
  },
  vaultName: {
    display: "flex",
    flexDirection: "column",
    fontSize: "14px",
  },
  chainName: {
    color: "#7ca1c2",
    fontSize: "12px",
  },
};

export default AccountTickets;

