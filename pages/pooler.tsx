import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetPoolerTwabAllVaults } from '../utils/poolerTwab';

function Pooler() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVaultData = async () => {
      try {
        // Assuming the URL parameter is named 'address'
        const address = router.query.address as string;
        // Hardcoded duration
        const duration = 2592000; // Adjust this value as needed
        const result = await GetPoolerTwabAllVaults(address, duration);
        setData(result);
      } catch (err:any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // Call the function if the address parameter is available
    if (router.isReady && router.query.address) {
      fetchVaultData();
    }
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Vault Data</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default Pooler;
