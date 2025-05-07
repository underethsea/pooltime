import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ConnectProps {
  connectText: string;
}
export const MyConnect: React.FC<ConnectProps> = ({ connectText }) => {
  const styles = {
    button: {
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "rgb(123, 104, 196)",
      color: "rgb(255, 255, 255)",
      cursor: "pointer",
      marginTop: "10px",
    },
  };
  return (
    <>
      <style>
        {`
          .chain-name {
            display: inline; /* Default: show chain name */
          }

          @media (max-width: 768px) {
            .chain-name {
              display: none; /* Hide chain name on mobile view */
            }
          @media (max-width: 768px) {
            .chain-button {
              padding: 8px 8px 8px 12px !important;
            }
          }
        `}
      </style>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          // Note: If app doesn't use authentication,
          // can remove all 'authenticationStatus' checks
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");
          return (
            <>
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}>
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="hover-button"
                        style={styles.button}>
                        {connectText}
                      </button>
                    );
                  }
                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        style={styles.button}>
                        Wrong network
                      </button>
                    );
                  }
                  return (
                    <button
                    onClick={openAccountModal}
                    style={{ display: "flex", ...styles.button }}
                    type="button"
                    className="combined-connect-button">
                    {chain.hasIcon && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          openChainModal();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: chain.iconBackground,
                          width: 19,
                          height: 19,
                          borderRadius: 999,
                          overflow: "hidden",
                          marginRight: 8,
                          cursor: 'pointer',
                        }}>
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? "Chain icon"}
                            src={chain.iconUrl}
                            style={chain.name === 'Optimism' ? {} : { width: 14, height: 14 }}
                          />
                        )}
                      </span>
                    )}
                    {account.displayName}
                  </button>
                  );
                })()}
              </div>
            </>
          );
        }}
      </ConnectButton.Custom>
    </>
  );
};
