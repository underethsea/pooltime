import Head from "next/head";
import Image from "next/image";
import type { AppProps } from "next/app";
import "../styles/globals.css";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1.5rem",
  textAlign: "center",
  backgroundColor: "#1a415f",
  color: "#ffffff",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif",
};

const contentStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1rem",
  maxWidth: "36rem",
  width: "100%",
};

const brandRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  margin: 0,
};

const brandStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "Poppins, sans-serif",
  fontSize: "clamp(2.25rem, 8vw, 3.75rem)",
  fontWeight: 900,
  lineHeight: 1.1,
  color: "#ffffff",
};

const headlineStyle: React.CSSProperties = {
  margin: "0.5rem 0 0",
  fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
  fontWeight: 400,
  lineHeight: 1.45,
  color: "rgba(255, 255, 255, 0.92)",
};

const supportStyle: React.CSSProperties = {
  margin: "0.25rem 0 0",
  fontSize: "clamp(1rem, 2.8vw, 1.15rem)",
  fontWeight: 400,
  lineHeight: 1.5,
  color: "rgba(255, 255, 255, 0.78)",
};

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "0.75rem",
  minHeight: "52px",
  width: "100%",
  maxWidth: "22rem",
  padding: "0.9rem 1.25rem",
  boxSizing: "border-box",
  fontSize: "clamp(1.15rem, 4.5vw, 1.4rem)",
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "0.01em",
  color: "#1a415f",
  backgroundColor: "#c4b8f0",
  textDecoration: "none",
  borderRadius: "12px",
  wordBreak: "break-all",
};

// Intentionally ignore Component/pageProps so no existing page UI can render.
function MyApp(_props: AppProps) {
  return (
    <>
      <Head>
        <title>PoolTime has relocated</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="PoolTime has relocated to https://pooly.eth.limo/"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>
      <main style={pageStyle}>
        <div style={contentStyle}>
          <div style={brandRowStyle}>
            <Image
              src="/images/squarepool.png"
              height={72}
              width={72}
              alt="PoolTime"
              priority
            />
            <h1 style={brandStyle}>POOLTIME</h1>
          </div>
          <p style={headlineStyle}>This site has relocated</p>
          <p style={supportStyle}>Continue at</p>
          <a style={linkStyle} href="https://pooly.eth.limo/">
            pooly.eth.limo
          </a>
        </div>
      </main>
    </>
  );
}

export default MyApp;
