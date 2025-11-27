// Save as portfolio-frontend/src/Dashboard.js (or similar)
import React, { useState, useEffect, useCallback } from 'react';

// Using the native WebSocket API for simplicity
const QUOTE_WS_URL = 'ws://localhost:8080/ws/quotes'; // Change to wss:// for production/GKE

function Dashboard() {
  const [portfolio, setPortfolio] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const userId = 1;

  // 1. Fetch Portfolio (REST)
  const fetchPortfolio = useCallback(async () => {
    try {
      // **NOTE:** This URL will be the API Gateway URL in GKE
      const response = await fetch(`http://localhost:8000/portfolio/${userId}`);
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    }
  }, [userId]);

  // 2. Connect to WebSocket for Live Prices
  useEffect(() => {
    fetchPortfolio(); // Fetch portfolio on mount

    const ws = new WebSocket(QUOTE_WS_URL);

    ws.onopen = () => console.log("WebSocket connected!");
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "price_update") {
          // Update live prices state with the new data
          setLivePrices(data.data); 
        }
      } catch (e) {
        console.error("Error parsing WS message:", e);
      }
    };
    
    ws.onclose = () => console.log("WebSocket disconnected.");
    
    // Cleanup function
    return () => ws.close();
  }, [fetchPortfolio]);

  if (!portfolio) return <div>Loading Portfolio...</div>;

  return (
    <div className="portfolio-dashboard">
      <h2>My Stock Portfolio (User ID: {portfolio.user_id})</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Quantity</th>
            <th>Purchase Price</th>
            <th>Live Price</th>
            <th>Gain/Loss (%)</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.holdings.map((holding, index) => {
            const livePrice = livePrices[holding.symbol] || holding.purchase_price;
            const gainLoss = ((livePrice - holding.purchase_price) / holding.purchase_price) * 100;
            return (
              <tr key={index}>
                <td>{holding.symbol}</td>
                <td>{holding.quantity}</td>
                <td>${holding.purchase_price.toFixed(2)}</td>
                <td style={{ color: livePrice > holding.purchase_price ? 'green' : 'red' }}>
                  ${livePrice.toFixed(2)}
                </td>
                <td style={{ color: gainLoss >= 0 ? 'green' : 'red' }}>
                  {gainLoss.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Real-time prices are driven by the Quote Service WebSocket */}
      <p>Last Update: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

export default Dashboard;
